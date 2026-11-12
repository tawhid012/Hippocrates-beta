import assert from "node:assert/strict";

function parseJsonSafely(raw) {
  if (!raw || typeof raw !== "string") return null;
  let text = raw.trim();

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Continue
  }

  try {
    const sanitized = text.replace(/,\s*([\}\]])/g, "$1");
    const parsed = JSON.parse(sanitized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeAttachmentMimeType(rawMime, fileName) {
  const lower = (rawMime || "").toLowerCase().trim();
  const ext = (fileName || "").split(".").pop()?.toLowerCase();

  if (lower.includes("pdf") || ext === "pdf") return "application/pdf";
  if (lower.includes("png") || ext === "png") return "image/png";
  if (lower.includes("webp") || ext === "webp") return "image/webp";
  if (lower.includes("heic") || ext === "heic") return "image/heic";
  if (lower.includes("heif") || ext === "heif") return "image/heif";
  if (lower.includes("jpeg") || lower.includes("jpg") || ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (lower.startsWith("image/")) return "image/jpeg";
  return "application/pdf";
}

class AegisServiceError extends Error {
  constructor(userFacingMessage, rawError) {
    const detailMsg = typeof rawError === "string" ? rawError : rawError?.message;
    super(detailMsg || userFacingMessage, rawError !== undefined ? { cause: rawError } : undefined);
    this.userFacingMessage = userFacingMessage;
    this.name = "AegisServiceError";
    if (rawError !== undefined) {
      this.cause = rawError;
    }
  }
}

function formatErrorMessage(err) {
  const cause = err?.cause;
  const causeMsg = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : undefined;
  const baseMsg =
    err instanceof AegisServiceError
      ? err.userFacingMessage
      : err?.message || "Aegis is temporarily unable to respond. Please try again.";
  return causeMsg ? `${baseMsg} (${causeMsg})` : baseMsg;
}

console.log("================================================================================");
console.log("       LAB REPORT EXTRACTION & MULTIMODAL RESILIENCE REGRESSION SUITE          ");
console.log("================================================================================");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    failed++;
  }
}

// 1. JSON Parsing Tests
console.log("\n1. Structured Report JSON Parsing & Sanitization");

runTest("Parses standard valid JSON object", () => {
  const jsonStr = JSON.stringify({ report_type: "Blood Test", results: [{ test_name: "ALT", value: 45 }] });
  const parsed = parseJsonSafely(jsonStr);
  assert.ok(parsed);
  assert.strictEqual(parsed.report_type, "Blood Test");
  assert.strictEqual(parsed.results[0].test_name, "ALT");
});

runTest("Extracts JSON wrapped in markdown code fences", () => {
  const fenced = "```json\n{\n  \"report_type\": \"Lipid Panel\",\n  \"results\": []\n}\n```";
  const parsed = parseJsonSafely(fenced);
  assert.ok(parsed);
  assert.strictEqual(parsed.report_type, "Lipid Panel");
});

runTest("Recovers from trailing commas in JSON object", () => {
  const trailing = '{"report_type": "CBC", "results": [{"test_name": "WBC", "value": "6.5",},],}';
  const parsed = parseJsonSafely(trailing);
  assert.ok(parsed);
  assert.strictEqual(parsed.report_type, "CBC");
  assert.strictEqual(parsed.results[0].test_name, "WBC");
});

runTest("Extracts embedded JSON from prose with conversational intro/outro", () => {
  const prose = "Here is the extracted analysis from the uploaded document:\n{\"report_type\": \"Thyroid\", \"results\": []}\nI hope this helps!";
  const parsed = parseJsonSafely(prose);
  assert.ok(parsed);
  assert.strictEqual(parsed.report_type, "Thyroid");
});

runTest("Gracefully handles invalid or empty inputs without throwing", () => {
  assert.strictEqual(parseJsonSafely(""), null);
  assert.strictEqual(parseJsonSafely(null), null);
  assert.strictEqual(parseJsonSafely("not a json at all"), null);
});

// 2. MIME Type Normalization Tests
console.log("\n2. Multimodal MIME Type Normalization for Google Gemini");

runTest("Normalizes image/jpg and image/jpeg to image/jpeg", () => {
  assert.strictEqual(normalizeAttachmentMimeType("image/jpg", "report.jpg"), "image/jpeg");
  assert.strictEqual(normalizeAttachmentMimeType("image/jpeg", "report.jpeg"), "image/jpeg");
  assert.strictEqual(normalizeAttachmentMimeType("image/pjpeg", "report.jpg"), "image/jpeg");
});

runTest("Normalizes application/octet-stream with .pdf extension to application/pdf", () => {
  assert.strictEqual(normalizeAttachmentMimeType("application/octet-stream", "report.pdf"), "application/pdf");
  assert.strictEqual(normalizeAttachmentMimeType("application/x-pdf", "doc.pdf"), "application/pdf");
});

runTest("Normalizes Unknown.jpeg uploaded report cleanly", () => {
  assert.strictEqual(normalizeAttachmentMimeType("application/octet-stream", "Unknown.jpeg"), "image/jpeg");
  assert.strictEqual(normalizeAttachmentMimeType("image/jpeg; charset=utf-8", "Unknown.jpeg"), "image/jpeg");
});

// 3. Error Handling and Details Formatting
console.log("\n3. AegisServiceError Cause & Details Presentation");

runTest("Attaches underlying cause to AegisServiceError", () => {
  const cause = new Error("Network timeout (35000ms)");
  const err = new AegisServiceError(
    "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF.",
    cause
  );
  assert.strictEqual(err.cause, cause);
  assert.strictEqual(err.userFacingMessage, "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF.");
});

runTest("Never formats error message with undefined details", () => {
  const errWithoutCause = new AegisServiceError(
    "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF."
  );
  const formattedWithout = formatErrorMessage(errWithoutCause);
  assert.ok(!formattedWithout.includes("undefined"));
  assert.strictEqual(
    formattedWithout,
    "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF."
  );

  const cause = new Error("Connection reset by peer");
  const errWithCause = new AegisServiceError(
    "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF.",
    cause
  );
  const formattedWith = formatErrorMessage(errWithCause);
  assert.ok(!formattedWith.includes("undefined"));
  assert.strictEqual(
    formattedWith,
    "Aegis was unable to process the uploaded report. Please try again with a clear image or PDF. (Connection reset by peer)"
  );
});

console.log("\n================================================================================");
console.log(`SUITE RESULTS: ${passed} passed, ${failed} failed.`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
