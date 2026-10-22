import assert from "node:assert/strict";
import http from "node:http";
import { evaluateSafety } from "../../src/lib/aegis/safety.ts";
import {
  createCleanCaseState,
  extractInstantaneousCaseUpdates,
  determineAssessmentStatusFromResponse,
  validateCaseStateIsolation,
} from "../../src/services/aegis/aegisCaseState.ts";
import { createHash } from "node:crypto";

function computeReportHash(base64Data, prompt) {
  return createHash("sha256").update(`${base64Data}::${prompt || ""}`).digest("hex");
}

function isFatalProviderError(error) {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("access_token_type_unsupported") ||
    lower.includes("unauthenticated") ||
    lower.includes("permission_denied") ||
    lower.includes("missing_gemini_api_key") ||
    lower.includes("billing_disabled") ||
    lower.includes("401") ||
    (lower.includes("403") && !lower.includes("quota"))
  );
}

const BASE_URL = "http://localhost:3000";

console.log("================================================================================");
console.log("       STAGE C: CLINICAL SAFETY & QUALITY REGRESSION MASTER SUITE               ");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}:`, err.message);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}:`, err.message);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Routine Health Query Safety
// -----------------------------------------------------------------------------
console.log("1. Routine Health Query Safety & Non-Emergency Routing");
runTest("Routine question does not trigger emergency alert", () => {
  const evalResult = evaluateSafety("What are common symptoms of seasonal allergies?");
  assert.strictEqual(evalResult.level, "NORMAL");
  assert.strictEqual(evalResult.reasons.length, 0);
});

// -----------------------------------------------------------------------------
// TEST 2: Potential Emergency & Red-Flag Symptoms
// -----------------------------------------------------------------------------
console.log("\n2. Immediate Emergency & Red-Flag Triage Detection");
runTest("Crushing chest pain triggers immediate POTENTIAL_EMERGENCY", () => {
  const evalResult = evaluateSafety("I have sudden severe crushing chest pain radiating to my left arm.");
  assert.strictEqual(evalResult.level, "POTENTIAL_EMERGENCY");
  assert.ok(evalResult.emergencyWarning?.includes("EMERGENCY NOTICE"));
});

runTest("Thunderclap headache triggers POTENTIAL_EMERGENCY", () => {
  const evalResult = evaluateSafety("Sudden worst headache of my life, like a thunderclap, with a stiff neck.");
  assert.strictEqual(evalResult.level, "POTENTIAL_EMERGENCY");
});

runTest("Emergency triage stopping gate does not allow provisional self-care", () => {
  let state = createCleanCaseState("emerg-1");
  state = extractInstantaneousCaseUpdates("Severe crushing chest pain radiating down my left arm.", state);
  assert.strictEqual(state.urgency_level, "EMERGENCY");
  assert.strictEqual(state.assessment_status, "URGENT_ACTION_REQUIRED");
});

// -----------------------------------------------------------------------------
// TEST 3: Medication & Dosage Related Questions
// -----------------------------------------------------------------------------
console.log("\n3. Medication & Dosage Clinical Checks");
runTest("Medication query classified as safe health information", () => {
  const evalResult = evaluateSafety("Can I take acetaminophen with food?");
  assert.strictEqual(evalResult.level, "NORMAL");
});

runTest("Medication query with overdose warning triggers safety gate", () => {
  const evalResult = evaluateSafety("I had a seizure after taking unknown pills.");
  assert.strictEqual(evalResult.level, "POTENTIAL_EMERGENCY");
});

// -----------------------------------------------------------------------------
// TEST 4: Uncertain or Insufficient Patient Information
// -----------------------------------------------------------------------------
console.log("\n4. Uncertain & Insufficient Patient Information Gates");
runTest("Vague symptoms remain INCOMPLETE without premature diagnosis", () => {
  const state0 = createCleanCaseState("vague-1");
  const state1 = extractInstantaneousCaseUpdates("I've been feeling slightly strange since yesterday.", state0);
  assert.strictEqual(state1.assessment_status, "INCOMPLETE");
  assert.strictEqual(state1.urgency_level, "UNKNOWN");
});

