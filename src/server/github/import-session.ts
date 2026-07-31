import { cookies } from "next/headers";

import { env } from "~/env";
import { GITHUB_IMPORT_SESSION_COOKIE } from "~/server/github/constants";
import {
  encryptGithubImportSession,
  readGithubImportSessionValue,
} from "~/server/github/import-session-crypto";

const IMPORT_SESSION_MAX_AGE_SECONDS = 60 * 10;

export async function writeGithubImportSession(accessToken: string) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + IMPORT_SESSION_MAX_AGE_SECONDS * 1000;

  cookieStore.set(
    GITHUB_IMPORT_SESSION_COOKIE,
    encryptGithubImportSession(
      { accessToken, expiresAt },
      env.GITHUB_IMPORT_SESSION_SECRET,
    ),
    {
      httpOnly: true,
      maxAge: IMPORT_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  );
}

export async function readGithubImportSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(GITHUB_IMPORT_SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  const payload = readGithubImportSessionValue(
    value,
    env.GITHUB_IMPORT_SESSION_SECRET,
  );

  if (!payload) {
    cookieStore.delete(GITHUB_IMPORT_SESSION_COOKIE);
    return null;
  }

  return payload;
}

export async function clearGithubImportSession() {
  const cookieStore = await cookies();
  cookieStore.delete(GITHUB_IMPORT_SESSION_COOKIE);
}
