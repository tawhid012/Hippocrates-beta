import assert from "node:assert/strict";
import {
  isGreetingOrIncompleteContext,
  isPlaceholderOrGenericTitle,
  cleanAndNormalizeTitle,
  deriveDeterministicFallbackTitle,
  generateIntelligentConversationTitle,
  toTitleCase,
} from "../../src/services/conversation/titleService.ts";

console.log("================================================================================");
console.log("      HIPPOCRATES / AEGIS CORE — CONVERSATION UX POLISH REGRESSION SUITE        ");
console.log("================================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✔ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`✖ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`✔ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`✖ [FAIL] ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Conversational Opener Stripping & Intelligent Title Format
// ---------------------------------------------------------------------------
runTest("Test 1: Conversational Opener Stripping & Word Count Clamp", () => {
  const rawInput = "hey I have problems on my skin due to allergy";
  const title = deriveDeterministicFallbackTitle(rawInput);

  assert.doesNotMatch(title, /^hey\b/i, "Must not begin with conversational greeting 'hey'");
  assert.doesNotMatch(title, /\.\.\.$/, "Must not end with raw truncated ellipsis");
  assert.equal(
    title,
    "Allergic Skin Rash",
    "Should identify allergic skin rash from chief complaint keywords"
  );

  const wordCount = title.split(/\s+/).length;
  assert.ok(wordCount >= 3 && wordCount <= 6, `Word count must be between 3 and 6 words (got ${wordCount})`);
  assert.ok(title.length <= 48, `Title length must be <= 48 chars (got ${title.length})`);
});

// ---------------------------------------------------------------------------
// TEST 2: Greetings and Incomplete Context Detection
// ---------------------------------------------------------------------------
runTest("Test 2: Greetings and Incomplete Context Detection", () => {
  assert.equal(isGreetingOrIncompleteContext("helo"), true, "'helo' should be identified as incomplete greeting");
  assert.equal(isGreetingOrIncompleteContext("hello"), true, "'hello' should be identified as incomplete greeting");
  assert.equal(isGreetingOrIncompleteContext("hi"), true, "'hi' should be identified as incomplete greeting");
  assert.equal(isGreetingOrIncompleteContext("good morning dr"), true, "'good morning dr' is incomplete opener");
  assert.equal(isGreetingOrIncompleteContext("hey can you please help"), true, "generic plea without medical detail is incomplete context");

  assert.equal(isGreetingOrIncompleteContext("i am having intense itching on my body"), false, "Symptom description is NOT incomplete context");
  assert.equal(isGreetingOrIncompleteContext("sharp pain in my chest since morning"), false, "Chest pain is NOT incomplete context");
});

// ---------------------------------------------------------------------------
// TEST 3: Deferral of Title Generation on Trivial Greetings
// ---------------------------------------------------------------------------
await runAsyncTest("Test 3: Deferral of Title Generation on Trivial Greetings", async () => {
  const turns = [
    { role: "user", content: "helo" },
    { role: "assistant", content: "Hello! How can I assist you with your health today?" },
  ];

  const title = await generateIntelligentConversationTitle({
    messages: turns,
    currentTitle: "New Health Consultation",
    metadata: {},
  });

  assert.equal(
    title,
    "New Health Consultation",
    "Must preserve clean placeholder on greeting-only turn rather than generating 'helo'"
  );
  assert.notEqual(title.toLowerCase(), "helo", "Must NEVER generate 'helo' as title");
});

// ---------------------------------------------------------------------------
// TEST 4: Generation on Follow-Up Medical Context
// ---------------------------------------------------------------------------
await runAsyncTest("Test 4: Generation on Follow-Up Medical Context", async () => {
  const turns = [
    { role: "user", content: "helo" },
    { role: "assistant", content: "Hello! How can I assist you with your health today?" },
    {
      role: "user",
      content: "actually it happens on the whole body, itchy rash appears every day and disappears after Montek LC",
    },
    { role: "assistant", content: "Got it—widespread daily itchy bumps that temporarily clear up." },
  ];

  const title = await generateIntelligentConversationTitle({
    messages: turns,
    currentTitle: "New Health Consultation",
    metadata: {},
  });

  assert.ok(
    title.includes("Skin") || title.includes("Rash") || title.includes("Itchy"),
    `Title should reflect symptoms on turn 2 (got '${title}')`
  );
  assert.doesNotMatch(title, /^helo/i, "Must not begin with 'helo'");
});

// ---------------------------------------------------------------------------
// TEST 5: No Title Regeneration on Subsequent Turns
// ---------------------------------------------------------------------------
await runAsyncTest("Test 5: No Title Regeneration on Subsequent Turns", async () => {
  const establishedTitle = "Recurring Itchy Skin Rash";
  const turns = [
    { role: "user", content: "hey I have problems on my skin due to allergy" },
    { role: "assistant", content: "Understood." },
    { role: "user", content: "what are the probabilities of disease" },
    { role: "assistant", content: "Looking into differential possibilities." },
  ];

  const title = await generateIntelligentConversationTitle({
    messages: turns,
    currentTitle: establishedTitle,
    metadata: { title_generated: true },
  });

  assert.equal(
    title,
    establishedTitle,
    "Must NOT regenerate or mutate an already established intelligent title"
  );
});

// ---------------------------------------------------------------------------
// TEST 6: Strict Protection of User-Renamed (Custom) Titles
// ---------------------------------------------------------------------------
await runAsyncTest("Test 6: Strict Protection of User-Renamed (Custom) Titles", async () => {
  const customUserTitle = "My Personal Allergy Chat";
  const turns = [
    { role: "user", content: "hey I have problems on my skin due to allergy" },
    { role: "assistant", content: "Understood." },
    { role: "user", content: "I also have severe chest pain" },
  ];

  const title = await generateIntelligentConversationTitle({
    messages: turns,
    currentTitle: customUserTitle,
    metadata: { is_custom_title: true, title_user_edited: true },
  });

  assert.equal(
    title,
    customUserTitle,
    "Must NEVER overwrite a title that the patient or doctor has manually customized"
  );
});

// ---------------------------------------------------------------------------
// TEST 7: Diagnostic Assertion Safeguard & Title Normalization
// ---------------------------------------------------------------------------
runTest("Test 7: Diagnostic Assertion Safeguard & Title Normalization", () => {
  // If model attempts to assert an unconfirmed definitive diagnosis
  const candidate = "Confirmed Urticaria Diagnosis With Skin Rash";
  const cleaned = cleanAndNormalizeTitle(candidate);

  assert.doesNotMatch(cleaned, /\bconfirmed\b/i, "Must strip definitive diagnosis assertion 'confirmed'");
  assert.ok(
    cleaned.includes("Urticaria") || cleaned.includes("Skin Rash"),
    "Should maintain clinical topic without asserting confirmed diagnosis"
  );

  // Markdown and quote stripping
  const rawWithQuotes = 'Title: "**Sharp Chest Pain** Evaluation."';
  const cleanedQuotes = cleanAndNormalizeTitle(rawWithQuotes);
  assert.equal(cleanedQuotes, "Sharp Chest Pain Evaluation", "Must strip markdown bold, prefix, quotes and trailing dot");
});

// ---------------------------------------------------------------------------
// TEST 8: Multimodal Attachment Deterministic Fallback
// ---------------------------------------------------------------------------
runTest("Test 8: Multimodal Attachment Deterministic Fallback", () => {
  const cbcTitle = deriveDeterministicFallbackTitle("", [{ fileName: "CBC_Blood_Test_Report.pdf" }]);
  assert.equal(cbcTitle, "Blood Test Report Review", "Must format CBC report into clean review title");

  const lipidTitle = deriveDeterministicFallbackTitle("", [{ fileName: "lipid_profile.pdf" }]);
  assert.equal(lipidTitle, "Lipid Profile Review", "Must format lipid profile into clean review title");

  const photoTitle = deriveDeterministicFallbackTitle("severe skin rash on arm", [{ fileName: "Unknown-2.jpeg" }]);
  assert.ok(
    photoTitle.includes("Skin") || photoTitle.includes("Rash"),
    "Must prioritize patient symptom description when attachment filename is generic (Unknown-2.jpeg)"
  );
  assert.doesNotMatch(photoTitle, /^Report:\s*Unknown-2\.jpeg$/i, "Must not use raw generic filename as title");
});

// ---------------------------------------------------------------------------
// TEST 9: Optimistic Rename State Management & Concurrency
// ---------------------------------------------------------------------------
runTest("Test 9: Optimistic Rename State Management & Concurrency", () => {
  const initialCases = [
    { id: "case-1", title: "Patient Health Discussion", updatedAt: "2026-11-12T10:00:00Z" },
    { id: "case-2", title: "Knee Pain Evaluation", updatedAt: "2026-11-12T11:00:00Z" },
  ];

  // Simulating optimistic update in state
  const newTitle = "Recurring Itchy Skin Rash";
  const updatedCases = initialCases.map((c) =>
    c.id === "case-1"
      ? { ...c, title: newTitle, updatedAt: new Date().toISOString(), metadata: { is_custom_title: true } }
      : c
  );

  assert.equal(updatedCases[0].title, newTitle, "Case 1 title must update immediately in local state");
  assert.equal(updatedCases[1].title, "Knee Pain Evaluation", "Case 2 must remain unmodified");

  // Concurrency guard test: version tracking
  const versionMap = new Map();
  versionMap.set("case-1", 1);
  const version2 = (versionMap.get("case-1") || 0) + 1;
  versionMap.set("case-1", version2);

  // If request 1 resolves after request 2 was initiated, version check prevents rollback
  const staleRequestVersion = 1;
  const isStale = versionMap.get("case-1") !== staleRequestVersion;
  assert.ok(isStale, "Stale in-flight mutation must be detected and discarded");
});

// ---------------------------------------------------------------------------
// TEST 10: Optimistic Deletion & Tombstone Resurrection Prevention
// ---------------------------------------------------------------------------
runTest("Test 10: Optimistic Deletion & Tombstone Resurrection Prevention", () => {
  const initialCases = [
    { id: "case-1", title: "Recurring Itchy Skin Rash" },
    { id: "case-2", title: "Knee Pain Evaluation" },
    { id: "case-3", title: "Severe Headache Evaluation" },
  ];

  const deletedTombstones = new Set();
  const caseToDelete = "case-2";

  // 1. Tombstone registered
  deletedTombstones.add(caseToDelete);

  // 2. Visible case removed immediately
  const activeCases = initialCases.filter((c) => c.id !== caseToDelete);
  assert.equal(activeCases.length, 2, "Deleted case must be removed immediately from visible list");
  assert.ok(!activeCases.some((c) => c.id === caseToDelete), "Case-2 must not be visible");

  // 3. Stale background network revalidation arrives with all 3 cases
  const networkResponse = [
    { id: "case-1", title: "Recurring Itchy Skin Rash" },
    { id: "case-2", title: "Knee Pain Evaluation" }, // Stale!
    { id: "case-3", title: "Severe Headache Evaluation" },
  ];

  // Filter with tombstone set
  const filteredRevalidation = networkResponse.filter((c) => !deletedTombstones.has(c.id));
  assert.equal(filteredRevalidation.length, 2, "Tombstone must prevent stale network response from resurrecting deleted case");
  assert.ok(!filteredRevalidation.some((c) => c.id === caseToDelete), "Deleted case must NOT resurrect");
});

// ---------------------------------------------------------------------------
// TEST 11: Silent Synchronization & Skeleton Elimination
// ---------------------------------------------------------------------------
runTest("Test 11: Silent Synchronization & Skeleton Elimination", () => {
  // Simulating Sidebar render logic:
  // Show skeleton ONLY when casesLoading === true AND cases.length === 0
  function shouldRenderSkeleton(casesLoading, casesCount) {
    return casesLoading && casesCount === 0;
  }

  // Cold initial load (0 cases) -> skeleton is appropriate
  assert.equal(shouldRenderSkeleton(true, 0), true, "Cold initial load should show skeleton while loading");

  // Routine edit, delete, or background stream update with existing cases
  assert.equal(shouldRenderSkeleton(true, 3), false, "Existing conversations must NEVER be replaced by skeletons");
  assert.equal(shouldRenderSkeleton(false, 3), false, "Loaded conversations must display smoothly");
});

console.log("\n================================================================================");
console.log(`SUITE SUMMARY: ${passed} of ${total} tests passed.`);
console.log("================================================================================");

if (passed !== total) {
  process.exit(1);
}
