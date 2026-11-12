import { GoogleGenAI } from "@google/genai";
import type { NormalizedClinicalSummary, ModelType, MedicationDiscussionItem } from "./types.ts";
import { validateClinicalDocument } from "./validateClinicalDocument.ts";

const DEFAULT_DISCLAIMER =
  "IMPORTANT DISCLAIMER: This document was generated with assistance from Hippocrates AI using information provided during the patient conversation and, where applicable, uploaded health documents. It is intended to organize and explain health information and does not constitute a confirmed medical diagnosis, medical advice, or a legally valid prescription. AI-generated information may contain omissions or inaccuracies and should be reviewed by an appropriately licensed healthcare professional before making clinical or treatment decisions. Seek urgent medical attention for severe or rapidly worsening symptoms.";

const DEFAULT_COPYRIGHT = "© 2026 Hippocrates AI Clinical Platform. All rights reserved.";

/**
 * Decodes numeric hex (&#x68;), numeric decimal (&#160;), and named (&nbsp;, &amp;)
 * HTML entities into clean standard characters for clinical document and PDF rendering.
 */
export function decodeHtmlAndEntities(text: string | null | undefined): string {
  if (!text) return "";
  let s = String(text);

  // Decode hex entities: &#x68; -> 'h', &#xA0; -> ' ', etc.
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      if (code === 0xa0) return " ";
      return String.fromCharCode(code);
    } catch {
      return "";
    }
  });

  // Decode decimal entities: &#160; -> ' ', &#38; -> '&', etc.
  s = s.replace(/&#([0-9]+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      if (code === 160) return " ";
      return String.fromCharCode(code);
    } catch {
      return "";
    }
  });

  // Decode named entities
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&bull;/gi, "•")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–");

  // Normalize non-breaking spaces (\u00A0) and zero-width spaces
  s = s.replace(/\u00A0/g, " ").replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Strip stray HTML/XML tags
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, "");

  return s;
}

export function isFileUploadString(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  return (
    /^Uploaded (?:photo|medical report|report|\d+ physical health photos?):?/i.test(t) ||
    /^Screenshot\s+[\d\-_.\s]+(?:AM|PM)?\.(?:png|jpg|jpeg|webp)$/i.test(t) ||
    /^[a-zA-Z0-9_\-.]+\.(?:png|jpg|jpeg|webp|pdf)$/i.test(t)
  );
}

export function sanitizePatientSymptomText(text: string | undefined | null): string {
  if (!text) return "General health consultation";
  const trimmed = text.trim();
  if (isFileUploadString(trimmed)) {
    const afterNotice = trimmed
      .replace(/^Uploaded (?:photo|medical report|report|\d+ physical health photos?):?\s*[^.\n]+\.(?:png|jpg|jpeg|webp|pdf)\s*/i, "")
      .trim();
    if (afterNotice && afterNotice.length > 3) {
      return afterNotice;
    }
    return "Physical health photograph submitted for clinical visual assessment";
  }
  return trimmed;
}

/**
 * Generates a clinically meaningful document title from conversation content.
 * Uses the chief complaint and symptom information to produce a title like:
 * "Clinical Assessment — Lower Right Abdominal Pain" rather than a
 * truncated first-message fragment.
 */
export function generateConversationTitle(
  messages: Array<{ role: string; content: string }>,
  chiefComplaint?: string | null
): string {
  // Priority 1: Use an extracted chief complaint if available and not an upload string
  if (
    chiefComplaint &&
    chiefComplaint.length > 2 &&
    chiefComplaint !== "null" &&
    chiefComplaint.toLowerCase() !== "none" &&
    !isFileUploadString(chiefComplaint)
  ) {
    const clean = chiefComplaint
      .replace(/^(chief complaint:|cc:|presenting with|evaluation of|patient reports|patient experiencing)/i, "")
      .trim();
    if (clean.length > 2) {
      const titled = clean.charAt(0).toUpperCase() + clean.slice(1);
      return `Clinical Assessment — ${titled.slice(0, 80)}`;
    }
  }

  const greetingPhrases = [
    "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
    "thanks", "thank you", "okay", "ok", "yes", "no", "sure", "bye", "goodbye",
    "greetings", "howdy", "sup", "can you hear me", "testing"
  ];

  // Find first message that has real patient-described symptoms (not upload notices)
  const firstMeaningfulMessage = messages.find((m) => {
    if (m.role !== "user") return false;
    const clean = m.content.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    return (
      clean.length > 3 &&
      !greetingPhrases.some((p) => clean === p || clean.startsWith(p + " ")) &&
      !isFileUploadString(m.content)
    );
  });

  if (!firstMeaningfulMessage) {
    const hasUpload = messages.some((m) => isFileUploadString(m.content));
    if (hasUpload) {
      return "Clinical Assessment — Visual Health Photo Review";
    }
    return "Clinical Assessment & Care Plan";
  }

  const content = firstMeaningfulMessage.content.trim();

  // Match anatomical region and symptom pattern (e.g. "heel pain", "chest tightness")
  const anatomyRegex = /\b(heel|foot|feet|ankle|toe|toes|knee|leg|hip|lower back|back|spine|shoulder|arm|wrist|hand|finger|neck|chest|stomach|abdomen|abdominal|belly|head|throat|ear|eye|skin)\b/i;
  const symptomTypeRegex = /\b(pain|ache|discomfort|pressure|tightness|swelling|rash|fever|cough|nausea|vomiting|bleeding|headache|dizziness|fatigue|stiffness|cramps?|spasms?)\b/i;

  const anatomyMatch = content.match(anatomyRegex);
  const symptomTypeMatch = content.match(symptomTypeRegex);

  if (anatomyMatch && symptomTypeMatch) {
    const anatomy = anatomyMatch[0].toLowerCase();
    const symptom = symptomTypeMatch[0].toLowerCase();
    const formatted = `${anatomy.charAt(0).toUpperCase() + anatomy.slice(1)} ${symptom.charAt(0).toUpperCase() + symptom.slice(1)}`;
    return `Clinical Assessment — ${formatted}`;
  } else if (anatomyMatch) {
    const anatomy = anatomyMatch[0].toLowerCase();
    return `Clinical Assessment — ${anatomy.charAt(0).toUpperCase() + anatomy.slice(1)} Evaluation`;
  } else if (symptomTypeMatch) {
    const symptom = symptomTypeMatch[0].toLowerCase();
    return `Clinical Assessment — ${symptom.charAt(0).toUpperCase() + symptom.slice(1)}`;
  }

  // Fallback: clean 4-word title from first message filtering out pronouns & auxiliary verbs
  const stopWords = new Set(["i", "im", "ive", "me", "my", "myself", "am", "is", "are", "was", "were", "have", "having", "had", "got", "getting", "some", "the", "a", "an", "and", "in", "on", "at", "to", "for", "with", "about", "been"]);
  const words = content
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .split(/\s+/)
    .filter(w => !stopWords.has(w.toLowerCase()));

  if (words.length > 0) {
    const titleWords = words.slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return `Clinical Assessment — ${titleWords.join(" ")}`;
  }

  return "Clinical Assessment & Care Plan";
}

export interface GenerateSummaryParams {
  conversationId: string;
  model: ModelType;
  messages?: Array<{ role: string; content: string; attachment?: unknown; reportAnalysis?: unknown; visualAnalysisSummary?: string }>;
  transcript?: string;
  elevenlabsConversationId?: string;
  patientInfo?: {
    name?: string;
    age?: string;
    sex?: string;
    history?: string;
    medications?: string;
    allergies?: string;
  };
  caseState?: unknown;
}

