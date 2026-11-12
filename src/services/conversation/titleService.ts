/**
 * Conversation Title Generation Service for Hippocrates / Aegis Core.
 *
 * Responsibilities:
 * - Asynchronously generate concise, professional titles (3-6 words, Title Case)
 * - Strip greetings, filler phrases, conversational openers ("hey", "hello", "hi")
 * - Focus on the patient's primary symptoms, health topic, or consultation intent
 * - NEVER assert an unconfirmed definitive diagnosis
 * - Protect manually renamed titles (is_custom_title / title_user_edited)
 * - Defer title generation when context is incomplete (greetings-only like "helo")
 * - Provide a robust, deterministic keyword-based fallback if LLM is unavailable or fails
 * - Run completely in the background without blocking TTFT or response streaming
 */

// Dynamic repository loader to support both Next.js bundling and Node ESM test runners
async function getCaseRepository() {
  try {
    return await import("../../lib/cases/repository");
  } catch {
    return await import("@/lib/cases/repository");
  }
}

export interface MessageTurn {
  role: string;
  content: string;
  attachment?: {
    fileName?: string;
    attachmentType?: string;
  };
  attachments?: Array<{
    fileName?: string;
    attachmentType?: string;
  }>;
}

/**
 * Common conversational greetings, filler phrases, and non-clinical openers.
 */
const GREETING_WORDS = new Set([
  "hello", "hi", "hey", "helo", "hii", "heyy", "hola", "namaste", "yo",
  "good", "morning", "afternoon", "evening", "night", "day", "greetings",
  "thanks", "thank", "you", "okay", "ok", "k", "yes", "no", "sure", "fine",
  "yep", "nope", "bye", "goodbye", "test", "testing", "please", "pls",
  "help", "doctor", "dr", "dr.", "sir", "madam", "anyone", "someone", "can",
  "good morning", "good afternoon", "good evening", "good day", "thank you"
]);

/**
 * Common stopwords to remove when extracting medical keywords for titles.
 */
const TITLE_STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "because", "as", "what", "which",
  "this", "that", "these", "those", "then", "just", "so", "than", "such",
  "both", "through", "about", "for", "is", "of", "while", "during", "to",
  "what", "with", "at", "by", "from", "up", "down", "in", "out", "on", "off",
  "over", "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "can", "will", "just", "don", "should", "now",
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
  "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "am", "have", "has", "had", "having", "do", "does",
  "did", "doing", "would", "should", "could", "ought", "im", "ive", "id",
  "problems", "problem", "issue", "issues", "trouble", "facing", "experiencing",
  "suffering", "having", "got", "getting", "feel", "feeling", "feels", "felt",
  "started", "noticed", "shows", "showing", "le", "let", "show", "u", "see",
  "actually", "happens", "every", "day", "appears", "little", "area", "please"
]);

/**
 * Placeholder titles that indicate the conversation does not yet have an intelligent title.
 */
const PLACEHOLDER_TITLES = new Set([
  "untitled session",
  "untitled case",
  "untitled",
  "new session",
  "new consultation",
  "new health consultation",
  "patient conversation",
  "patient health query",
  "patient health discussion",
  "hello",
  "hi",
  "hey",
  "helo",
]);

/**
 * Returns true if a message contains only greetings, conversational openers, or trivial noise.
 */
export function isGreetingOrIncompleteContext(message: string): boolean {
  if (!message) return true;
  const clean = message
    .trim()
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean === "") return true;
  if (GREETING_WORDS.has(clean)) return true;

  // Check if message is simply a greeting + filler (e.g. "hi dr", "hello doctor", "hey can you please help")
  const tokens = clean.split(" ");
  if (tokens.length <= 6 && tokens.every((t) => GREETING_WORDS.has(t) || TITLE_STOP_WORDS.has(t))) {
    return true;
  }

  return false;
}

/**
 * Returns true if the title is a generic placeholder or an unfinished snippet.
 */
export function isPlaceholderOrGenericTitle(title?: string | null): boolean {
  if (!title) return true;
  const normalized = title.trim().toLowerCase();
  if (normalized.length < 3) return true;
  if (PLACEHOLDER_TITLES.has(normalized)) return true;
  if (normalized.endsWith("...") || normalized.endsWith("…")) return true;
  if (normalized.startsWith("uploaded photo:") || normalized.startsWith("uploaded 2 physical")) return true;
  return false;
}

