import { getActiveGeminiApiKey } from "./src/lib/gemini/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkKey() {
  try {
    const key = await getActiveGeminiApiKey();
    console.log("ACTIVE KEY: Configured and available (format valid).");
  } catch (err) {
    console.error("ERROR:", err);
  }
}

checkKey();
