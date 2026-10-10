import { ORACLE_MODEL_NAME } from "@/config/ai";
import { ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    status: "ok",
    service: "Hippocrates",
    model: ORACLE_MODEL_NAME,
  });
}
