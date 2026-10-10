import { ok } from "@/lib/api/response";
import { isAdminAuthenticated } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ authenticated: await isAdminAuthenticated() });
}
