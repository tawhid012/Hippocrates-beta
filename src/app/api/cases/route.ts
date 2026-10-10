import { apiError, ok, parseJsonError } from "@/lib/api/response";
import { createCase, listCases, type WorkspaceType } from "@/lib/cases/repository";
import { getClientSessionId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const sessionId = await getClientSessionId();
    const { searchParams } = new URL(request.url);
    const wsParam = searchParams.get("workspace") as WorkspaceType | null;
    const workspace = wsParam === "aegis" || wsParam === "oracle" ? wsParam : undefined;

    return ok({ cases: await listCases(workspace, sessionId) });
  } catch {
    return apiError("Unable to load cases.", 500);
  }
}

export async function POST(request: Request) {
  let body: {
    title?: string;
    workspace?: WorkspaceType;
    model?: string;
    persona?: string;
    elevenlabsConversationId?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return parseJsonError();
  }

  try {
    const sessionId = await getClientSessionId();
    const workspace = body.workspace === "aegis" ? "aegis" : "oracle";
    const caseRecord = await createCase(
      body.title || "Untitled Session",
      workspace,
      body.model,
      body.persona,
      body.elevenlabsConversationId,
      undefined,
      sessionId
    );
    return ok({ case: caseRecord }, { status: 201 });
  } catch {
    return apiError("Unable to create case.", 500);
  }
}
