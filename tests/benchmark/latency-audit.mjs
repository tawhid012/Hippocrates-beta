import http from "node:http";

const BASE_URL = "http://localhost:3000";

const TEST_PROMPTS = [
  // Routine health information questions
  { type: "routine", message: "What are the common symptoms of seasonal allergic rhinitis?" },
  { type: "routine", message: "How much water should a healthy adult drink each day?" },
  { type: "routine", message: "What is the difference between a strain and a sprain?" },
  { type: "routine", message: "Can lack of sleep cause mild tension headaches?" },
  { type: "routine", message: "What are common triggers for acid reflux after dinner?" },
  { type: "routine", message: "How do antihistamines help reduce sneezing and itchy eyes?" },
  { type: "routine", message: "What are standard lifestyle modifications for mild hypertension?" },

  // Potential emergency / red-flag symptoms
  { type: "emergency", message: "I have sudden severe crushing chest pain radiating to my left arm and jaw." },
  { type: "emergency", message: "My father suddenly cannot speak clearly and his face is drooping on the right side." },
  { type: "emergency", message: "I have a sudden thunderclap headache, the worst headache of my life, with neck stiffness." },
  { type: "emergency", message: "I am coughing up large amounts of bright red blood and struggling to breathe." },
  { type: "emergency", message: "Severe sudden abdominal pain with a rigid abdomen and high fever." },

  // Medication and dosage-related questions
  { type: "medication", message: "Can I take ibuprofen if I already took acetaminophen two hours ago?" },
  { type: "medication", message: "What should I do if I missed one dose of my daily amlodipine?" },
  { type: "medication", message: "Is it safe to drink grapefruit juice while taking atorvastatin?" },
  { type: "medication", message: "Why should antibiotics always be finished even if symptoms improve?" },
  { type: "medication", message: "What are the common side effects of metformin when starting it?" },

  // Uncertain or insufficient patient information
  { type: "uncertain", message: "I have been feeling off lately." },
  { type: "uncertain", message: "My stomach feels slightly strange." },
  { type: "uncertain", message: "I have had a mild ache for a few days." },
  { type: "uncertain", message: "My skin feels a bit itchy today." },
  { type: "uncertain", message: "I feel tired." },

  // Continuing conversation / multi-turn history
  {
    type: "follow-up",
    message: "The pain is on the right side and started yesterday morning.",
    history: [
      { role: "user", content: "I have had a headache for two days." },
      { role: "assistant", content: "I understand. Can you describe where exactly the pain is located and when it started?" }
    ]
  },
  {
    type: "follow-up",
    message: "No nausea or vomiting, just a dull throbbing ache.",
    history: [
      { role: "user", content: "I have a headache on my right temple." },
      { role: "assistant", content: "Do you have any accompanying symptoms like nausea, vomiting, or visual disturbances?" }
    ]
  },
  {
    type: "follow-up",
    message: "It feels like a band tightening around my entire forehead.",
    history: [
      { role: "user", content: "I have tension in my forehead." },
      { role: "assistant", content: "Could you tell me more about the sensation? Does it feel throbbing, pressing, or sharp?" }
    ]
  },
  {
    type: "follow-up",
    message: "No vision changes or numbness, just persistent dull pain.",
    history: [
      { role: "user", content: "I have headache and stiff shoulders." },
      { role: "assistant", content: "Are there any neurological symptoms such as changes in vision, numbness, or dizziness?" }
    ]
  },
  {
    type: "follow-up",
    message: "About 5 out of 10, worse when I bend forward.",
    history: [
      { role: "user", content: "My sinuses feel congested and sore." },
      { role: "assistant", content: "On a scale of 1 to 10, how severe is the facial pressure, and does bending forward change it?" }
    ]
  },

  // Concurrent / edge cases
  { type: "routine", message: "What are healthy sources of dietary fiber?" },
  { type: "routine", message: "How can I improve sleep hygiene without medications?" },
  { type: "emergency", message: "Sudden onset of inability to move my left leg and arm." },
  { type: "medication", message: "What is the recommended storage temperature for opened insulin pens?" },
  { type: "uncertain", message: "My back has been slightly uncomfortable since this afternoon." },
];