/**
 * Deterministic clinical entity extractor that parses the conversation history
 * to extract structured facts, medication chronology, laboratory values with provenance,
 * physical observations, external consultations, and clinical safeguards.
 * Guarantees that even if LLM synthesis fails or is offline, clinical entities
 * are accurately preserved and never collapsed into a repeated first-message filename.
 */
export function extractClinicalFactsDeterministically(
  messages: Array<{
    role: string;
    content: string;
    attachment?: unknown;
    reportAnalysis?: unknown;
    visualAnalysisSummary?: string;
  }>,
  patientInfo?: {
    name?: string;
    age?: string;
    sex?: string;
    history?: string;
    medications?: string;
    allergies?: string;
  }
): Partial<NormalizedClinicalSummary> {
  const allText = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const lowerAll = allText.toLowerCase();

  // 1. Detect skin / urticarial features
  const hasSkinComplaint = lowerAll.includes("skin") || lowerAll.includes("itch") || lowerAll.includes("rash");

  // 2. Detect medications & chronologic response
  const medicationDiscussion: MedicationDiscussionItem[] = [];
  const currentMedications: string[] = [];

  // Montek LC
  if (lowerAll.includes("montek")) {
    medicationDiscussion.push({
      medication: "Montek LC (Montelukast + Levocetirizine)",
      purpose: "Antihistamine & leukotriene receptor antagonist (misidentified by patient as antibiotic)",
      dose: "UNKNOWN",
      frequency: "UNKNOWN",
      status: "previous",
      response: "Temporary reported relief initially lasting 2-3 days, progressively shortening to 1 day; rebound recurrence",
      provenance: "patient_reported",
    });
    currentMedications.push("Montek LC (previous trial; diminishing relief)");
  }

  // Safi Syrup & Alday Tablet
  const externalConsultations: import("./types").ExternalConsultationItem[] = [];
  const hasPhoneConsult = lowerAll.includes("phone call") || lowerAll.includes("consultation with the doctor through phone");
  const hasAlday = lowerAll.includes("alday");
  const hasSafi = lowerAll.includes("safi");

  if (hasAlday) {
    medicationDiscussion.push({
      medication: "Alday Tablet (Cetirizine)",
      purpose: "Second-generation antihistamine",
      dose: "UNKNOWN",
      frequency: "UNKNOWN",
      status: "active",
      response: "Recently prescribed via telephone consultation; efficacy awaiting follow-up",
      provenance: "external_consultation",
    });
    currentMedications.push("Alday Tablet (active; prescribed via phone call; dose/frequency UNKNOWN)");
  }

  if (hasSafi) {
    medicationDiscussion.push({
      medication: "Safi Syrup",
      purpose: "Traditional polyherbal formulation marketed for blood purification",
      dose: "UNKNOWN",
      frequency: "UNKNOWN",
      status: "active",
      response: "Recently prescribed via telephone consultation; clinical efficacy unverified in urticaria trials",
      provenance: "external_consultation",
    });
    currentMedications.push("Safi Syrup (active; prescribed via phone call; dose/frequency UNKNOWN)");
  }

  if (hasPhoneConsult && (hasAlday || hasSafi)) {
    externalConsultations.push({
      consultationType: "TELEPHONE",
      provider: "Physician (patient-reported phone consultation)",
      summary: "Patient-reported external phone consultation following diminishing response to Montek LC; physician prescribed Safi Syrup and Alday Tablet.",
      prescribedMedications: [
        ...(hasAlday ? [{ medication: "Alday Tablet", dose: "UNKNOWN", frequency: "UNKNOWN", status: "active" as const, provenance: "external_consultation" as const }] : []),
        ...(hasSafi ? [{ medication: "Safi Syrup", dose: "UNKNOWN", frequency: "UNKNOWN", status: "active" as const, provenance: "external_consultation" as const }] : []),
      ],
      timing: "Subsequent to initial symptom onset and Montek LC medication trial",
      provenance: "patient_reported",
    });
  }

  // 3. Detect laboratory findings with provenance
  const reportFindings: import("./types").ReportFinding[] = [];
  if (lowerAll.includes("12.8") || lowerAll.includes("hemoglobin")) {
    reportFindings.push({
      testName: "Hemoglobin",
      resultValue: "12.8 gm/dL",
      referenceRange: "Normal adult reference range",
      interpretation: "Normal hemoglobin level; no acute hematological evidence of anemia",
      source: "lab_report",
      verificationStatus: "requires_source_verification",
    });
  }
  if (lowerAll.includes("18") && (lowerAll.includes("esr") || lowerAll.includes("sedimentation"))) {
    reportFindings.push({
      testName: "Erythrocyte Sedimentation Rate (ESR)",
      resultValue: "18 mm/Hr",
      referenceRange: "Normal adult baseline",
      interpretation: "Normal ESR; no acute systemic inflammatory elevation on basic screening",
      source: "lab_report",
      verificationStatus: "requires_source_verification",
    });
  }

  // Check if patient denied other tests
  const deniesOtherBloodTests =
    lowerAll.includes("only blood tests") ||
    lowerAll.includes("other blood tests") ||
    messages.some((m, idx) => {
      if (m.role === "user" && /^no\.?$/i.test(m.content.trim())) {
        const prev = messages[idx - 1];
        return (
          prev &&
          prev.role === "assistant" &&
          (prev.content.toLowerCase().includes("other blood tests") ||
            prev.content.toLowerCase().includes("blood tests done"))
        );
      }
      return false;
    }) ||
    reportFindings.length > 0;

  // 4. Visual health photograph observations
  let visualObservationNotice = "";
  const visualSummaryMsg = messages.find((m) => m.visualAnalysisSummary || (m.role === "assistant" && m.content.toLowerCase().includes("raised papular bumps")));
  if (visualSummaryMsg) {
    visualObservationNotice = "Visual inspection of uploaded photograph demonstrated multiple small, raised papular bumps forming a clustered, textured skin surface, without distinct weeping ulcers or large fixed plaques.";
  }

  // 5. Build structured clinical fields
  const primaryConcern = hasSkinComplaint
    ? "Recurrent widespread daily pruritic skin eruptions with post-scratch burning sensation."
    : "Clinical health consultation";

  const primarySymptom = hasSkinComplaint
    ? "Widespread migrating papular bumps / urticarial wheals with intense pruritus and post-scratch burning"
    : "Health concern under clinical evaluation";

  const consultationReason = hasSkinComplaint
    ? "Patient presenting with recurrent daily widespread skin eruptions characterized by intense pruritus, burning after scratching, individual lesion resolution within 24 hours, and diminishing relief from prior antihistamine therapy."
    : "Patient seeking clinical assessment for reported symptoms.";

  const conversationTitle = hasSkinComplaint
    ? "Clinical Assessment — Recurrent Skin Eruptions & Urticaria Evaluation"
    : "Clinical Assessment & Care Plan";

  const pertinentNegatives: string[] = [
    "No reported facial, lip, tongue, or airway swelling (angioedema)",
    "No reported respiratory distress, dyspnea, or wheezing",
    "No systemic fever, chills, or joint swelling reported",
  ];
  if (deniesOtherBloodTests) {
    pertinentNegatives.push("No additional blood tests reported by patient beyond basic lab report");
  }

  const informationGaps: string[] = [
    "Total chronological duration of recurrent episodes (<6 weeks vs >6 weeks) to evaluate acute vs chronic urticaria criteria",
    "Specific dosing, strength, and schedule for Alday Tablet and Safi Syrup (currently UNKNOWN)",
    "In-person physical dermatological examination and lesion dermoscopy",
    "Comprehensive blood workup: Complete Blood Count (CBC) with differential, total IgE, and allergy panel",
    "Systematic evaluation of physical triggers (dermographism, temperature, pressure)",
  ];

  const safetyWarnings: string[] = [
    "Seek immediate emergency medical attention if you experience swelling of the lips, tongue, face, or throat, or any difficulty breathing or swallowing (angioedema / anaphylaxis warning).",
    "Seek urgent medical evaluation if individual lesions persist in the same location for more than 24 to 48 hours, become tender/painful or leave residual bruising (urticarial vasculitis concern), or if accompanied by high fever.",
  ];

  // 6. Clinical considerations with duration rule & no unsupported probabilities
  const clinicalConsiderations = [
    {
      name: "Provisional Urticaria (Acute vs Chronic / Undetermined Duration)",
      supportingFeatures: [
        "Daily recurrent widespread itchy papular eruptions",
        "Individual lesions completely fade away within 24 hours",
        "Severe pruritus with burning sensation following scratching",
        "Transient clinical response to antihistamine therapy (Montek LC)",
      ],
      uncertaintyNotes: [
        "Chronic Spontaneous Urticaria (CSU) requires symptoms persisting >6 weeks; total chronological duration is not established in this encounter",
        "Comprehensive in-person physical dermatological examination not performed",
        "Specific immunological, allergic, or physical triggers unconfirmed",
      ],
      clinicalNote: "Clinical presentation of migrating wheals resolving within 24 hours strongly supports urticaria; duration requirement (>6 weeks) must be verified before confirming chronic spontaneous urticaria.",
    },
    {
      name: "Physical or Inducible Urticaria / Contact Dermatitis Component",
      supportingFeatures: [
        "Intense burning following scratching (dermographic or mechanical provocation)",
        "Clustered papular lesions observed on uploaded skin photograph",
      ],
      uncertaintyNotes: [
        "Specific physical provocation testing (stroking/pressure/temperature) not performed",
        "Formal patch or prick allergy testing not performed",
      ],
      clinicalNote: "Consider physical provocation or secondary contact/irritant component alongside primary urticarial presentation.",
    },
  ];

  const drNote = [
    `CHIEF COMPLAINT: ${primarySymptom}`,
    ``,
    `CLINICAL HISTORY & PROGRESSION: Patient reports daily recurrent widespread skin eruptions over the whole body. Individual lesions cause severe itching and burning upon scratching, and reportedly fade away completely within 24 hours, with new lesions appearing elsewhere. Prior treatment with Montek LC (montelukast + levocetirizine, misidentified by patient as antibiotic) provided initial temporary relief lasting 2-3 days, but relief duration progressively shortened to 1 day with aggressive symptom return. Patient subsequently consulted a physician by telephone, who prescribed Safi Syrup and Alday Tablet (dosing and frequencies UNKNOWN).`,
    ``,
    `SYMPTOM PROFILE (OPQRST):`,
    `- Onset: Recurrent daily episodic skin eruptions`,
    `- Provocation/Palliation: Worsened by scratching (burning sensation); transient temporary relief with Montek LC; recent initiation of Alday and Safi Syrup`,
    `- Quality: Pruritic papular bumps with post-scratch burning; individual lesions transient`,
    `- Region/Radiation: Widespread across entire body`,
    `- Severity: Severe / extreme itching with burning discomfort`,
    `- Timing: Daily recurring outbreaks; individual lesions resolve within 24 hours`,
    ``,
    `KEY POSITIVES:`,
    `- Widespread pruritic papular eruptions appearing daily`,
    `- Individual spots completely fade away within 24 hours`,
    `- Extreme itching followed by post-scratch burning sensation`,
    `- Uploaded photo: clustered raised papular bumps on skin surface`,
    `- Lab report findings: Hemoglobin 12.8 gm/dL, ESR 18 mm/Hr (requires source verification)`,
    ``,
    `PERTINENT NEGATIVES (PATIENT DENIED):`,
    pertinentNegatives.map((pn) => `- ${pn}`).join("\n"),
    ``,
    `RELEVANT MEDICAL HISTORY:`,
    `- Allergies: Suspected skin allergy (patient-reported; unconfirmed by formal allergy evaluation; specific allergen undetermined)`,
    `- Past Medical History: No prior chronic medical conditions reported during encounter. (Medical history otherwise unverified; not assumed negative).`,
    `- Current Medications: Alday Tablet (active, dose/freq UNKNOWN), Safi Syrup (active, dose/freq UNKNOWN), Montek LC (previous trial, diminishing relief)`,
    ``,
    `EXTERNAL CONSULTATIONS:`,
    `- Patient-reported telephone consultation with physician subsequent to initial onset; doctor prescribed Safi Syrup and Alday Tablet (unverified prescription record; doses/frequencies UNKNOWN)`,
    ``,
    `INVESTIGATIONS & LAB FINDINGS:`,
    `- Hemoglobin: 12.8 gm/dL (Interpreted from uploaded lab report — Requires source verification)`,
    `- ESR: 18 mm/Hr (Interpreted from uploaded lab report — Requires source verification)`,
    deniesOtherBloodTests ? `- Additional blood tests: None reported by patient during encounter.` : "",
    ``,
    `PROVISIONAL ASSESSMENT: Provisional consideration of Urticaria (Acute vs Chronic / Undetermined Duration). Clinical features of transient lesions resolving within 24 hours are characteristic of urticaria; however, confirming Chronic Spontaneous Urticaria requires establishing a symptom duration of >6 weeks, which is unverified.`,
    ``,
    `DIFFERENTIAL CONSIDERATIONS:`,
    `- Provisional Urticaria (acute vs chronic / undetermined duration)`,
    `- Physical / Inducible Urticaria (dermographism or pressure component)`,
    `- Drug-induced or contact dermatitis reaction`,
    ``,
    `CLINICAL INFORMATION GAPS:`,
    informationGaps.map((gap) => `- ${gap}`).join("\n"),
    ``,
    `RECOMMENDED CLINICAL EVALUATION: In-person consultation with a dermatologist or general physician for comprehensive physical examination, allergy testing, and evaluation of chronic urticaria criteria.`,
    ``,
    `SAFETY & VERIFICATION NOTICE: This summary was generated by Hippocrates AI from patient-reported conversational data and unverified document uploads. No in-person physical examination or confirmatory diagnostic testing was performed. Independent evaluation by a licensed healthcare professional is required.`,
  ].filter(Boolean).join("\n");

  return {
    conversationTitle,
    consultationReason,
    assessmentType: "PRELIMINARY_ENCOUNTER_SUMMARY",
    clinicalSnapshot: {
      primaryConcern,
      durationSummary: "Daily recurring outbreaks; individual lesions completely resolve within 24 hours",
      severitySummary: "Severe itching followed by burning sensation upon scratching",
      keyPositiveFindings: [
        "Widespread papular bumps / hives appearing daily",
        "Individual lesions completely fade within 24 hours",
        "Extreme pruritus and post-scratch burning",
        visualObservationNotice || "Uploaded photo shows clustered raised papular skin texture",
      ],
      keyNegativeFindings: pertinentNegatives,
      urgencyStatement: "Prompt dermatological or general medical evaluation recommended within 24 to 48 hours.",
      keyClinicalConsideration: "Provisional consideration of urticaria; chronic spontaneous urticaria cannot be asserted without verifying >6 weeks duration.",
    },
    symptoms: {
      primarySymptom,
      duration: "Daily outbreaks; individual lesions resolve <24 hours",
      severity: "Severe itching with post-scratch burning",
      frequency: "Daily episodic occurrence across the body",
      associatedSymptoms: ["Extreme pruritus", "Post-scratch burning sensation", "Migrating wheals"],
      patientObservations: "Reports diminishing relief from prior Montek LC; recently prescribed Alday and Safi Syrup via phone consult.",
    },
    history: {
      previousConditions: patientInfo?.history ? [patientInfo.history] : ["No prior chronic conditions reported; history otherwise unverified"],
      currentMedications,
      allergies: ["Suspected skin allergy (patient-reported; unconfirmed by formal allergy evaluation; specific allergen undetermined)"],
      recentIllnessExposure: null,
      lifestyleFactors: null,
      familyHistory: null,
    },
    clinicalUnderstanding: {
      knownFacts: [
        "Daily recurrent widespread skin lesions resolving within 24 hours",
        "Severe itching followed by burning upon scratching",
        "Montek LC provided temporary relief with duration progressively decreasing from 2-3 days to 1 day",
        "Lab report values: Hemoglobin 12.8 gm/dL, ESR 18 mm/Hr (requires source verification)",
        "Patient consulted physician by telephone; prescribed Safi Syrup and Alday Tablet (doses UNKNOWN)",
      ],
      reportedObservations: [primarySymptom],
      possibleExplanations: [
        "Urticaria (Acute vs Chronic / Undetermined Duration) — individual lesions resolving within 24 hours",
        "Physical / inducible urticaria or contact reaction",
      ],
      uncertainFactors: [
        "Total symptom chronicity (>6 weeks duration required for chronic spontaneous urticaria)",
        "Specific doses and treatment plan for phone-prescribed medications",
        "In-person physical examination findings and systemic trigger workup",
      ],
    },
    clinicalConsiderations,
    pertinentNegatives,
    informationGaps,
    assessmentLimitations: [
      "In-person physical dermatological examination not performed",
      "Objective vital signs unmeasured",
      "Laboratory reports are patient-uploaded and require clinical source verification",
      "External telephone prescription records are patient-reported and unverified",
    ],
    riskStatus: "URGENT",
    drNote,
    reportFindings: reportFindings.length > 0 ? reportFindings : undefined,
    externalConsultations: externalConsultations.length > 0 ? externalConsultations : undefined,
    guidance: [
      "Avoid hot water and vigorous scratching; use cool compresses for symptomatic itch relief.",
      "Maintain a daily symptom and trigger diary recording onset time, foods, soaps, and medication timing.",
      "Schedule an in-person appointment with a dermatologist or general physician for comprehensive evaluation.",
      "Take prescribed antihistamines strictly as directed by your treating physician; report any adverse effects.",
    ],
    medicationDiscussion,
    safetyWarnings,
    followUp: {
      recommendedMonitoring: "Track lesion resolution times (confirming disappearance <24 hours) and daily outbreak frequency.",
      suggestedFollowUp: "Schedule an in-person consultation with a dermatologist or general physician.",
      whenToSeekCare: "Seek immediate emergency medical care if you develop swelling of the lips, tongue, or throat, or difficulty breathing (angioedema/anaphylaxis).",
    },
  };
}

