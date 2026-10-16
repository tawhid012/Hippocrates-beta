import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { deleteCase, getCase, renameCase } from "@/lib/cases/repository";
import { getClientSessionId, getAuthenticatedUser } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();
  const user = await getAuthenticatedUser();

  try {
    const caseRecord = await getCase(id, undefined, sessionId, user?.id);
    if (!caseRecord) return apiError("Case not found.", 404);
    return ok({ case: caseRecord });
  } catch (err) {
    console.error(`[GET /api/cases/${id}] Error loading case:`, err);
    return apiError("Unable to load case.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();
  const user = await getAuthenticatedUser();

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  try {
    const caseRecord = await getCase(id, undefined, sessionId, user?.id);
    if (!caseRecord) return apiError("Case not found.", 404);

    await renameCase(id, body.title || "Untitled Case", sessionId, user?.id);
    return ok({ success: true });
  } catch {
    return apiError("Unable to rename case.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();
  const user = await getAuthenticatedUser();

  try {
    const caseRecord = await getCase(id, undefined, sessionId, user?.id);
    if (!caseRecord) return apiError("Case not found.", 404);

    await deleteCase(id, sessionId, user?.id);
    return ok({ success: true });
  } catch {
    return apiError("Unable to delete case.", 500);
  }
}