/**
 * Converts a string to standard Title Case without capitalizing minor prepositions.
 */
export function toTitleCase(str: string): string {
  const minorWords = new Set(["and", "or", "but", "a", "an", "the", "in", "on", "at", "to", "for", "with", "of"]);
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Cleans, validates, and normalizes a candidate title to adhere to strict UI requirements:
 * - 3 to 6 words
 * - Max ~45 characters
 * - Plain text, Title Case
 * - No diagnostic assertions, no conversational greetings, no trailing punctuation
 */
export function cleanAndNormalizeTitle(rawTitle: string): string {
  if (!rawTitle) return "Patient Health Discussion";

  let title = rawTitle
    // Strip markdown formatting, quotes, backticks
    .replace(/[*_#`"“”«»]/g, "")
    // Strip prefixes like "Title:", "Subject:", "Topic:", "Case:"
    .replace(/^(title|subject|topic|case|consultation|summary)\s*:\s*/i, "")
    // Strip conversational greetings at start
    .replace(/^(hey|hello|hi|helo|good morning|dear doctor)\b\s*/i, "")
    // Replace unconfirmed diagnostic assertions with clinical topic phrasing
    .replace(/\b(confirmed|diagnosis of|diagnosed with)\b\s*/gi, "")
    // Strip trailing punctuation
    .replace(/[.,:;!?\-]+$/, "")
    .trim();

  // Remove multiple whitespace
  title = title.replace(/\s+/g, " ");

  // Convert to Title Case
  title = toTitleCase(title);

  // Clamp to 3–6 words where practical
  const words = title.split(" ").filter(Boolean);
  if (words.length > 6) {
    title = words.slice(0, 6).join(" ");
  }

  // Ensure sensible max length for sidebar UI (max 48 chars at word boundary)
  if (title.length > 48) {
    const cut = title.slice(0, 48);
    const lastSpace = cut.lastIndexOf(" ");
    title = lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
  }

  // Strip trailing punctuation after truncate
  title = title.replace(/[.,:;!?\-]+$/, "").trim();

  // If title collapsed to fewer than 2 words, pad with a clinical topic word
  const finalWords = title.split(" ").filter(Boolean);
  if (finalWords.length === 1) {
    title = `${finalWords[0]} Health Concern`;
  } else if (finalWords.length === 0) {
    title = "Patient Health Discussion";
  }

  return title;
}

/**
 * Deterministic keyword-based title generator.
 * Guaranteed to produce a clean 3-5 word Title Case title in <1ms without any external network or LLM calls.
 */
export function deriveDeterministicFallbackTitle(
  rawMessage: string,
  attachments?: Array<{ fileName?: string; attachmentType?: string }>
): string {
  const msg = rawMessage.trim();
  const lowerMsg = msg.toLowerCase();

  // 1. Check attachments for laboratory or diagnostic report hints
  const firstAtt = attachments?.[0];
  if (firstAtt?.fileName) {
    const fn = firstAtt.fileName.toLowerCase();
    if (fn.includes("cbc") || fn.includes("blood") || fn.includes("hemoglobin")) {
      return "Blood Test Report Review";
    }
    if (fn.includes("lipid") || fn.includes("cholesterol")) {
      return "Lipid Profile Review";
    }
    if (fn.includes("urine") || fn.includes("renal") || fn.includes("kidney")) {
      return "Renal Lab Report Review";
    }
    if (fn.includes("mri") || fn.includes("xray") || fn.includes("x-ray") || fn.includes("ct") || fn.includes("scan")) {
      return "Diagnostic Imaging Review";
    }
    if (fn.includes("report") || fn.endsWith(".pdf")) {
      return "Medical Lab Report Review";
    }
  }

  // 2. High-precision clinical chief complaint clusters
  // Skin / Allergy / Rash
  if (
    (lowerMsg.includes("skin") && (lowerMsg.includes("allergy") || lowerMsg.includes("rash") || lowerMsg.includes("itch"))) ||
    lowerMsg.includes("urticaria") || lowerMsg.includes("hives")
  ) {
    if (lowerMsg.includes("itch") || lowerMsg.includes("itching")) {
      return "Recurring Itchy Skin Rash";
    }
    return "Allergic Skin Rash";
  }
  if (lowerMsg.includes("rash") || lowerMsg.includes("bumps") || lowerMsg.includes("itching")) {
    return "Itchy Skin Lesion Evaluation";
  }
  if (lowerMsg.includes("allergy") || lowerMsg.includes("allergic")) {
    return "Allergy Symptoms Inquiry";
  }

  // Headache / Neurological
  if (lowerMsg.includes("headache") || lowerMsg.includes("migraine") || lowerMsg.includes("mathay betha")) {
    if (lowerMsg.includes("sharp") || lowerMsg.includes("severe")) {
      return "Severe Headache Evaluation";
    }
    return "Headache Symptoms Inquiry";
  }

  // Chest / Cardiovascular
  if (lowerMsg.includes("chest") && (lowerMsg.includes("pain") || lowerMsg.includes("tightness") || lowerMsg.includes("pressure"))) {
    return "Chest Pain Symptoms Evaluation";
  }
  if (lowerMsg.includes("palpitation") || lowerMsg.includes("heart rate") || lowerMsg.includes("racing heart")) {
    return "Heart Palpitations Inquiry";
  }

  // Abdominal / Gastrointestinal
  if (lowerMsg.includes("stomach") || lowerMsg.includes("abdominal") || lowerMsg.includes("belly")) {
    if (lowerMsg.includes("pain") || lowerMsg.includes("cramp")) {
      return "Abdominal Pain Inquiry";
    }
    return "Gastrointestinal Symptoms Inquiry";
  }
  if (lowerMsg.includes("acidity") || lowerMsg.includes("heartburn") || lowerMsg.includes("reflux")) {
    return "Acid Reflux Symptoms Inquiry";
  }

  // Musculoskeletal / Joint
  if (lowerMsg.includes("knee") && lowerMsg.includes("pain")) {
    return "Knee Pain Evaluation";
  }
  if (lowerMsg.includes("back") && lowerMsg.includes("pain")) {
    return "Back Pain Symptoms Evaluation";
  }
  if (lowerMsg.includes("joint") || lowerMsg.includes("muscle") || lowerMsg.includes("sprain")) {
    return "Joint Discomfort Evaluation";
  }

  // Respiratory / ENT
  if (lowerMsg.includes("cough") || lowerMsg.includes("cold") || lowerMsg.includes("fever") || lowerMsg.includes("throat")) {
    if (lowerMsg.includes("fever") && lowerMsg.includes("cough")) {
      return "Fever and Cough Evaluation";
    }
    if (lowerMsg.includes("throat")) {
      return "Sore Throat Symptoms Inquiry";
    }
    return "Respiratory Symptoms Inquiry";
  }

  // Medications / Prescriptions
  if (lowerMsg.includes("medicine") || lowerMsg.includes("medication") || lowerMsg.includes("tablet") || lowerMsg.includes("syrup") || lowerMsg.includes("prescribed")) {
    return "Medication and Prescription Review";
  }

  // 3. Fallback: Filter stop words and take remaining clinical keywords
  const cleanedTokens = lowerMsg
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !GREETING_WORDS.has(token) && !TITLE_STOP_WORDS.has(token));

  if (cleanedTokens.length >= 2) {
    const candidate = cleanedTokens.slice(0, 4).join(" ");
    return cleanAndNormalizeTitle(`${candidate} Inquiry`);
  }

  // 4. Default safe fallback
  if (firstAtt) {
    return "Medical Attachment Review";
  }
  return "Patient Health Discussion";
}

/**
 * Asynchronously generates an intelligent conversation title using Gemini Flash Lite,
 * with deterministic fallback on network timeout, error, or missing context.
 */
export async function generateIntelligentConversationTitle(params: {
  messages: MessageTurn[];
  currentTitle?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { messages, currentTitle, metadata } = params;

  // 1. Never overwrite a user-renamed title
  if (metadata?.is_custom_title === true || metadata?.title_user_edited === true) {
    return currentTitle || "Untitled Session";
  }

  // 2. Do not re-generate if an intelligent title was already established
  if (metadata?.title_generated === true && !isPlaceholderOrGenericTitle(currentTitle)) {
    return currentTitle || "Patient Health Discussion";
  }

  // 3. Extract patient context from turns
  const patientTurns = messages.filter((m) => m.role === "user" && m.content.trim());
  const firstPatientTurn = patientTurns[0]?.content || "";
  const allPatientText = patientTurns.map((m) => m.content).join(" ");

  // 4. If conversation lacks clinical substance (e.g. only greetings), do not invent a title yet
  if (isGreetingOrIncompleteContext(allPatientText)) {
    return currentTitle && !isPlaceholderOrGenericTitle(currentTitle)
      ? currentTitle
      : "New Health Consultation";
  }

  // 5. Build prompt with initial turns (first 3 turns)
  const conversationContext = messages
    .slice(0, 4)
    .map((m) => `${m.role === "user" ? "Patient" : "Doctor"}: ${m.content}`)
    .join("\n")
    .slice(0, 1500);

  // 6. Attempt model-based title generation
  try {
    let ai = null;
    try {
      const geminiModule = await import("../../lib/gemini/client");
      ai = await geminiModule.getGeminiClient();
    } catch {
      try {
        const geminiModule = await import("@/lib/gemini/client");
        ai = await geminiModule.getGeminiClient();
      } catch {
        ai = null;
      }
    }

    if (ai) {
      const prompt = `You are an automated medical title generator for a clinical platform.
Generate a concise, professional conversation title summarizing the patient's primary symptoms, complaints, or health concern.

Rules:
1. Output 3 to 6 words only.
2. Plain text Title Case only.
3. NEVER assert a definitive unconfirmed medical diagnosis (e.g. write 'Recurring Itchy Skin Rash' instead of 'Confirmed Chronic Spontaneous Urticaria').
4. NEVER include conversational greetings, fillers, or personal names (e.g. NO 'Hey', 'Hello', 'Patient').
5. Output ONLY the title text, with no quotes, no markdown, and no trailing punctuation.

Conversation:
${conversationContext}

Title:`;

      const callPromise = ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 25,
          temperature: 0.2,
        },
      });

      // 4-second timeout guard to ensure zero lingering background tasks
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TITLE_GENERATION_TIMEOUT")), 4000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const rawText = response.text?.trim();

      if (rawText && rawText.length >= 3) {
        const cleaned = cleanAndNormalizeTitle(rawText);
        if (cleaned && !isPlaceholderOrGenericTitle(cleaned)) {
          return cleaned;
        }
      }
    }
  } catch (err) {
    // Model generation failed or timed out — silently fall back to deterministic extraction
    if (process.env.NODE_ENV !== "production") {
      console.debug("[TitleService] Model title generation fallback:", (err as Error)?.message);
    }
  }

  // 7. Deterministic Fallback using the first turn with meaningful clinical context
  const meaningfulPatientTurn =
    patientTurns.find((m) => !isGreetingOrIncompleteContext(m.content))?.content ||
    firstPatientTurn ||
    allPatientText;

  return deriveDeterministicFallbackTitle(meaningfulPatientTurn, messages[0]?.attachments);
}

