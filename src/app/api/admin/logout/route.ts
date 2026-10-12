import { ok } from "@/lib/api/response";
import { clearAdminSession } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminSession();
  return ok({ authenticated: false });
}