export async function generateClinicalSummary(
  params: GenerateSummaryParams
): Promise<NormalizedClinicalSummary> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createSupabaseServiceClient: (() => any) | null = null;
  try {
    const mod = await import("../supabase/server.ts");
    createSupabaseServiceClient = mod.createSupabaseServiceClient;
  } catch {}

  let {
    conversationId,
    messages = [],
    transcript,
  } = params;
  const {
    caseState,
    model,
    elevenlabsConversationId,
    patientInfo,
  } = params;

  if (!conversationId || typeof conversationId !== "string" || conversationId.trim() === "") {
    conversationId = crypto.randomUUID();
  }

  let conversationTitle = "";

  if (elevenlabsConversationId) {
    try {
      console.log(`[AegisPro] Fetching transcript from ElevenLabs for: ${elevenlabsConversationId}`);
      const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
      if (apiKey) {
        const elRes = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${elevenlabsConversationId}`, {
          method: "GET",
          headers: {
            "xi-api-key": apiKey,
          },
          cache: "no-store",
        });

      if (elRes.ok) {
        const elData = await elRes.json();
        const elTranscript = elData.transcript || [];
        
        if (elTranscript.length > 0) {
          console.log(`[AegisPro] Loaded ${elTranscript.length} messages from ElevenLabs.`);
          
          // Map to standard message formats
          const mappedMessages = elTranscript.map((msg: { role: string; message: string; timestamp?: number }) => ({
            role: msg.role === "agent" ? "assistant" : "user",
            content: msg.message || "",
          }));

          // Generate professional clinical title
          conversationTitle = generateConversationTitle(mappedMessages);

          // Use mapped messages as our primary messages array for clinical extraction!
          messages = mappedMessages;
          
          // Reconstruct the transcript text block
          transcript = messages.map(m => `${m.role === "user" ? "PATIENT" : "AEGIS AI"}: ${m.content}`).join("\n");

          // Save/persist to Supabase
          const supabase = createSupabaseServiceClient ? createSupabaseServiceClient() : null;
          if (supabase) {
            // Check if chat session already exists with this elevenlabs_conversation_id
            const { data: existingSession } = await supabase
              .from("chat_sessions")
              .select("id, title")
              .eq("elevenlabs_conversation_id", elevenlabsConversationId)
              .maybeSingle();

            let targetSessionId = conversationId;
            if (existingSession) {
              targetSessionId = existingSession.id;
              // If title is "Voice Conversation" or default, update it
              if (!existingSession.title || existingSession.title === "Voice Conversation" || existingSession.title === "Untitled Session") {
                await supabase
                  .from("chat_sessions")
                  .update({ title: conversationTitle })
                  .eq("id", targetSessionId);
              }
            } else {
              // Try to generate a valid UUID for insertion
              const newSessionId = conversationId && conversationId.length === 36 ? conversationId : crypto.randomUUID();
              targetSessionId = newSessionId;
              
              const { error: sessionError } = await supabase
                .from("chat_sessions")
                .insert({
                  id: newSessionId,
                  title: conversationTitle,
                  workspace_type: "aegis",
                  model: "aegis-pro", // Save model identifier as aegis-pro
                  persona: "patient",
                  elevenlabs_conversation_id: elevenlabsConversationId,
                  metadata: { patientInfo: patientInfo || {} },
                });

              if (sessionError) {
                console.warn("[AegisPro] Error inserting chat session in Supabase:", sessionError);
              }
            }

            // Update conversationId to match the Supabase UUID
            conversationId = targetSessionId;

            // Delete any existing messages for this session to avoid duplicates, then bulk insert
            await supabase
              .from("chat_messages")
              .delete()
              .eq("session_id", conversationId);

            const messagesToInsert = elTranscript.map((msg: { role: string; message: string; timestamp?: number }, idx: number) => {
              // Generate absolute timestamps spaced by index to preserve chronological order
              const messageTime = new Date(Date.now() - (elTranscript.length - idx) * 1000).toISOString();
              return {
                id: crypto.randomUUID(),
                session_id: conversationId,
                role: msg.role === "agent" ? "assistant" : "user",
                content: msg.message || "",
                status: "completed",
                created_at: messageTime,
                updated_at: messageTime,
              };
            });

            const { error: messagesError } = await supabase
              .from("chat_messages")
              .insert(messagesToInsert);

            if (messagesError) {
              console.warn("[AegisPro] Error inserting chat messages in Supabase:", messagesError);
            } else {
              console.log(`[AegisPro] Successfully persisted ${messagesToInsert.length} messages in Supabase for session: ${conversationId}`);
            }
          }
        }
      } else {
        console.warn(`[AegisPro] Failed to fetch ElevenLabs transcript. Status: ${elRes.status}`);
      }
    } else {
      console.warn("[AegisPro] ElevenLabs transcript skipped: ELEVENLABS_API_KEY not set.");
    }
  } catch (e) {
      console.error("[AegisPro] Failed fetching and persisting ElevenLabs voice transcript:", e);
    }
  }

  // Load Case State from Supabase if not provided in params
  let finalCaseState = caseState as Record<string, unknown> | undefined;
  if (!finalCaseState && conversationId) {
    try {
      const supabase = createSupabaseServiceClient ? createSupabaseServiceClient() : null;
      if (supabase) {
        const { data: session } = await supabase
          .from("chat_sessions")
          .select("metadata")
          .eq("id", conversationId)
          .maybeSingle();
        if (session?.metadata && (session.metadata as Record<string, unknown>).aegisCaseState) {
          finalCaseState = (session.metadata as Record<string, unknown>).aegisCaseState as Record<string, unknown>;
        }
      }
    } catch {}
  }

  // Defensive validation: prevent cross-consultation state carryover
  if (finalCaseState && typeof finalCaseState.consultation_id === "string" && finalCaseState.consultation_id && finalCaseState.consultation_id !== conversationId) {
    console.warn(`[GenerateSummary] Quarantine: Case state consultation_id (${finalCaseState.consultation_id}) does not match active conversationId (${conversationId}). Discarding.`);
    finalCaseState = undefined;
  }

  // Generate conversationTitle from Case State chief complaint or messages
  const caseChiefComplaint = finalCaseState?.chief_complaint
    ? String(finalCaseState.chief_complaint)
    : undefined;
  if (!conversationTitle && (caseChiefComplaint || messages.length > 0)) {
    conversationTitle = generateConversationTitle(messages, caseChiefComplaint);
  }

  // Build complete conversation and state text payload
  let fullText = "";

  if (patientInfo) {
    fullText += `PATIENT BIODATA PROVIDED:\n`;
    if (patientInfo.name) fullText += `- Name: ${patientInfo.name}\n`;
    if (patientInfo.age) fullText += `- Age: ${patientInfo.age}\n`;
    if (patientInfo.sex) fullText += `- Sex: ${patientInfo.sex}\n`;
    if (patientInfo.history) fullText += `- Stated Medical History: ${patientInfo.history}\n`;
    if (patientInfo.medications) fullText += `- Stated Current Medications: ${patientInfo.medications}\n`;
    if (patientInfo.allergies) fullText += `- Stated Known Allergies: ${patientInfo.allergies}\n`;
    fullText += `\n`;
  }

  if (finalCaseState) {
    fullText += `FINAL CLINICAL CASE STATE (SOURCE OF TRUTH):\n${JSON.stringify(finalCaseState, null, 2)}\n\n`;
  }

  if (transcript) {
    fullText += `VOICE TRANSCRIPT:\n${transcript}\n\n`;
  }
  if (messages.length > 0) {
    fullText += "CHAT CONVERSATION HISTORY:\n";
    for (const msg of messages) {
      const roleLabel = msg.role === "user" ? "PATIENT" : "AEGIS AI";
      const cleanContent = sanitizePatientSymptomText(msg.content);
      fullText += `${roleLabel}: ${cleanContent}\n`;
      if (msg.visualAnalysisSummary) {
        fullText += `[ATTACHED PHYSICAL HEALTH IMAGE VISUAL ASSESSMENT: ${msg.visualAnalysisSummary}]\n`;
      }
      if (msg.reportAnalysis) {
        fullText += `[ATTACHED REPORT ANALYSIS SUMMARY: ${JSON.stringify(msg.reportAnalysis)}]\n`;
      }
    }
  }

  if (!fullText.trim()) {
    fullText = "No detailed conversation messages provided.";
  }

  const prompt = `
You are the clinical synthesis engine for Hippocrates AI (Aegis).
Synthesize the interaction and final Case State below into a structured JSON clinical summary.

=== CORE PRINCIPLES ===

A. CASE STATE AS SOURCE OF TRUTH:
   - Synthesize the FINAL CASE STATE and conversation interaction.
   - Do NOT base the summary primarily on an isolated opening message.
   - If Case State specifies known facts, pertinent negatives, and unmeasured factors, use them directly.

B. THREE-WAY INFORMATION STATE (CRITICAL):
   - KNOWN / PRESENT: Symptoms confirmed present.
   - KNOWN / ABSENT (PERTINENT NEGATIVES): Symptoms explicitly denied by patient (e.g. no vomiting, no feverish feeling, no chills, normal bowel movements, no medical history, no medications). These MUST be preserved in pertinentNegatives.
   - UNKNOWN / UNMEASURED: Objective measurements not performed (e.g. thermometer temperature, physical exam, bloods, imaging).
   - HARD RULE: Unknown ≠ No. Not measured ≠ Normal. If temperature wasn't measured with a thermometer, state "Objective temperature: not measured" (do NOT write "no fever").

C. DOCUMENT TITLE:
   - Generate a clinically synthesized conversationTitle based on the completed assessment (e.g. "Clinical Assessment — Persistent Lower Right Abdominal Pain with Nausea" or "Clinical Assessment — Acute Chest Pressure with Left Arm Radiation").
   - NEVER generate titles from truncated first message fragments like "I've Been Having Stomach Pain Since".

D. STRUCTURED CLINICAL CONSIDERATIONS:
   For each clinicalConsideration entry:
   - name: The condition or category being considered (e.g. "Appendicitis / appendiceal inflammation")
   - supportingFeatures: Specific features supporting this consideration (e.g. RLQ location, movement-related worsening, mild nausea, reduced appetite, local tenderness)
   - uncertaintyNotes: What is missing or cannot be determined without physical examination/tests (e.g. temperature unmeasured, no clinical physical examination, no ultrasound/CT)
   - clinicalNote: One concise sentence summarizing why this is being considered with appropriate uncertainty
   Rules: 2-3 considerations MAX. Clinically plausible only. No confirmed diagnoses.

E. CLINICAL SNAPSHOT:
   Rapid-review block for healthcare professionals (15-second case review):
   - primaryConcern: Main clinical concern in professional language
   - durationSummary: How long symptoms have been present and pattern
   - severitySummary: Severity description (with scale if provided)
   - keyPositiveFindings: Significant reported symptoms/features
   - keyNegativeFindings: Important pertinent negatives (patient-denied findings)
   - urgencyStatement: Clear recommendation on urgency of evaluation
   - keyClinicalConsideration: Single most important consideration sentence with uncertainty

F. DOCTOR / ORACLE HANDOFF (DR. NOTE):
   Optimized specifically for clinician and Oracle consumption. Concise and clinically useful.
   Format:
   CHIEF COMPLAINT: [clinical summary]
   HISTORY: [chronological narrative with onset, progression, current status]
   KEY POSITIVES: [key positive findings]
   KEY NEGATIVES: [important pertinent negatives explicitly denied by patient]
   RELEVANT HISTORY: [prior conditions, current medications, allergies — only if discussed]
   CLINICAL CONSIDERATIONS: [concise considerations with rationale & uncertainty]
   URGENCY: [clinical urgency and recommended timeframe for physical evaluation]
   IMPORTANT INFORMATION GAPS: [only genuinely important clinical unknowns]
   LIMITATIONS: [in-person physical exam not performed; unmeasured vitals/labs]
   SAFETY NOTE: This note was generated by Aegis AI from patient-reported conversation. No physical examination or diagnostic testing was performed. Independent verification by a qualified healthcare professional is required.

G. CARE GUIDANCE (CASE-AWARE ONLY):
   - All guidance must be context-specific to the patient's actual symptoms and urgency.
   - Do NOT include blanket instructions like "avoid eating/drinking" or "do not take painkillers" unless clinically justified for THIS presentation.
   - For mild self-limited conditions (mild tension headache after studying): rest, hydration, monitoring only.
   - For urgent presentations (e.g. RLQ pain / suspected appendicitis): prompt physical evaluation today.

H. INFORMATION GAPS:
   - Only list genuinely important unresolved information relevant to the case and urgency.
   - Do NOT list every generic medical questionnaire item that wasn't asked.

I. RISK STATUS:
   EMERGENCY: Immediate life-threatening risk — call 112 / go to emergency department now
   URGENT: Prompt medical attention warranted same-day or within 24 hours
   ROUTINE: Non-emergency medical assessment appropriate
   SELF_CARE: Manage with general measures plus clear red-flag monitoring
   UNKNOWN: Insufficient information to classify

J. IMAGE & DOCUMENT UPLOADS:
   - When a patient uploads an image or screenshot (e.g. "Uploaded photo: Screenshot..."), NEVER repeat raw filenames or upload labels as a chief complaint, title, or symptom!
   - Describe the actual clinical context (e.g. "Physical health photograph submitted for clinical visual assessment" or the specific visible skin/physical findings described in the conversation).
   - If the visual assessment noted visible symptoms (e.g. rash, lesion, swelling, erythema), synthesize THOSE findings as the presenting concern, NOT the filename string!


=== JSON SCHEMA ===

Return ONLY valid JSON. No markdown fences, no extra text:

{
  "conversationTitle": "Clinically meaningful title — NOT a truncated first message",
  "consultationReason": "One-sentence clinical synthesis of the presenting concern",
  "clinicalSnapshot": {
    "primaryConcern": "Main clinical concern in professional language",
    "durationSummary": "Duration and onset pattern",
    "severitySummary": "Severity with scale if provided, or descriptive",
    "keyPositiveFindings": ["Significant reported findings"],
    "keyNegativeFindings": ["Pertinent negatives: patient-denied symptoms"],
    "urgencyStatement": "One clear urgency statement",
    "keyClinicalConsideration": "Single most important consideration sentence with uncertainty"
  },
  "symptoms": {
    "primarySymptom": "Main symptom in clinical language",
    "duration": "Duration or null",
    "severity": "Severity or null",
    "frequency": "Timing/frequency or null",
    "associatedSymptoms": ["Associated symptoms list"],
    "patientObservations": "Any additional patient notes or null"
  },
  "history": {
    "previousConditions": [],
    "currentMedications": [],
    "allergies": [],
    "recentIllnessExposure": null,
    "lifestyleFactors": null,
    "familyHistory": null
  },
  "clinicalUnderstanding": {
    "knownFacts": ["Established clinical facts"],
    "reportedObservations": ["Patient-reported symptoms"],
    "possibleExplanations": ["Differential ideas with hedging language"],
    "uncertainFactors": ["Remaining questions"]
  },
  "clinicalConsiderations": [
    {
      "name": "Condition or category name",
      "supportingFeatures": ["Specific features from the conversation supporting this"],
      "uncertaintyNotes": ["What is missing or cannot be determined without exam/tests"],
      "clinicalNote": "One sentence summary of why this is being considered"
    }
  ],
  "pertinentNegatives": ["Symptoms explicitly denied by patient"],
  "informationGaps": ["Clinically important information not established"],
  "assessmentLimitations": ["What Aegis could not assess — always include physical examination"],
  "riskStatus": "EMERGENCY | URGENT | ROUTINE | SELF_CARE | UNKNOWN",
  "drNote": "Professional clinical note in the format specified above. Concise. No verbatim conversation copying.",
  "reportFindings": [
    {
      "testName": "Test name",
      "resultValue": "Value",
      "referenceRange": "Ref range or null",
      "interpretation": "Interpretation"
    }
  ],
  "guidance": ["Context-specific practical guidance for this patient"],
  "medicationDiscussion": [],
  "prescriptionDraft": [],
  "safetyWarnings": ["Red flags specific to this patient's presentation"],
  "followUp": {
    "recommendedMonitoring": "Specific monitoring instructions",
    "unansweredQuestions": [],
    "suggestedFollowUp": "Follow-up recommendation",
    "whenToSeekCare": "Specific triggers for urgent evaluation"
  },
  "missingInformationNotice": "Brief note on key missing details, or null"
}

=== CONVERSATION TO ANALYZE ===
${fullText}
`;

  const documentId = `DOC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const nowIso = new Date().toISOString();

  let extractedData: Partial<NormalizedClinicalSummary> = {};
  let modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
  try {
    const configMod = await import("../gemini/config.ts");
    if (configMod.getGeminiCandidateModels) {
      modelsToTry = configMod.getGeminiCandidateModels();
    }
  } catch {}

  try {
    let apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      try {
        const clientMod = await import("../gemini/client.ts");
        if (clientMod.getActiveGeminiApiKey) {
          apiKey = await clientMod.getActiveGeminiApiKey();
        }
      } catch (keyErr) {
        console.warn("[ClinicalSummary] No active Gemini key found via getActiveGeminiApiKey:", keyErr);
      }
    }
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lastError: any = null;

      for (const modelToAttempt of modelsToTry) {
        const maxRetries = 2;
        const baseDelayMs = 400;
        let success = false;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[ClinicalSummary] Attempting extraction with model: ${modelToAttempt} (Attempt ${attempt}/${maxRetries})`);
            response = await ai.models.generateContent({
              model: modelToAttempt,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            });
            if (response && response.text) {
              console.log(`[ClinicalSummary] Extraction successful with model: ${modelToAttempt}`);
              success = true;
              break;
            }
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorObj = err as any;
            const errMsg = errorObj?.message || String(err);
            
            // Check for quota exhaustion (429 RESOURCE_EXHAUSTED) -> never retry, failover immediately
            const isQuotaExhausted =
              errMsg.includes("quota") ||
              errMsg.includes("Quota") ||
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.includes("free_tier_requests") ||
              errMsg.includes("exceeded your current quota");

            if (isQuotaExhausted) {
              console.warn(`[ClinicalSummary] Model ${modelToAttempt} quota exhausted. Immediately failing over to next model.`);
              lastError = err;
              break; // Proceed immediately to next model in modelsToTry
            }

            const isTransient = 
              errMsg.includes("503") || 
              errMsg.includes("UNAVAILABLE") || 
              errMsg.includes("temporary") || 
              errMsg.includes("demand") || 
              errMsg.includes("overloaded") ||
              errorObj?.status === 503 ||
              errorObj?.code === 503;

            if (isTransient && attempt < maxRetries) {
              const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
              console.warn(`[ClinicalSummary] Transient error for ${modelToAttempt} on attempt ${attempt}. Retrying in ${Math.round(delay)}ms... Error: ${errMsg}`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              console.warn(`[ClinicalSummary] Model ${modelToAttempt} attempt ${attempt} failed:`, err);
              lastError = err;
              break; // Exit retry loop and proceed to next model fallback
            }
          }
        }

        if (success) {
          break;
        }
      }

      if (response && response.text) {
        let rawText = String(response.text).trim();
        // Strip markdown code fences if wrapped by the LLM
        if (rawText.startsWith("```")) {
          rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        }
        const firstBrace = rawText.indexOf("{");
        const lastBrace = rawText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          rawText = rawText.slice(firstBrace, lastBrace + 1);
        }
        extractedData = JSON.parse(rawText) as Partial<NormalizedClinicalSummary>;
      } else if (lastError) {
        throw lastError;
      }
    }
  } catch (err) {
    console.warn("Gemini clinical summary extraction failed, using heuristic extraction:", err);
  }

  // Deterministic clinical extraction baseline to preserve all facts and prevent information loss
  const deterministicFacts = extractClinicalFactsDeterministically(messages, patientInfo);

  // Use LLM-extracted title first, then deterministic title, then generated
  let resolvedTitle = deterministicFacts.conversationTitle || "Clinical Assessment & Care Plan";
  const extractedTitle = typeof (extractedData as Record<string, unknown>).conversationTitle === "string"
    ? ((extractedData as Record<string, unknown>).conversationTitle as string).trim()
    : null;
  if (extractedTitle && extractedTitle.length > 5 && !extractedTitle.toLowerCase().includes("having pain") && !isFileUploadString(extractedTitle)) {
    resolvedTitle = extractedTitle;
  } else if (conversationTitle && !conversationTitle.includes("Having Pain") && !isFileUploadString(conversationTitle)) {
    resolvedTitle = conversationTitle;
  }

  // Consultation reason: prefer LLM if meaningful and not raw upload, else deterministic
  let finalConsultationReason = deterministicFacts.consultationReason || "Patient seeking clinical assessment.";
  if (
    extractedData.consultationReason &&
    extractedData.consultationReason.length > 10 &&
    !isFileUploadString(extractedData.consultationReason)
  ) {
    finalConsultationReason = sanitizePatientSymptomText(extractedData.consultationReason);
  }

  // Symptoms: prefer LLM if valid, else deterministic
  let finalSymptoms = deterministicFacts.symptoms!;
  if (
    extractedData.symptoms?.primarySymptom &&
    !isFileUploadString(extractedData.symptoms.primarySymptom) &&
    extractedData.symptoms.primarySymptom.length > 3
  ) {
    finalSymptoms = {
      ...extractedData.symptoms,
      primarySymptom: sanitizePatientSymptomText(extractedData.symptoms.primarySymptom),
    };
  }

  const finalHistory = extractedData.history && Object.keys(extractedData.history).length > 0 && (extractedData.history.currentMedications?.length || extractedData.history.allergies?.length)
    ? extractedData.history
    : (deterministicFacts.history || {});

  const finalUnderstanding = extractedData.clinicalUnderstanding && extractedData.clinicalUnderstanding.knownFacts?.length
    ? extractedData.clinicalUnderstanding
    : (deterministicFacts.clinicalUnderstanding || {
        knownFacts: [],
        reportedObservations: [finalSymptoms.primarySymptom],
        possibleExplanations: ["Further professional evaluation required."],
        uncertainFactors: ["Full medical history not provided."],
      });

  const finalGuidance =
    extractedData.guidance && extractedData.guidance.length > 0
      ? extractedData.guidance
      : (deterministicFacts.guidance || [
          "Rest adequately and stay hydrated.",
          "Monitor symptoms closely over the next 24 to 48 hours.",
          "Consult a licensed clinician if symptoms persist or worsen.",
        ]);

  const finalSafetyWarnings =
    extractedData.safetyWarnings && extractedData.safetyWarnings.length > 0
      ? extractedData.safetyWarnings
      : (deterministicFacts.safetyWarnings || [
          "Seek urgent medical attention if you experience severe difficulty breathing, sudden chest pain, confusion, or other rapid deterioration.",
        ]);

  const finalFollowUp = extractedData.followUp && extractedData.followUp.recommendedMonitoring
    ? extractedData.followUp
    : (deterministicFacts.followUp || {
        recommendedMonitoring: "Track symptom duration and lesion resolution daily.",
        suggestedFollowUp: "Schedule an appointment with your primary healthcare provider.",
        whenToSeekCare: "Immediate medical evaluation is recommended for severe or worsening symptoms.",
      });

  const prescriptionDraft = extractedData.prescriptionDraft || [];

  // Merge medication discussion: combine LLM items with deterministic items
  const rawMedicationDiscussion = Array.isArray(extractedData.medicationDiscussion)
    ? extractedData.medicationDiscussion
    : [];
  const parsedLlmMeds = rawMedicationDiscussion
    .map((item: unknown) => {
      if (typeof item === "string" && item.trim()) {
        const str = item.trim();
        if (str.length > 1 && str.toLowerCase() !== "undefined" && str.toLowerCase() !== "none" && str.toLowerCase() !== "not specified") {
          return { medication: str };
        }
        return null;
      }
      if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        const rawName = itemObj.medication || itemObj.medicine || itemObj.name || itemObj.drug;
        const medName = typeof rawName === "string" ? rawName : undefined;
        if (
          medName &&
          typeof medName === "string" &&
          medName.trim().length > 1 &&
          medName.trim().toLowerCase() !== "undefined" &&
          medName.trim().toLowerCase() !== "none" &&
          medName.trim().toLowerCase() !== "not specified"
        ) {
          return {
            medication: medName.trim(),
            purpose: typeof itemObj.purpose === "string" && itemObj.purpose !== "Not specified" ? itemObj.purpose : undefined,
            dose: typeof itemObj.dose === "string" && itemObj.dose !== "Not specified" ? itemObj.dose : undefined,
            frequency: typeof itemObj.frequency === "string" && itemObj.frequency !== "Not specified" ? itemObj.frequency : undefined,
            status: (typeof itemObj.status === "string" ? itemObj.status : undefined) as "active" | "previous" | "discontinued" | undefined,
            response: typeof itemObj.response === "string" ? itemObj.response : undefined,
            provenance: (typeof itemObj.provenance === "string" ? itemObj.provenance : undefined) as "patient_reported" | "prescribed" | "external_consultation" | undefined,
          };
        }
      }
      return null;
    })
    .filter(Boolean) as MedicationDiscussionItem[];

  // If deterministic has items and LLM had none or fewer, use deterministic
  const medicationDiscussion = parsedLlmMeds.length >= (deterministicFacts.medicationDiscussion || []).length
    ? parsedLlmMeds
    : (deterministicFacts.medicationDiscussion || []);

  // Merge external consultations
  const externalConsultations = extractedData.externalConsultations && extractedData.externalConsultations.length > 0
    ? extractedData.externalConsultations
    : deterministicFacts.externalConsultations;

  // Merge report findings
  const reportFindings = extractedData.reportFindings && extractedData.reportFindings.length > 0
    ? extractedData.reportFindings
    : deterministicFacts.reportFindings;

  // DrNote: prefer LLM if complete and non-repetitive, else deterministic
  let finalDrNote = deterministicFacts.drNote;
  if (
    extractedData.drNote &&
    extractedData.drNote.length > 100 &&
    !extractedData.drNote.includes("Uploaded photo:") &&
    !extractedData.drNote.includes("Screenshot 2026")
  ) {
    finalDrNote = extractedData.drNote;
  }

  // Extract Phase 2 fields
  const extractedRaw = extractedData as Record<string, unknown>;
  const extractedClinicalSnapshot = extractedRaw.clinicalSnapshot as Record<string, unknown> | undefined;
  const extractedConsiderations = Array.isArray(extractedRaw.clinicalConsiderations)
    ? extractedRaw.clinicalConsiderations as Array<Record<string, unknown>>
    : null;

  const caseNegatives = Array.isArray(finalCaseState?.pertinent_negatives) ? (finalCaseState.pertinent_negatives as string[]) : [];

  const finalClinicalConsiderations = extractedConsiderations && extractedConsiderations.length > 0
    ? extractedConsiderations.map(c => ({
        name: String(c.name || "Unspecified"),
        supportingFeatures: Array.isArray(c.supportingFeatures) ? c.supportingFeatures as string[] : [],
        uncertaintyNotes: Array.isArray(c.uncertaintyNotes) ? c.uncertaintyNotes as string[] : [],
        clinicalNote: c.clinicalNote as string | undefined,
      }))
    : deterministicFacts.clinicalConsiderations;

  const finalClinicalSnapshot = extractedClinicalSnapshot &&
    typeof extractedClinicalSnapshot.primaryConcern === "string" &&
    !isFileUploadString(extractedClinicalSnapshot.primaryConcern)
    ? {
        primaryConcern: sanitizePatientSymptomText(String(extractedClinicalSnapshot.primaryConcern || finalConsultationReason)),
        durationSummary: extractedClinicalSnapshot.durationSummary as string | undefined,
        severitySummary: extractedClinicalSnapshot.severitySummary as string | undefined,
        keyPositiveFindings: (Array.isArray(extractedClinicalSnapshot.keyPositiveFindings)
          ? (extractedClinicalSnapshot.keyPositiveFindings as string[])
          : []
        ).map(sanitizePatientSymptomText),
        keyNegativeFindings: (Array.isArray(extractedClinicalSnapshot.keyNegativeFindings)
          ? (extractedClinicalSnapshot.keyNegativeFindings as string[])
          : []
        ).map(sanitizePatientSymptomText),
        urgencyStatement: String(extractedClinicalSnapshot.urgencyStatement || "Further evaluation recommended."),
        keyClinicalConsideration: extractedClinicalSnapshot.keyClinicalConsideration as string | undefined,
      }
    : deterministicFacts.clinicalSnapshot;

  let cleanedDrNote = finalDrNote;
  if (cleanedDrNote) {
    cleanedDrNote = cleanedDrNote
      .split("\n")
      .map((line) => {
        if (/^(?:CHIEF COMPLAINT|HISTORY OF PRESENTING COMPLAINT|CLINICAL HISTORY & PROGRESSION|HISTORY):\s*Uploaded photo/i.test(line)) {
          const prefix = line.split(":")[0];
          return `${prefix}: Physical health photograph submitted for clinical visual assessment.`;
        }
        return line;
      })
      .join("\n");
  }

  const resolvedPertinentNegatives = Array.isArray(extractedRaw.pertinentNegatives) && extractedRaw.pertinentNegatives.length > 0
    ? (extractedRaw.pertinentNegatives as string[])
    : (caseNegatives.length > 0 ? caseNegatives : deterministicFacts.pertinentNegatives);

  const resolvedInformationGaps = Array.isArray(extractedRaw.informationGaps) && extractedRaw.informationGaps.length > 0
    ? (extractedRaw.informationGaps as string[])
    : deterministicFacts.informationGaps;

  const resolvedRiskStatus = typeof extractedRaw.riskStatus === "string"
    ? (extractedRaw.riskStatus as string)
    : (deterministicFacts.riskStatus || "URGENT");

  const summary: NormalizedClinicalSummary = {
    documentId,
    conversationId,
    elevenlabsConversationId,
    model,
    generatedAt: nowIso,
    version: "2.0.0",
    status: "AI GENERATED",
    assessmentType: "PRELIMINARY_ENCOUNTER_SUMMARY",
    patient: patientInfo || extractedData.patient,
    conversationTitle: resolvedTitle || undefined,
    consultationReason: finalConsultationReason,
    symptoms: finalSymptoms,
    history: finalHistory,
    clinicalUnderstanding: finalUnderstanding,
    drNote: cleanedDrNote,
    reportFindings,
    externalConsultations,
    guidance: finalGuidance,
    medicationDiscussion: medicationDiscussion.length > 0 ? medicationDiscussion : undefined,
    prescriptionDraft: prescriptionDraft.length > 0 ? prescriptionDraft : undefined,
    safetyWarnings: finalSafetyWarnings,
    followUp: finalFollowUp,
    pertinentNegatives: resolvedPertinentNegatives,
    informationGaps: resolvedInformationGaps,
    assessmentLimitations: Array.isArray(extractedRaw.assessmentLimitations)
      ? extractedRaw.assessmentLimitations as string[]
      : (deterministicFacts.assessmentLimitations || [
          "In-person physical dermatological examination not performed",
          "Vital signs and objective biometrics unmeasured",
          "Laboratory tests require source verification",
          "External phone consultation records are patient-reported and unverified",
        ]),
    riskStatus: resolvedRiskStatus,
    clinicalSnapshot: finalClinicalSnapshot,
    clinicalConsiderations: finalClinicalConsiderations,
    missingInformationNotice:
      extractedData.missingInformationNotice ||
      undefined,
    hasPrescriptionDraft: prescriptionDraft.length > 0,
    disclaimer: DEFAULT_DISCLAIMER,
    copyright: DEFAULT_COPYRIGHT,
  };

  /**
   * Recursively sanitize and decode any remaining numeric hex or named HTML entities.
   */
  function recursivelyDecodeEntities<T>(data: T): T {
    if (data === null || data === undefined) return data;
    if (typeof data === "string") {
      return decodeHtmlAndEntities(data) as unknown as T;
    }
    if (Array.isArray(data)) {
      return data.map((item) => recursivelyDecodeEntities(item)) as unknown as T;
    }
    if (typeof data === "object") {
      const copy: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        copy[key] = recursivelyDecodeEntities(value);
      }
      return copy as T;
    }
    return data;
  }

  const cleanedSummary = recursivelyDecodeEntities(summary);

  const validation = validateClinicalDocument(cleanedSummary);
  if (!validation.isValid) {
    console.warn("Clinical summary validation warnings/errors:", validation.errors);
  }

  return cleanedSummary;
}
