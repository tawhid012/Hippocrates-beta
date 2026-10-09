import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY environment variable required");
const ai = new GoogleGenAI({ apiKey });

async function list() {
  try {
    const res = await ai.models.list(); // Or whatever the method is for listing
    for await (const m of res) {
      console.log(m.name);
    }
  } catch (e: any) {
    console.log("Failed to list models:", e.message);
  }
}
list();
