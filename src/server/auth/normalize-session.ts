export type AppAuth = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

type AuthSessionLike = {
  session: {
    expiresAt: Date | string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export function normalizeAuthSession(
  session: AuthSessionLike | null,
  now = Date.now(),
): AppAuth | null {
  if (!session || new Date(session.session.expiresAt).getTime() <= now) {
    return null;
  }

  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  };
}