/**
 * Triggers asynchronous background title generation for a case.
 * Dispatched with `void` to run out-of-band without blocking assistant responses.
 */
export async function triggerAsyncTitleGeneration(params: {
  caseId: string;
  messages: MessageTurn[];
  sessionId?: string;
  userId?: string;
}): Promise<void> {
  const { caseId, messages, sessionId, userId } = params;

  try {
    const repo = await getCaseRepository();
    const existingCase = await repo.getCase(caseId, undefined, sessionId, userId);
    if (!existingCase) return;

    const currentMeta = (existingCase.metadata && typeof existingCase.metadata === "object"
      ? existingCase.metadata
      : {}) as Record<string, unknown>;

    // Protection: User manually renamed title
    if (currentMeta.is_custom_title === true || currentMeta.title_user_edited === true) {
      return;
    }

    // Protection: Already generated an intelligent title
    if (currentMeta.title_generated === true && !isPlaceholderOrGenericTitle(existingCase.title)) {
      return;
    }

    const intelligentTitle = await generateIntelligentConversationTitle({
      messages,
      currentTitle: existingCase.title,
      metadata: currentMeta,
    });

    if (
      intelligentTitle &&
      intelligentTitle !== existingCase.title &&
      !isPlaceholderOrGenericTitle(intelligentTitle)
    ) {
      await repo.renameCase(caseId, intelligentTitle, sessionId, userId, { titleGenerated: true });
    }
  } catch (err) {
    console.warn("[TitleService] Asynchronous title generation failed (non-critical):", err);
  }
}
