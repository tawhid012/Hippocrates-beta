import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { deleteCase, getCase, renameCase } from "@/lib/cases/repository";
import { getClientSessionId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();

  try {
    const caseRecord = await getCase(id, undefined, sessionId);
    if (!caseRecord) return apiError("Case not found.", 404);
    return ok({ case: caseRecord });
  } catch {
    return apiError("Unable to load case.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  try {
    const caseRecord = await getCase(id, undefined, sessionId);
    if (!caseRecord) return apiError("Case not found.", 404);

    await renameCase(id, body.title || "Untitled Case", sessionId);
    return ok({ success: true });
  } catch {
    return apiError("Unable to rename case.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();

  try {
    const caseRecord = await getCase(id, undefined, sessionId);
    if (!caseRecord) return apiError("Case not found.", 404);

    await deleteCase(id, sessionId);
    return ok({ success: true });
  } catch {
    return apiError("Unable to delete case.", 500);
  }
}