async function sendChatRequest(item, index) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let tAck = null;
    let tFirstToken = null;
    let tComplete = null;
    let caseId = null;
    let statusCode = null;
    let chunksCount = 0;
    let bytesReceived = 0;
    let errorReceived = null;
    let deltaTokensCount = 0;

    const payload = JSON.stringify({
      message: item.message,
      history: item.history || [],
      caseId: item.caseId || undefined,
      stream: true,
    });

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
        statusCode = res.statusCode;
        res.setEncoding("utf8");

        let buffer = "";

        res.on("data", (chunk) => {
          bytesReceived += chunk.length;
          chunksCount++;
          buffer += chunk;

          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            if (!block.trim()) continue;
            let event = "";
            let data = "";

            for (const line of block.split("\n")) {
              if (line.startsWith("event: ")) event = line.slice(7).trim();
              if (line.startsWith("data: ")) data = line.slice(6).trim();
            }

            if (event === "init" && tAck === null) {
              tAck = performance.now();
              try {
                const parsed = JSON.parse(data);
                caseId = parsed.caseId;
              } catch {}
            }

            if (event === "delta") {
              if (tFirstToken === null) {
                tFirstToken = performance.now();
              }
              deltaTokensCount++;
            }

            if (event === "error") {
              try {
                const errObj = JSON.parse(data);
                errorReceived = errObj.error;
              } catch {
                errorReceived = data;
              }
            }

            if (event === "done") {
              tComplete = performance.now();
            }
          }
        });

        res.on("end", () => {
          const tEnd = performance.now();
          tComplete = tComplete || tEnd;
          resolve({
            index,
            type: item.type,
            statusCode,
            tAckMs: tAck ? +(tAck - t0).toFixed(2) : +(tEnd - t0).toFixed(2),
            ttftMs: tFirstToken ? +(tFirstToken - t0).toFixed(2) : null,
            totalMs: +(tEnd - t0).toFixed(2),
            chunksCount,
            deltaTokensCount,
            bytesReceived,
            error: errorReceived,
            caseId,
          });
        });
      }
    );

    req.on("error", (err) => {
      const tEnd = performance.now();
      resolve({
        index,
        type: item.type,
        statusCode: 0,
        tAckMs: +(tEnd - t0).toFixed(2),
        ttftMs: null,
        totalMs: +(tEnd - t0).toFixed(2),
        chunksCount: 0,
        deltaTokensCount: 0,
        bytesReceived: 0,
        error: err.message,
        caseId: null,
      });
    });

    req.write(payload);
    req.end();
  });
}

function computePercentiles(values) {
  if (values.length === 0) return { p50: 0, p95: 0, avg: 0, min: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const avg = +(sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2);
  return {
    p50: sorted[p50Index],
    p95: sorted[p95Index],
    avg,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

async function runBenchmark() {
  console.log("================================================================================");
  console.log(`AEGIS PRODUCTION LATENCY AUDIT — ${TEST_PROMPTS.length} REPRESENTATIVE REQUESTS`);
  console.log("================================================================================\n");

  const results = [];
  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    const item = TEST_PROMPTS[i];
    process.stdout.write(`[${i + 1}/${TEST_PROMPTS.length}] Testing (${item.type}): "${item.message.slice(0, 40)}..." `);
    const res = await sendChatRequest(item, i + 1);
    results.push(res);
    console.log(`-> Ack: ${res.tAckMs}ms | Total: ${res.totalMs}ms | Status: ${res.statusCode} ${res.error ? `(Error: ${res.error.slice(0, 30)}...)` : ""}`);
  }

  console.log("\n================================================================================");
  console.log("BENCHMARK SUMMARY & LATENCY METRICS");
  console.log("================================================================================\n");

  const ackTimes = results.map((r) => r.tAckMs);
  const totalTimes = results.map((r) => r.totalMs);
  const ackStats = computePercentiles(ackTimes);
  const totalStats = computePercentiles(totalTimes);

  console.log("1. Immediate Client Acknowledgement (T0 -> SSE 'init' event):");
  console.log(`   - p50 (Median): ${ackStats.p50} ms`);
  console.log(`   - p95:          ${ackStats.p95} ms`);
  console.log(`   - Average:      ${ackStats.avg} ms`);
  console.log(`   - Min / Max:    ${ackStats.min} ms / ${ackStats.max} ms`);

  console.log("\n2. Total Request Processing Time (T0 -> Completion):");
  console.log(`   - p50 (Median): ${totalStats.p50} ms`);
  console.log(`   - p95:          ${totalStats.p95} ms`);
  console.log(`   - Average:      ${totalStats.avg} ms`);
  console.log(`   - Min / Max:    ${totalStats.min} ms / ${totalStats.max} ms`);

  const errorCount = results.filter((r) => r.error !== null).length;
  console.log(`\n3. Error / Timeout Rate: ${errorCount}/${results.length} (${((errorCount / results.length) * 100).toFixed(1)}%)`);

  console.log("\n================================================================================");
  return { results, ackStats, totalStats, errorCount };
}

runBenchmark().catch(console.error);
