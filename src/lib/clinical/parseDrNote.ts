/**
 * Utility to parse raw or structured clinician handoff notes (drNote)
 * into typed, formatted clinical sections for PDF and UI rendering.
 */

export interface ParsedDrNoteSection {
  rawKey: string;
  label: string;
  category:
    | "complaint"
    | "history"
    | "positives"
    | "negatives"
    | "considerations"
    | "urgency"
    | "gaps"
    | "limitations"
    | "safety"
    | "general";
  content: string;
  bullets?: string[];
}

export interface ParsedDrNote {
  raw: string;
  sections: ParsedDrNoteSection[];
  chiefComplaint?: string;
  history?: string;
  keyPositives?: string[];
  keyNegatives?: string[];
  considerations?: string;
  urgency?: string;
  informationGaps?: string[];
  limitations?: string[];
  safetyNote?: string;
}

const SECTION_KEY_MAP: Record<
  string,
  { label: string; category: ParsedDrNoteSection["category"] }
> = {
  "CHIEF COMPLAINT": { label: "Chief Complaint", category: "complaint" },
  "HISTORY OF PRESENTING COMPLAINT": {
    label: "Clinical History & Progression",
    category: "history",
  },
  HISTORY: { label: "Clinical History & Progression", category: "history" },
  "SYMPTOM PROFILE (OPQRST)": {
    label: "Symptom Profile (OPQRST)",
    category: "history",
  },
  "KEY POSITIVES": { label: "Key Positive Findings", category: "positives" },
  POSITIVES: { label: "Key Positive Findings", category: "positives" },
  "KEY NEGATIVES": {
    label: "Pertinent Negatives (Patient Denied)",
    category: "negatives",
  },
  "PERTINENT NEGATIVES": {
    label: "Pertinent Negatives (Patient Denied)",
    category: "negatives",
  },
  "RELEVANT HISTORY": {
    label: "Relevant Medical History",
    category: "history",
  },
  "MEDICAL HISTORY": {
    label: "Past Medical History",
    category: "history",
  },
  MEDICATIONS: { label: "Current Medications", category: "history" },
  ALLERGIES: { label: "Known Allergies", category: "history" },
  "ASSOCIATED SYMPTOMS": {
    label: "Associated Symptoms",
    category: "positives",
  },
  "CLINICAL CONSIDERATIONS": {
    label: "Differential Considerations",
    category: "considerations",
  },
  "POSSIBLE CLINICAL CONSIDERATIONS": {
    label: "Differential Considerations",
    category: "considerations",
  },
  "CLINICAL ASSESSMENT": {
    label: "Provisional Assessment",
    category: "considerations",
  },
  URGENCY: {
    label: "Clinical Urgency & Triage",
    category: "urgency",
  },
  "IMPORTANT INFORMATION GAPS": {
    label: "Clinical Information Gaps",
    category: "gaps",
  },
  "INFORMATION GAPS": {
    label: "Clinical Information Gaps",
    category: "gaps",
  },
  LIMITATIONS: {
    label: "Assessment Limitations",
    category: "limitations",
  },
  "SUGGESTED CLINICAL EVALUATION": {
    label: "Recommended Clinical Evaluation",
    category: "urgency",
  },
  "SAFETY NOTE": {
    label: "Safety & Verification Notice",
    category: "safety",
  },
  "IMPORTANT SAFETY NOTE": {
    label: "Safety & Verification Notice",
    category: "safety",
  },
};

/**
 * Normalizes text lines into bullets if they start with dashes or bullets
 */
function extractBullets(text: string): string[] | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bulletLines = lines.filter(
    (l) =>
      l.startsWith("-") ||
      l.startsWith("•") ||
      l.startsWith("+") ||
      l.startsWith("*")
  );

  if (bulletLines.length > 0 && bulletLines.length >= lines.length / 2) {
    return lines.map((l) =>
      l.replace(/^[-•+*]\s*/, "").trim()
    );
  }

  // If comma separated items in a short list
  if (text.includes(",") && text.length < 200 && !text.includes(".")) {
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }

  return undefined;
}

export function parseDrNote(drNote?: string): ParsedDrNote {
  if (!drNote || !drNote.trim()) {
    return { raw: "", sections: [] };
  }

  const raw = drNote.trim();
  const sections: ParsedDrNoteSection[] = [];

  // Match standard header patterns:
  // e.g. "CHIEF COMPLAINT:", "HISTORY:", "KEY POSITIVES:"
  // either on a new line or separated by periods/newlines.
  const regex =
    /(?:^|\n|\.\s+)([A-Z0-9 /()—–_-]{3,45}):\s*/g;

  const matches: { key: string; index: number; fullMatchLength: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const rawKey = match[1].trim();
    // Verify it looks like a known clinical key
    if (
      SECTION_KEY_MAP[rawKey] ||
      /^[A-Z\s]{4,30}$/.test(rawKey)
    ) {
      matches.push({
        key: rawKey,
        index: match.index + (match[0].startsWith(".") ? 2 : match[0].startsWith("\n") ? 1 : 0),
        fullMatchLength: match[0].length,
      });
    }
  }

  if (matches.length === 0) {
    // If no labeled headers matched, split into paragraphs
    const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      sections.push({
        rawKey: `SECTION_${i + 1}`,
        label: i === 0 ? "Clinical Summary" : `Clinical Note ${i + 1}`,
        category: "general",
        content: p,
        bullets: extractBullets(p),
      });
    }
  } else {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const startContentIndex = current.index + current.key.length + 1; // skip "KEY:"
      const endContentIndex =
        i + 1 < matches.length ? matches[i + 1].index : raw.length;

      let content = raw.substring(startContentIndex, endContentIndex).trim();
      // Clean leading colon if present
      content = content.replace(/^:\s*/, "").trim();

      const mapping = SECTION_KEY_MAP[current.key] || {
        label: current.key
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        category: "general" as const,
      };

      sections.push({
        rawKey: current.key,
        label: mapping.label,
        category: mapping.category,
        content,
        bullets: extractBullets(content),
      });
    }
  }

  // Pre-extract high-frequency structured accessors
  const getSectionContent = (category: ParsedDrNoteSection["category"]) =>
    sections.find((s) => s.category === category)?.content;

  const getSectionBullets = (category: ParsedDrNoteSection["category"]) => {
    const sec = sections.find((s) => s.category === category);
    if (!sec) return undefined;
    if (sec.bullets) return sec.bullets;
    return sec.content
      .split(/[;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== "none" && s.toLowerCase() !== "none reported.");
  };

  return {
    raw,
    sections,
    chiefComplaint: getSectionContent("complaint"),
    history: getSectionContent("history"),
    keyPositives: getSectionBullets("positives"),
    keyNegatives: getSectionBullets("negatives"),
    considerations: getSectionContent("considerations"),
    urgency: getSectionContent("urgency"),
    informationGaps: getSectionBullets("gaps"),
    limitations: getSectionBullets("limitations"),
    safetyNote: getSectionContent("safety"),
  };
}
