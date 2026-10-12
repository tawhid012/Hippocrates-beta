import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { updateCaseMetadata, getCase } from "@/lib/cases/repository";
import { getClientSessionId } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const sessionId = await getClientSessionId();

  let body: {
    name?: string;
    age?: string;
    sex?: string;
    history?: string;
    medications?: string;
    allergies?: string;
  };

  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  try {
    // Check if case exists and belongs to current session
    const caseRecord = await getCase(id, undefined, sessionId);
    if (!caseRecord) {
      return apiError("Session not found.", 404);
    }

    const patientInfo = {
      name: (body.name || "").slice(0, 100),
      age: (body.age || "").slice(0, 20),
      sex: (body.sex || "").slice(0, 20),
      history: (body.history || "").slice(0, 2000),
      medications: (body.medications || "").slice(0, 1000),
      allergies: (body.allergies || "").slice(0, 1000),
    };

    await updateCaseMetadata(id, { patientInfo }, sessionId);

    return ok({ ok: true, patientInfo });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to save patient info.";
    return apiError(msg, 500);
  }
}
