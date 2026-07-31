import { NextResponse } from "next/server";

import { getSignInPath } from "~/lib/auth-redirect";
import { getCurrentAuth } from "~/server/auth/session";
import { beginGithubOauth } from "~/server/github/oauth";

export async function GET(request: Request) {
  if (!(await getCurrentAuth())) {
    return NextResponse.redirect(
      new URL(getSignInPath("/projects?newImport=true"), request.url),
    );
  }

  const authorizeUrl = await beginGithubOauth("import-session");
  return NextResponse.redirect(authorizeUrl);
}