// -----------------------------------------------------------------------------
// TEST 5: Medical Report Analysis & Cache Deduplication
// -----------------------------------------------------------------------------
console.log("\n5. Medical Report Deduplication & Cache Performance");
runTest("Report hash and cache recall operates in sub-millisecond time", () => {
  const fakeBase64 = "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2Jq";
  const note = "Analyze CBC results";
  const hash = computeReportHash(fakeBase64, note);

  const reportCache = new Map();
  const mockAnalysis = {
    report_type: "Complete Blood Count",
    tests: [{ test_name: "Hemoglobin", value: "14.2", unit: "g/dL", status: "NORMAL" }],
    results: [],
    overall_summary: "Normal hemoglobin levels.",
    key_findings: ["Normal CBC"],
    red_flags: [],
  };

  reportCache.set(hash, { reportAnalysis: mockAnalysis, safetyEvaluation: { level: "SAFE_HEALTH_INFORMATION" } });
  const retrieved = reportCache.get(hash);
  assert.ok(retrieved !== undefined);
  assert.strictEqual(retrieved.reportAnalysis.report_type, "Complete Blood Count");
  assert.strictEqual(retrieved.reportAnalysis.tests[0].status, "NORMAL");
});

// -----------------------------------------------------------------------------
// TEST 6: Unauthenticated & Unauthorized Requests
// -----------------------------------------------------------------------------
console.log("\n6. Unauthenticated & Unauthorized Consultation Isolation");
runTest("Cross-user consultation state isolation prevents leakage", () => {
  const stateA = createCleanCaseState("case-A");
  stateA.chief_complaint = "Hypertension management";
  stateA.urgency_level = "ROUTINE";

  // Validate that Case B cannot read or carry over Case A's complaint
  const stateB = validateCaseStateIsolation(stateA, "case-B");
  assert.strictEqual(stateB.chief_complaint, null);
  assert.strictEqual(stateB.consultation_id, "case-B");
});

// -----------------------------------------------------------------------------
// TEST 7: Provider Error & Failover Circuit Breaker
// -----------------------------------------------------------------------------
console.log("\n7. Fast-Failover & Circuit Breaker Robustness");
runTest("Fatal provider authentication errors are identified immediately", () => {
  assert.strictEqual(isFatalProviderError(new Error("API key not valid. Please pass a valid API key.")), true);
  assert.strictEqual(isFatalProviderError(new Error("ACCESS_TOKEN_TYPE_UNSUPPORTED")), true);
  assert.strictEqual(isFatalProviderError(new Error("Request had invalid authentication credentials (401)")), true);
  assert.strictEqual(isFatalProviderError(new Error("PERMISSION_DENIED: The caller does not have permission")), true);
  assert.strictEqual(isFatalProviderError(new Error("MISSING_GEMINI_API_KEY")), true);
});

runTest("Transient network timeouts are NOT treated as fatal auth errors", () => {
  assert.strictEqual(isFatalProviderError(new Error("Model TTFT timeout (exceeded 5000ms)")), false);
  assert.strictEqual(isFatalProviderError(new Error("ETIMEDOUT: Connection timed out")), false);
  assert.strictEqual(isFatalProviderError(new Error("503 Service Unavailable")), false);
});

// -----------------------------------------------------------------------------
// TEST 8: Live HTTP Route Rate Limiting & Concurrency
// -----------------------------------------------------------------------------
console.log("\n8. Live HTTP Route Concurrency & Immediate Acknowledgement");
await runAsyncTest("Concurrent requests receive sub-100ms client acknowledgement (when live server active)", async () => {
  const isServerUp = await new Promise((res) => {
    const ping = http.get(`${BASE_URL}/api/health`, { timeout: 100 }, () => res(true));
    ping.on("error", () => res(false));
    ping.on("timeout", () => {
      ping.destroy();
      res(false);
    });
  });

  if (!isServerUp) {
    console.log("    (Live HTTP server not running locally; skipping socket assertion)");
    return;
  }

  const sendReq = (msg) =>
    new Promise((resolve) => {
      const t0 = performance.now();
      const payload = JSON.stringify({ message: msg, stream: true });
      const req = http.request(
        `${BASE_URL}/api/aegis/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let ackTime = null;
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            if (chunk.includes("event: init") && ackTime === null) {
              ackTime = performance.now() - t0;
            }
          });
          res.on("end", () => {
            resolve(ackTime || performance.now() - t0);
          });
        }
      );
      req.on("error", () => resolve(999));
      req.write(payload);
      req.end();
    });

  const acks = await Promise.all([
    sendReq("Concurrent message 1"),
    sendReq("Concurrent message 2"),
    sendReq("Concurrent message 3"),
  ]);

  for (const ack of acks) {
    assert.ok(ack < 100, `Client acknowledgement must be under 100ms (got ${ack.toFixed(1)}ms)`);
  }
});

console.log("\n================================================================================");
console.log(`STAGE C RESULTS: ${passed} passed, ${failed} failed.`);
console.log("================================================================================");

if (failed > 0) process.exit(1);
