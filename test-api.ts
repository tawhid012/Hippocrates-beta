import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY environment variable required");
const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const start = Date.now();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
    });
    console.log("Success in", Date.now() - start, "ms", response.text);
  } catch (e: any) {
    console.error("Failed:", e.message);
  }
}
test();
