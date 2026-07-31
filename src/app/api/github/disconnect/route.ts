import { NextResponse } from "next/server";

import { getSignInPath, sanitizeAuthCallbackUrl } from "~/lib/auth-redirect";
import { getCurrentAuth } from "~/server/auth/session";
import { disconnectGithub } from "~/server/github/connection";

export async function POST(request: Request) {
  const currentAuth = await getCurrentAuth();
  if (!currentAuth) {
    return NextResponse.redirect(
      new URL(getSignInPath("/onboarding/github"), request.url),
      { status: 303 },
    );
  }
  const { userId } = currentAuth;

  await disconnectGithub(userId);

  const requestUrl = new URL(request.url);
  const returnTo = requestUrl.searchParams.get("returnTo");
  const redirectTarget = sanitizeAuthCallbackUrl(
    returnTo,
    "/onboarding/github",
  );

  return NextResponse.redirect(
    new URL(`${redirectTarget}?success=disconnected`, request.url),
    { status: 303 },
  );
}
