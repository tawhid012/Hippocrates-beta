/**
 * Hippocrates AI — Knowledge Hub Medical Educational Repository
 * Structured, evidence-based healthcare educational articles.
 * Strictly adheres to clinical safety, non-diagnostic boundaries, and authentic medical citations.
 */

export interface KnowledgeArticle {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Patient Education" | "Doctor Workflows" | "AI & Clinical Safety";
  readingTime: string;
  datePublished: string;
  dateModified: string;
  author: {
    name: string;
    title: string;
  };
  clinicalReviewer: {
    name: string;
    title: string;
  };
  keywords: string[];
  summaryPoints: string[];
  citations: Array<{
    source: string;
    title: string;
    url?: string;
  }>;
  content: string;
}

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    slug: "understanding-cbc-blood-test",
    title: "How to Understand a Complete Blood Count (CBC) Report",
    subtitle: "A patient-friendly guide to interpreting hemoglobin, WBC, platelets, and red cell indices.",
    description:
      "Learn how to understand your Complete Blood Count (CBC) test results, what reference ranges mean, and how to prepare targeted questions for your doctor.",
    category: "Patient Education",
    readingTime: "6 min read",
    datePublished: "2026-02-10",
    dateModified: "2026-10-17",
    author: {
      name: "Tawhidur Rahman Laskar",
      title: "Hippocrates Health Intelligence Architecture Lead",
    },
    clinicalReviewer: {
      name: "Editorial Clinical Safety Board",
      title: "Hippocrates Clinical Review Protocol",
    },
    keywords: [
      "how to understand CBC reports",
      "complete blood count explained",
      "understanding blood test reports",
      "hemoglobin normal range",
      "WBC count high low meaning",
      "platelet count explanation",
    ],
    summaryPoints: [
      "A CBC measures three primary cellular components: red blood cells (erythrocytes), white blood cells (leukocytes), and platelets (thrombocytes).",
      "Reference ranges vary slightly by laboratory, testing equipment, age, biological sex, and geographic elevation.",
      "An isolated value outside the reference bracket does not automatically denote pathology; physicians evaluate trends and clinical context.",
      "Never alter medication or self-treat based on numerical lab values without a formal medical consultation.",
    ],
    citations: [
      {
        source: "National Institutes of Health (NIH) — MedlinePlus",
        title: "Complete Blood Count: MedlinePlus Medical Test",
      },
      {
        source: "World Health Organization (WHO)",
        title: "Haemoglobin concentrations for the diagnosis of anaemia and assessment of severity",
      },
      {
        source: "Indian Council of Medical Research (ICMR)",
        title: "Guidelines for Standard Laboratory Testing & Reference Intervals in India",
      },
    ],
    content: `
## What is a Complete Blood Count (CBC)?

A Complete Blood Count (CBC) is one of the most frequently ordered diagnostic blood tests in modern healthcare. It provides an objective snapshot of the cells circulating throughout your bloodstream, helping clinicians screen for a broad spectrum of conditions ranging from anemia and viral infections to nutritional deficiencies and bone marrow disorders.

When you receive a laboratory printout, it typically contains dozens of rows with abbreviations, measured quantities, and reference intervals. Below is an educational breakdown of the core parameters measured.

---

## 1. Red Blood Cell (RBC) Indices & Hemoglobin

Red blood cells are responsible for carrying oxygen from your lungs to the tissues throughout your body.

- **Hemoglobin (Hb / Hgb):** The iron-containing protein inside red blood cells that binds oxygen. 
  - *Typical Adult Range:* Approximately 13.0–17.5 g/dL (adult males) and 12.0–15.5 g/dL (adult females).
  - *Context:* Values below the reference threshold often suggest anemia, which can stem from iron deficiency, vitamin B12/folate deficiency, blood loss, or chronic medical conditions. Elevated levels may reflect dehydration, smoking, high-altitude living, or cardiopulmonary factors.
- **Hematocrit (Hct / PCV):** The proportion of your total blood volume made up of red cells, expressed as a percentage.
- **Mean Corpuscular Volume (MCV):** Measures the average physical size of individual red blood cells.
  - *Microcytic (Low MCV):* Cells are unusually small (frequently seen in iron deficiency anemia or thalassemia trait).
  - *Normocytic (Normal MCV):* Cells are standard size (seen in anemia of chronic disease or acute blood loss).
  - *Macrocytic (High MCV):* Cells are unusually large (frequently associated with vitamin B12 or folate deficiency, alcohol use, or certain thyroid states).

---

## 2. White Blood Cells (WBC / Leukocytes)

White blood cells are the central cellular defense mechanism of your immune system.

- **Total Leukocyte Count (TLC):**
  - *Typical Adult Range:* 4,000 to 11,000 cells per microliter (cells/mcL).
  - *Leukocytosis (Elevated):* Commonly indicates an acute bacterial or viral infection, physical trauma, inflammatory flare-up, or intense physiological stress.
  - *Leukopenia (Depressed):* May arise from viral infections, autoimmune conditions, bone marrow suppression, or specific medications.
- **Differential Count:** Breaks down the five primary varieties of white blood cells:
  1. **Neutrophils (40–70%):** The primary rapid responders against bacterial infections.
  2. **Lymphocytes (20–40%):** Responsible for viral defense and antibody production.
  3. **Monocytes (2–8%):** Scavenger cells that eliminate tissue debris and chronic pathogens.
  4. **Eosinophils (1–4%):** Involved in allergic responses and defense against parasitic organisms.
  5. **Basophils (0.5–1%):** Involved in systemic inflammatory and histamine reactions.

---

## 3. Platelets (Thrombocytes)

Platelets are specialized cell fragments essential for normal blood clotting and vascular repair.

- *Typical Adult Range:* 150,000 to 450,000 platelets per microliter.
- *Thrombocytopenia (Low Platelets):* Can lead to easy bruising, petechiae (pinpoint red skin spots), and prolonged bleeding. Common triggers include viral infections (such as Dengue), autoimmune platelet destruction, or medications.
- *Thrombocytosis (High Platelets):* Can be reactive (secondary to acute infection, iron deficiency, or inflammation) or primary (essential thrombocythemia).

---

## How to Prepare for Your Doctor Appointment

When reviewing lab reports with your physician, having targeted questions leads to far more actionable discussions:

1. *"Does this result align with the symptoms I've been experiencing over recent weeks?"*
2. *"Is this an isolated variation, or does it represent a notable shift from my previous baseline records?"*
3. *"Could current medications, hydration levels, or dietary supplements be influencing these numbers?"*
4. *"Do we need confirmation with follow-up testing (such as ferritin, iron profile, or peripheral smear)?"*

> **Clinical Safety Note:** Medical laboratory reports must always be interpreted in the context of your complete medical history, physical examination, and clinical findings. Hippocrates Aegis provides educational clarification to help you communicate more effectively with your healthcare provider; it does not issue medical diagnoses.
    `,
  },
  {
    slug: "how-to-prepare-for-doctor-visit",
    title: "How to Prepare for a Doctor Consultation: A Patient Guide",
    subtitle: "Practical strategies to organize your symptoms, medication history, and questions for maximum clinical clarity.",
    description:
      "Maximize the value of your doctor appointments with this systematic guide to chronicling symptoms, organizing medical records, and asking high-yield questions.",
    category: "Patient Education",
    readingTime: "5 min read",
    datePublished: "2026-02-15",
    dateModified: "2026-10-17",
    author: {
      name: "Ahmed Al-Ferdous",
      title: "Hippocrates Clinical Interface Lead",
    },
    clinicalReviewer: {
      name: "Editorial Clinical Safety Board",
      title: "Hippocrates Clinical Review Protocol",
    },
    keywords: [
      "preparing questions for a doctor",
      "how to prepare for doctor visit",
      "patient doctor communication",
      "symptom timeline template",
      "effective clinical consultation",
    ],
    summaryPoints: [
      "Physicians typically have 10–20 minutes per standard consultation; structured preparation directly improves diagnostic precision.",
      "Use the OPQRST framework (Onset, Provocation, Quality, Radiation, Severity, Timing) to articulate symptoms clearly.",
      "Bring an exhaustive list of all current prescriptions, over-the-counter supplements, and herbal products.",
      "Prioritize your top three clinical concerns at the opening minute of your visit.",
    ],
    citations: [
      {
        source: "Agency for Healthcare Research and Quality (AHRQ)",
        title: "Question Builder: Be More Involved in Your Health Care",
      },
      {
        source: "Mayo Clinic Patient Care Resources",
        title: "Making the Most of Your Doctor Visit",
      },
      {
        source: "General Medical Council (GMC)",
        title: "Good medical practice: Working in partnership with patients",
      },
    ],
    content: `
## Why Preparation Matters in Modern Healthcare

In today's fast-paced clinical environments, physicians often manage demanding patient schedules with constrained consultation times. Studies repeatedly show that when patients arrive with organized symptom chronologies and concise question lists:

- Diagnostic accuracy improves significantly.
- Need for redundant lab investigations decreases.
- Treatment adherence and satisfaction increase for both patient and clinician.

---

## 1. Structuring Your Symptoms: The OPQRST Method

Clinicians are trained to think systematically. Describing your concerns using clinical dimensions helps your doctor grasp the core picture immediately:

- **Onset:** Exactly when did this start? Was it sudden (seconds/minutes) or gradual (days/weeks)?
- **Provocation / Palliation:** What makes it noticeably worse (walking, eating, bending, stress)? What provides relief (rest, warm water, cold compress, elevation)?
- **Quality:** What does the sensation actually feel like? (e.g., sharp, dull ache, burning, throbbing, pressure, pins-and-needles)?
- **Radiation:** Does the discomfort stay in one spot, or does it travel elsewhere (e.g., lower back pain radiating down the left leg)?
- **Severity:** On a scale from 1 to 10 (where 10 is the worst imaginable discomfort), how would you rate it at rest versus activity?
- **Timing / Frequency:** Is it continuous throughout the 24 hours, or episodic? Does it wake you from sleep at night?

---

## 2. Compile an Exhaustive Medication Record

Drug interactions and side effects account for a substantial percentage of non-specific symptoms (such as fatigue, dizziness, dry cough, and gastrointestinal upset). Always document:

1. **Prescription Drugs:** Exact names, dosages (e.g., 50 mg vs 100 mg), and frequency.
2. **Over-the-Counter Products:** Pain relievers (NSAIDs, paracetamol), antacids, and sleep aids.
3. **Supplements & Herbal Formulations:** Iron, calcium, vitamin D, ashwagandha, multivitamin blends.
4. **Known Drug Allergies:** Specific past allergic reactions (e.g., penicillin causing urticaria/hives).

---

## 3. High-Yield Questions to Ask Your Clinician

Before concluding your visit, ensure you have mutual alignment on these key questions:

- *"What do you consider the most probable explanation for my symptoms?"*
- *"Are there red-flag symptoms that should prompt immediate emergency evaluation?"*
- *"What are the potential side effects of this newly initiated medication?"*
- *"When should we expect noticeable symptom improvement, and when should we schedule a follow-up review?"*

Hippocrates Aegis is purposefully designed to help patients practice this clarity before walking into their appointments, translating vague sensations into coherent clinical timelines.
    `,
  },
  {
    slug: "ai-clinical-decision-support-explained",
    title: "AI Clinical Decision Support: How Copilots Assist Physicians",
    subtitle: "A balanced technical and clinical examination of differential reasoning models, safety rails, and human-in-the-loop governance.",
    description:
      "Explore how clinical AI copilots like Oracle support physicians with differential diagnosis, guideline synthesis, and documentation without replacing clinical judgment.",
    category: "Doctor Workflows",
    readingTime: "7 min read",
    datePublished: "2026-02-20",
    dateModified: "2026-10-17",
    author: {
      name: "Tawhidur Rahman Laskar",
      title: "Hippocrates Health Intelligence Architecture Lead",
    },
    clinicalReviewer: {
      name: "Editorial Clinical Safety Board",
      title: "Hippocrates Clinical Review Protocol",
    },
    keywords: [
      "AI clinical copilot",
      "clinical decision support software",
      "AI tools for doctors",
      "differential diagnostic software",
      "clinical workflow assistance",
    ],
    summaryPoints: [
      "Clinical AI copilots function strictly as cognitive augmenters and decision-support systems, never autonomous diagnostic engines.",
      "Multi-model synthesis combines specialized LLM reasoning with curated medical evidence bases to reduce cognitive fatigue.",
      "Differential reasoning checklists help clinicians guard against anchoring bias and rare-disease oversight.",
      "Strict physician registration and audit logging safeguard against unauthorized or unverified usage.",
    ],
    citations: [
      {
        source: "World Health Organization (WHO)",
        title: "Ethics and governance of artificial intelligence for health: WHO guidance",
      },
      {
        source: "The Lancet Digital Health",
        title: "Clinical validation frameworks for generative artificial intelligence in medicine",
      },
      {
        source: "National Academy of Medicine (NAM)",
        title: "Artificial Intelligence in Health Care: The Hope, The Hype, The Promise, The Peril",
      },
    ],
    content: `
## The Shift from Static Guidelines to Contextual Copilots

Physicians today confront an overwhelming deluge of biomedical literature, with thousands of peer-reviewed clinical trials and updated treatment guidelines published monthly. Coupled with administrative documentation burdens and soaring patient volumes, clinician cognitive fatigue represents a pressing global challenge.

Clinical AI copilots, such as Hippocrates Oracle, represent a paradigm shift: rather than serving as rigid rules-based calculators or black-box diagnostic claim generators, they act as **interactive, evidence-grounded cognitive assistants** operating under continuous human oversight.

---

## Core Capabilities of Modern Clinical Decision Support

### 1. Differential Diagnosis Broadening
One of the most dangerous cognitive traps in medicine is **anchoring bias**—fixating on an initial diagnostic hypothesis and prematurely closing consideration of alternative etiologies. 

When a physician inputs a complex clinical case (e.g., a 42-year-old presenting with dyspnea, joint pain, and microscopic hematuria), Oracle generates an organized differential checklist categorized by:
- Common etiologies
- Atypical presentations
- High-risk "can't-miss" conditions (e.g., systemic vasculitis, infective endocarditis)
- Pertinent negative findings required to rule each condition in or out

### 2. Clinical Risk Stratification
Rather than replacing clinical risk calculators, Oracle integrates recognized clinical scoring frameworks (such as CRB-65 / CURB-65 for pneumonia, Wells' criteria for pulmonary embolism, and CHA₂DS₂-VASc for atrial fibrillation) directly into the discussion workflow, highlighting missing variables necessary to compute accurate scores.

### 3. Evidentiary Guideline Synthesis
Copilots cross-reference treatment recommendations against established professional guidelines (e.g., ICMR, AHA, ESC, NICE), providing the clinician with structured summaries of first-line, second-line, and contraindicated therapeutic regimens.

---

## Safety Rails & Non-Autonomous Guardrails

Responsible healthcare AI must incorporate strict architectural safeguards:

1. **No Autonomous Action:** Oracle does not issue prescriptions, sign medical orders, or finalize diagnostic codes. All evaluations are provisional suggestions for the licensed physician's independent review.
2. **Doctor Verification Enforcement:** Access to Oracle is restricted to registered medical professionals who verify their Medical Council registration numbers.
3. **Controlled Fallback Architecture:** If an AI model expresses low confidence or contradictory evidence, the system explicitly highlights diagnostic uncertainty rather than generating speculative conclusions.
4. **Zero-PII Analytics:** No patient identifiers, consultation transcripts, or clinical notes are transmitted to commercial marketing trackers or advertising networks.
    `,
  },
  {
    slug: "understanding-thyroid-panels",
    title: "Understanding Thyroid Blood Tests: TSH, Free T3, and Free T4",
    subtitle: "A clinical guide to the hypothalamic-pituitary-thyroid axis, lab interpretations, and common testing pitfalls.",
    description:
      "Understand what TSH, Free T4, and Free T3 blood tests mean, how thyroid feedback loops function, and when to discuss your results with an endocrinologist.",
    category: "Patient Education",
    readingTime: "6 min read",
    datePublished: "2026-03-01",
    dateModified: "2026-10-17",
    author: {
      name: "Ahmed Al-Ferdous",
      title: "Hippocrates Clinical Interface Lead",
    },
    clinicalReviewer: {
      name: "Editorial Clinical Safety Board",
      title: "Hippocrates Clinical Review Protocol",
    },
    keywords: [
      "how to understand thyroid reports",
      "TSH high low meaning",
      "Free T4 Free T3 test",
      "hypothyroidism symptoms",
      "hyperthyroidism blood test",
    ],
    summaryPoints: [
      "TSH (Thyroid Stimulating Hormone) is produced by the pituitary gland to regulate thyroid gland hormone synthesis via negative feedback.",
      "High TSH with low Free T4 typically indicates primary hypothyroidism; low TSH with elevated Free T4/T3 indicates hyperthyroidism.",
      "Subclinical thyroid states occur when TSH is abnormal while Free T4 remains within the standard bracket.",
      "Biotin supplements can severely distort immunoassays, causing falsely high Free T4 or falsely low TSH readings.",
    ],
    citations: [
      {
        source: "American Thyroid Association (ATA)",
        title: "Thyroid Function Tests Guide",
      },
      {
        source: "The Endocrine Society",
        title: "Clinical Practice Guideline: Management of Thyroid Dysfunction",
      },
      {
        source: "Indian Thyroid Society (ITS)",
        title: "Guidelines for Diagnosis and Management of Hypothyroidism",
      },
    ],
    content: `
## How the Thyroid Regulatory Loop Operates

The thyroid is a butterfly-shaped endocrine gland situated at the base of your neck. It synthesizes thyroxine (T4) and triiodothyronine (T3), hormones that govern your body's metabolic velocity, thermoregulation, heart rate, and cellular energy production.

To understand thyroid lab panels, one must understand the **negative feedback loop**:

1. **The Pituitary Gland (The Thermostat):** Releases Thyroid Stimulating Hormone (TSH) into the circulation.
2. **The Thyroid Gland (The Furnace):** In response to TSH, it produces T4 (approx 80%) and T3 (approx 20%).
3. **The Feedback Mechanism:** When circulating T4 and T3 levels are low, the pituitary gland cranks up TSH output to stimulate the thyroid. Conversely, when thyroid hormone levels are abundantly high, the pituitary slows or halts TSH secretion.

---

## The Core Thyroid Blood Markers

### 1. TSH (Thyroid Stimulating Hormone)
- *Standard Adult Reference Interval:* Generally 0.4 to 4.5 mIU/L (varies slightly by laboratory and trimester in pregnancy).
- *High TSH:* Most commonly signals an underactive thyroid (primary hypothyroidism). The pituitary is signaling vigorously because circulating hormone levels are inadequate.
- *Low TSH:* Most commonly signals an overactive thyroid (hyperthyroidism) or excessive replacement hormone dosage.

### 2. Free T4 (Free Thyroxine)
- Represents the unbound, biologically active fraction of T4 available to body tissues.
- *Free T4 vs Total T4:* Free T4 is far more reliable because Total T4 is swayed by pregnancy, oral contraceptives, and liver proteins that bind hormones.

### 3. Free T3 (Free Triiodothyronine)
- T3 is the most potent, active thyroid hormone. Most T3 is formed in peripheral tissues through conversion from T4.
- Essential in diagnosing hyperthyroidism, toxic adenomas, or assessing conversion efficiency.

---

## Common Patterns Encountered on Lab Reports

| Condition | TSH | Free T4 | Free T3 | Common Clinical Picture |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Hypothyroidism** | Elevated (High) | Depressed (Low) | Normal to Low | Fatigue, weight gain, cold intolerance, dry skin, constipation |
| **Subclinical Hypothyroidism** | Mildly Elevated | Normal | Normal | Often asymptomatic or mild non-specific lethargy |
| **Primary Hyperthyroidism** | Suppressed (Low) | Elevated (High) | Elevated (High) | Palpitations, tremors, weight loss, heat intolerance, anxiety |
| **Subclinical Hyperthyroidism** | Suppressed (Low) | Normal | Normal | Requires specialist review for arrhythmia/bone risk |

---

## Important Testing Pitfall: The Biotin Warning

Biotin (Vitamin B7), commonly found in over-the-counter hair, skin, and nail supplements, interferes directly with the streptavidin-biotin technology used in many automated laboratory immunoassays. 

High doses of biotin can cause **falsely depressed TSH and falsely elevated Free T4/T3**, mimicking severe Graves' disease or hyperthyroidism in an otherwise healthy patient. The American Thyroid Association recommends discontinuing high-dose biotin supplements at least 48 to 72 hours before a scheduled thyroid blood test.
    `,
  },
  {
    slug: "responsible-ai-in-healthcare",
    title: "Responsible AI in Healthcare: Safety, Bias, and Clinical Governance",
    subtitle: "How Hippocrates builds ethical, accountable AI systems designed to augment human medical expertise without overstepping.",
    description:
      "A deep dive into our clinical safety framework: emergency red-flag gates, zero-hallucination protocols, bias mitigation, and clinician-in-the-loop governance.",
    category: "AI & Clinical Safety",
    readingTime: "6 min read",
    datePublished: "2026-03-10",
    dateModified: "2026-10-17",
    author: {
      name: "Tawhidur Rahman Laskar",
      title: "Hippocrates Health Intelligence Architecture Lead",
    },
    clinicalReviewer: {
      name: "Abdul Basith Barbhuiya",
      title: "Project Academic Guide & System Evaluator",
    },
    keywords: [
      "responsible AI in healthcare",
      "benefits and limitations of healthcare AI",
      "AI safety in medicine",
      "clinical AI ethics",
      "hallucination prevention in clinical LLMs",
    ],
    summaryPoints: [
      "Responsible healthcare AI requires strict architectural bounds between general consumer health literacy and licensed medical practice.",
      "Emergency red flags (e.g., crushing chest pain, acute neurological deficits) trigger immediate emergency escalation protocols.",
      "Multi-turn clinical state isolation ensures that distinct consultations remain completely un-contaminated by previous sessions.",
      "Hippocrates adheres to zero-data monetization: patient conversations and records are never sold, rented, or repurposed for commercial ad profiles.",
    ],
    citations: [
      {
        source: "World Health Organization (WHO)",
        title: "Regulatory considerations on artificial intelligence for health",
      },
      {
        source: "Indian Council of Medical Research (ICMR)",
        title: "Ethical Guidelines for Application of Artificial Intelligence in Biomedical Research and Healthcare",
      },
      {
        source: "Coalition for Health AI (CHAI)",
        title: "Blueprint for Trustworthy AI Implementation Guidance and Assurance for Healthcare",
      },
    ],
    content: `
## The Imperative of Clinical Responsibility

Artificial intelligence holds tremendous promise for global healthcare: it can dismantle medical jargon for patients, streamline documentation for overburdened physicians, and illuminate differential possibilities that might otherwise be overlooked.

However, healthcare is fundamentally different from other software domains. In medicine, errors are not mere software bugs—they carry tangible implications for human well-being. At Hippocrates, we operate under a foundational tenet: **Healthcare AI must be designed from the ground up with clinical safety, ethical transparency, and verifiable boundaries.**

---

## 1. The Dual-Engine Isolation Philosophy

One of the most frequent architectural failures in general-purpose AI is attempting to use a single monolithic chatbot for both consumers and specialists. This inevitably results in either over-simplification for doctors or overwhelming technical jargon for patients.

Hippocrates solves this through strict **Dual-Engine Architecture**:
- **Aegis (Patient Intelligence):** Engineered for empathy, clarity, structured symptom exploration, and doctor visit preparation. It strictly avoids issuing autonomous clinical diagnoses or prescribing medications.
- **Oracle (Physician Copilot):** Engineered for clinical depth, multi-model differential reasoning, clinical guideline cross-referencing, and documentation support. It requires verified physician credentials before access is granted.

---

## 2. Emergency Escalation & Red-Flag Gates

A responsible clinical AI must possess immediate, deterministic mechanisms to recognize life-threatening emergencies. 

When a user mentions critical red-flag symptoms—such as:
- Crushing retrosternal chest pain radiating to the jaw or left arm
- Acute onset facial drooping, arm weakness, or speech slurring (FAST criteria)
- Severe sudden dyspnea accompanied by cyanosis
- Active suicidal ideation with immediate intent

Hippocrates halts conversational exploration immediately, suppresses non-urgent differential banter, and presents prominent emergency escalation directives advising the patient or caregiver to call local emergency services (e.g., 108 / 112 in India, 911 in the US) or proceed to the nearest emergency room immediately.

---

## 3. Strict Consultation State Isolation

In clinical practice, cross-patient contamination can cause severe diagnostic errors. In AI systems, this manifests when remnants of a previous user consultation bleed into the context window of a subsequent case.

Hippocrates enforces strict **Clinical State Isolation**:
- Each consultation initializes with a pristine context state.
- Consultation summaries and physician notes are sandboxed per case ID.
- In-memory bounded caches and database row-level security (RLS) enforce 100% cryptographic separation across authenticated user profiles.

---

## 4. Transparent Limits and Human-in-the-Loop Oversight

Hippocrates is an assistant, not a replacement for human clinicians. We maintain unwavering transparency regarding what AI can and cannot do:
- AI does not perform physical palpation, auscultation, or surgical intervention.
- AI models can exhibit stochastic variability; all clinical outputs must be reviewed and corroborated by a licensed human physician.
- We reject hype and false claims of autonomous medical omniscience. Genuine progress in healthcare AI is measured in verified safety, clinical alignment, and human trust.
    `,
  },
  {
    slug: "understanding-liver-function-tests",
    title: "How to Understand a Liver Function Test (LFT) Report",
    subtitle: "A patient's guide to decoding SGOT (AST), SGPT (ALT), Bilirubin, and Alkaline Phosphatase.",
    description:
      "Learn what liver enzyme tests mean: understand SGOT/AST, SGPT/ALT, total and direct bilirubin, and how to discuss elevated liver enzymes with your doctor.",
    category: "Patient Education",
    readingTime: "6 min read",
    datePublished: "2026-03-15",
    dateModified: "2026-10-18",
    author: {
      name: "Tawhidur Rahman Laskar",
      title: "Hippocrates Health Intelligence Architecture Lead",
    },
    clinicalReviewer: {
      name: "Editorial Clinical Safety Board",
      title: "Hippocrates Clinical Review Protocol",
    },
    keywords: [
      "how to understand liver function tests",
      "SGPT ALT high meaning",
      "SGOT AST normal range",
      "bilirubin high in blood test",
      "LFT test report explained",
      "fatty liver blood test markers",
    ],
    summaryPoints: [
      "Liver function tests measure enzymes (ALT, AST, ALP) and proteins (albumin, bilirubin) to assess hepatic inflammation, bile flow, and synthetic capacity.",
      "ALT (SGPT) is more specific to the liver than AST (SGOT), which is also present in heart and skeletal muscle tissue.",
      "Mild elevations in ALT/AST are frequently associated with non-alcoholic fatty liver disease (NAFLD), medications, or recent vigorous exercise.",
      "Never discontinue prescribed medications based on liver lab numbers without consulting your prescribing physician.",
    ],
    citations: [
      {
        source: "American College of Gastroenterology (ACG)",
        title: "ACG Clinical Guideline: Evaluation of Abnormal Liver Chemistries",
      },
      {
        source: "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)",
        title: "Liver Function Tests: Understanding What They Measure",
      },
      {
        source: "Indian National Association for Study of the Liver (INASL)",
        title: "Clinical Guidelines for the Assessment of Non-Alcoholic Fatty Liver Disease",
      },
    ],
    content: `
## What Does a Liver Function Test (LFT) Measure?

The liver is the body's primary biochemical laboratory, performing over 500 vital functions—including filtering metabolic toxins, synthesizing critical blood-clotting proteins, regulating cholesterol, and producing bile to digest dietary fats.

A Liver Function Test (LFT)—more accurately described as a **hepatic biochemical panel**—measures specific enzymes, proteins, and pigments circulating in your blood. Rather than assessing a single variable, clinicians examine the **pattern and ratio** of these biomarkers to determine whether a concern originates from liver cell injury (hepatocellular), bile duct obstruction (cholestatic), or reduced protein production (synthetic).

---

## 1. Liver Enzymes: ALT (SGPT) and AST (SGOT)

When liver cells (hepatocytes) undergo stress, inflammation, or injury, their outer membranes become permeable, leaking internal enzymes into the bloodstream:

- **ALT (Alanine Aminotransferase / SGPT):**
  - *Standard Adult Range:* Approximately 7 to 56 units per liter (U/L) (varies by laboratory and biological sex).
  - *Clinical Significance:* ALT is concentrated predominantly within liver cells, making it a highly specific indicator of hepatic inflammation. Common triggers for mild to moderate elevations include non-alcoholic fatty liver disease (NAFLD/MASLD), viral hepatitis, alcohol consumption, and certain prescription medications (such as statins or NSAIDs).
- **AST (Aspartate Aminotransferase / SGOT):**
  - *Standard Adult Range:* Approximately 10 to 40 U/L.
  - *Clinical Significance:* AST is present in liver cells, but also abundantly in cardiac muscle, skeletal muscle, kidneys, and brain tissue. Elevated AST alongside normal ALT frequently points to non-hepatic origins (such as strenuous weight training, muscle injury, or hemolysis).
- **The AST/ALT Ratio:**
  - An AST/ALT ratio under 1 is typical in viral hepatitis and non-alcoholic fatty liver disease.
  - An AST/ALT ratio greater than 2 is characteristic of alcohol-induced liver inflammation, although it can also appear in advanced cirrhosis.

---

## 2. Cholestatic Markers: ALP and GGT

These enzymes assess the integrity of your biliary drainage system (the network of bile ducts transporting digestive bile from the liver to the gallbladder and small intestine):

- **Alkaline Phosphatase (ALP):**
  - *Context:* Found in bile duct lining cells, but also in bone, intestine, and placenta during pregnancy.
  - *Elevated ALP:* When markedly elevated alongside high GGT (Gamma-Glutamyl Transferase), it strongly suggests biliary blockage (such as gallstones or biliary duct narrowing). High ALP with normal GGT often originates from bone remodeling or adolescent growth spurts.

---

## 3. Bilirubin Fractions

Bilirubin is a yellowish-orange pigment produced during the normal breakdown of aged red blood cells. The liver processes (conjugates) bilirubin so it can be excreted in bile:

- **Total Bilirubin:** Normal range is typically 0.2 to 1.2 mg/dL. Values exceeding 2.5 to 3.0 mg/dL lead to noticeable jaundice (yellowing of sclera and skin).
- **Direct (Conjugated) Bilirubin:** Bilirubin that has been processed by liver cells. High direct bilirubin implies impaired bile outflow into the digestive tract.
- **Indirect (Unconjugated) Bilirubin:** Bilirubin bound to albumin prior to hepatic processing. High indirect bilirubin with normal ALT/AST is commonly seen in **Gilbert's syndrome**—a benign, inherited condition where bilirubin clearance slows during fasting, dehydration, or physical stress.

---

## High-Yield Questions to Ask Your Doctor

When discussing your LFT report with your physician, consider asking:

1. *"Does the pattern suggest hepatocellular inflammation (high ALT/AST) or biliary restriction (high ALP/bilirubin)?"*
2. *"Could any of my current daily medications, vitamins, or fitness routines be contributing to this elevation?"*
3. *"Should we schedule an abdominal ultrasound to evaluate liver echogenicity and rule out gallstones?"*
4. *"Do we need repeat testing in 6 to 12 weeks to determine if this is an acute transient fluctuation or a persistent trend?"*
    `,
  },
  {
    slug: "understanding-kidney-function-tests",
    title: "How to Understand Kidney Function Tests: Creatinine, BUN & eGFR",
    subtitle: "A clinical guide to evaluating renal filtration efficiency, electrolyte balance, and hydration.",
    description:
      "Understand your Kidney Function Test (KFT / RFT) report: Serum Creatinine, eGFR stages, Blood Urea Nitrogen, and how to prepare for clinical discussions.",
    category: "Patient Education",
    readingTime: "6 min read",
    datePublished: "2026-03-20",
    dateModified: "2026-10-18",
    author: {
      name: "Ahmed Al-Ferdous",
      title: "Hippocrates Clinical Interface Lead",
    },
    clinicalReviewer: {
      name: "Editorial Clinical Safety Board",
      title: "Hippocrates Clinical Review Protocol",
    },
    keywords: [
      "how to understand kidney function tests",
      "creatinine high in blood test",
      "eGFR stages explained",
      "blood urea nitrogen BUN normal range",
      "KFT report explanation",
      "renal function test interpretation",
    ],
    summaryPoints: [
      "Kidneys filter approximately 180 liters of blood daily, eliminating nitrogenous waste products while preserving essential electrolytes and water.",
      "Serum creatinine is a waste product of muscle metabolism; elevated blood levels typically indicate reduced glomerular filtration.",
      "eGFR (Estimated Glomerular Filtration Rate) calculates functional capacity based on creatinine, age, and sex; values above 90 mL/min are standard.",
      "Dehydration, intense muscular exertion, and high-protein diets can temporarily elevate serum creatinine without structural renal disease.",
    ],
    citations: [
      {
        source: "National Kidney Foundation (NKF)",
        title: "KDOQI Clinical Practice Guidelines for Chronic Kidney Disease: Evaluation, Classification, and Stratification",
      },
      {
        source: "Kidney Disease: Improving Global Outcomes (KDIGO)",
        title: "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease",
      },
      {
        source: "Indian Society of Nephrology (ISN)",
        title: "Guidelines on the Management and Early Detection of Chronic Kidney Disease in India",
      },
    ],
    content: `
## What Do Kidney Function Tests (KFT / RFT) Measure?

Your kidneys are two bean-shaped organs responsible for maintaining fluid balance, regulating arterial blood pressure through the renin-angiotensin system, stimulating red blood cell production via erythropoietin, and filtering metabolic waste from your circulation.

A Kidney Function Test (KFT)—also termed a **Renal Function Test (RFT)**—evaluates how effectively the microscopic filtration units inside your kidneys (glomeruli and nephrons) are filtering metabolic byproducts from your bloodstream.

---

## 1. Serum Creatinine: The Core Filtration Marker

Creatinine is a natural chemical waste byproduct generated from normal muscle energy turnover (phosphocreatine breakdown). Because healthy kidneys filter creatinine out of the blood at a relatively stable rate, blood levels provide an objective indicator of glomerular clearance:

- *Typical Adult Range:* Approximately 0.7 to 1.3 mg/dL for adult males, and 0.6 to 1.1 mg/dL for adult females (varies by muscle mass).
- *Why Muscle Mass Matters:* A muscular bodybuilder naturally produces more daily creatinine than a frail elderly individual. Therefore, a creatinine of 1.2 mg/dL might be normal for an athlete, but could indicate significant kidney impairment in an elderly patient.
- *Transient Elevation Factors:* Acute dehydration, high-dose creatine monohydrate supplementation, consumption of large amounts of cooked red meat, or recent heavy resistance training can temporarily elevate serum creatinine without intrinsic renal damage.

---

## 2. eGFR: Estimated Glomerular Filtration Rate

Because raw creatinine is influenced by muscle mass, age, and sex, modern clinical laboratories use mathematical equations (such as the CKD-EPI formula) to compute your **eGFR**:

- **eGFR > 90 mL/min/1.73 m²:** Normal or high kidney filtration.
- **eGFR 60–89 mL/min/1.73 m²:** Mildly decreased filtration. Common in older adults as a normal consequence of biological aging.
- **eGFR 45–59 mL/min/1.73 m² (Stage 3a):** Mild to moderate reduction. Clinicians evaluate blood pressure, diabetes control, and urine protein (microalbuminuria).
- **eGFR 30–44 mL/min/1.73 m² (Stage 3b):** Moderate to severe reduction.
- **eGFR 15–29 mL/min/1.73 m² (Stage 4):** Severe reduction.
- **eGFR < 15 mL/min/1.73 m² (Stage 5):** Kidney failure requiring specialist nephrology management.

> **Important Clinical Rule:** An isolated eGFR dip does not define Chronic Kidney Disease (CKD). A diagnosis of CKD requires persistence of reduced eGFR or kidney damage markers (such as persistent protein in the urine) for **at least 3 consecutive months**.

---

## 3. Blood Urea Nitrogen (BUN / Urea)

Urea is a nitrogen-containing waste compound produced in the liver when dietary proteins are broken down:

- *Typical Range:* 7 to 20 mg/dL (BUN) or 15 to 40 mg/dL (Serum Urea).
- *The BUN/Creatinine Ratio:*
  - A ratio exceeding 20:1 frequently indicates **prerenal azotemia**—meaning the kidneys themselves are structurally healthy, but blood flow to them is reduced (most commonly due to dehydration, low fluid intake, or diuretic medications).
  - Rehydrating with adequate water often normalizes the ratio rapidly.

---

## 4. Electrolytes & Uric Acid

Comprehensive renal profiles frequently measure vital mineral ions:
- **Sodium (Na+) & Potassium (K+):** Critical for neuromuscular signaling and heart rhythm. Impaired kidneys struggle to excrete excess potassium, requiring dietary adjustments.
- **Serum Uric Acid:** High uric acid (hyperuricemia) can crystallize in joints causing painful gout attacks or precipitate within renal tubules forming kidney stones.

---

## High-Yield Questions for Your Doctor

When discussing your renal panel with your doctor:

1. *"Is this creatinine level consistent with my baseline records from previous years?"*
2. *"Could hydration status or recent physical activity have swayed this number?"*
3. *"Should we perform a spot urine test for albumin-to-creatinine ratio (ACR) to check for microscopic protein leakage?"*
4. *"Do any of my current medications (e.g., ACE inhibitors, ARBs, NSAID painkillers) require dosage review?"*
    `,
  },
];

export function getArticleBySlug(slug: string): KnowledgeArticle | undefined {
  return KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
}
