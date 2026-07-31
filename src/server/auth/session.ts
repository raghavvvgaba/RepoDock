import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getSignInPath } from "~/lib/auth-redirect";
import { auth } from "~/server/auth/auth";
import { normalizeAuthSession } from "~/server/auth/normalize-session";

const readSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  }),
);

export const getCurrentAuth = cache(async () =>
  normalizeAuthSession(await readSession()),
);

export async function requireCurrentAuth(callbackURL = "/projects") {
  const currentAuth = await getCurrentAuth();

  if (!currentAuth) {
    redirect(getSignInPath(callbackURL));
  }

  return currentAuth;
}
