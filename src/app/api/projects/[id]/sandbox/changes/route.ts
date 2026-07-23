import { getSandboxChanges } from "~/server/sandbox/changes";
import {
  readQueryStringField,
  sandboxError,
  sandboxJson,
  type ProjectSandboxRouteContext,
  validateProjectSandboxSession,
  withOwnedProjectSandboxRoute,
} from "~/server/sandbox/route-helpers";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: ProjectSandboxRouteContext,
) {
  return withOwnedProjectSandboxRoute(request, context, async (access) => {
    const sessionId = readQueryStringField(request, "sessionId");
    const sessionError = await validateProjectSandboxSession(access, sessionId);

    if (sessionError) return sessionError;

    try {
      const changes = await getSandboxChanges(sessionId!);
      return sandboxJson({ changes, ok: true as const });
    } catch (error) {
      console.error("Sandbox changes read failed:", error);
      return sandboxError("changes_unavailable", 500);
    }
  });
}
