export const DEFAULT_AUTH_CALLBACK_URL = "/projects";

export function sanitizeAuthCallbackUrl(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_CALLBACK_URL,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function getSignInPath(callbackURL: string) {
  const safeCallbackURL = sanitizeAuthCallbackUrl(callbackURL);

  if (safeCallbackURL === DEFAULT_AUTH_CALLBACK_URL) {
    return "/sign-in";
  }

  const params = new URLSearchParams({ callbackURL: safeCallbackURL });
  return `/sign-in?${params.toString()}`;
}
