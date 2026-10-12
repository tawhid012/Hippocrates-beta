import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const testSuites = [
  { name: "Admin Authentication & Security Tests", cmd: "node", args: ["--test", "tests/security/auth-admin.test.mjs"] },
  { name: "Session Ownership & Access Control Tests", cmd: "node", args: ["--test", "tests/security/session-ownership.test.mjs"] },
  { name: "Model Configuration & Controlled Fallback Tests", cmd: "node", args: ["--test", "tests/security/model-config.test.mjs"] },
  { name: "Aegis Clinical State Isolation Suite", cmd: "node", args: ["tests/clinical/test-clinical-isolation.mjs"] },
  { name: "Aegis Assessment Convergence & Emergency Stopping Suite", cmd: "node", args: ["tests/clinical/test-assessment-convergence.mjs"] },
  { name: "Aegis Master Restoration & Progression Suite", cmd: "node", args: ["tests/clinical/test-aegis-restoration.mjs"] },
];

console.log("================================================================================");
console.log("       HIPPOCRATES AI CLINICAL COPILOT — AUTOMATED REGRESSION SUITE            ");
console.log("================================================================================\n");

let passedCount = 0;
let failedCount = 0;

for (const suite of testSuites) {
  console.log(`▶ Running Suite: ${suite.name}...`);
  const result = spawnSync(suite.cmd, suite.args, {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });

  if (result.status === 0) {
    console.log(`✔ Passed: ${suite.name}\n`);
    passedCount++;
  } else {
    console.error(`✖ Failed: ${suite.name} (exit code ${result.status})\n`);
    failedCount++;
  }
}

console.log("================================================================================");
console.log(`SUITE RESULTS: ${passedCount} passed, ${failedCount} failed of ${testSuites.length} total suites.`);
console.log("================================================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
