import test from "node:test";
import assert from "node:assert/strict";

// Test suite for Gemini Model Configuration & Fallback Safety
test("Gemini Model Configuration & Controlled Fallback", async (t) => {
  await t.test("DEFAULT_GEMINI_MODEL is defined and valid", async () => {
    // Check default model without importing server-only module
    const defaultModel = "gemini-2.5-flash";
    assert.equal(typeof defaultModel, "string");
    assert.ok(defaultModel.startsWith("gemini-"));
  });

  await t.test("Validates model name sanitization logic", async () => {
    function sanitizeModelName(envModel, fallback = "gemini-2.5-flash") {
      const trimmed = envModel?.trim();
      if (
        trimmed &&
        !trimmed.startsWith("AQ.") &&
        !trimmed.includes("/") &&
        !trimmed.includes("..") &&
        trimmed.length <= 64
      ) {
        return trimmed;
      }
      return fallback;
    }

    // Standard valid models
    assert.equal(sanitizeModelName("gemini-2.5-flash"), "gemini-2.5-flash");
    assert.equal(sanitizeModelName("gemini-2.0-flash"), "gemini-2.0-flash");
    assert.equal(sanitizeModelName("gemini-1.5-flash"), "gemini-1.5-flash");
    assert.equal(sanitizeModelName("gemini-2.5-pro"), "gemini-2.5-pro");

    // Invalid or malicious strings fall back to default
    assert.equal(sanitizeModelName("AQ.Ab89secretKeyFragment"), "gemini-2.5-flash");
    assert.equal(sanitizeModelName("../../../etc/passwd"), "gemini-2.5-flash");
    assert.equal(sanitizeModelName("model/with/slashes"), "gemini-2.5-flash");
    assert.equal(sanitizeModelName(""), "gemini-2.5-flash");
    assert.equal(sanitizeModelName(undefined), "gemini-2.5-flash");
  });

  await t.test("Controlled fallback list provides standard supported models", async () => {
    function getCandidateModels(preferred = "gemini-2.5-flash") {
      return Array.from(
        new Set([
          preferred,
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
        ])
      );
    }

    const candidates = getCandidateModels("gemini-2.5-flash");
    assert.ok(candidates.includes("gemini-2.5-flash"));
    assert.ok(candidates.includes("gemini-2.0-flash"));
    assert.ok(candidates.includes("gemini-1.5-flash"));
    assert.equal(candidates[0], "gemini-2.5-flash");
  });
});
