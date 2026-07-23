import { sandboxProvider } from "~/server/sandbox/provider";
import {
  readJsonObject,
  readStringField,
  respondWithSandboxAction,
  sandboxError,
  sandboxJson,
  type ProjectSandboxRouteContext,
  validateProjectSandboxSession,
  withOwnedProjectSandboxRoute,
} from "~/server/sandbox/route-helpers";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  request: Request,
  context: ProjectSandboxRouteContext,
) {
  return withOwnedProjectSandboxRoute(request, context, async (access) => {
    const body = await readJsonObject(request);
    const sessionId = readStringField(body, "sessionId");
    const sessionError = await validateProjectSandboxSession(access, sessionId);

    if (sessionError) return sessionError;
    if (!sessionId) return sandboxError("missing_session_id");

    return respondWithSandboxAction(
      () => sandboxProvider.checkPreview(sessionId),
      (session) => sandboxJson({ ok: true as const, session }),
      "Unable to check preview.",
    );
  });
}
