"use client";

import { createAuthClient } from "better-auth/react";

type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

const authClient = createAuthClient();

export function useAuthSession() {
  const { data, error, isPending, refetch } = authClient.useSession();

  return {
    error,
    isPending,
    refetch,
    user: data
      ? {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image ?? null,
        }
      : null,
  };
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const { error } = await authClient.signIn.email({
    email: input.email,
    password: input.password,
    rememberMe: true,
  });

  if (error) {
    return {
      ok: false,
      error: "The email or password is incorrect.",
    };
  }

  return { ok: true };
}

export async function signUpWithEmail(input: {
  email: string;
  name: string;
  password: string;
}): Promise<AuthActionResult> {
  const { error } = await authClient.signUp.email({
    email: input.email,
    name: input.name,
    password: input.password,
  });

  if (error) {
    const duplicateEmail =
      error.code === "USER_ALREADY_EXISTS" ||
      error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";

    return {
      ok: false,
      error: duplicateEmail
        ? "An account already exists for this email."
        : "Your account could not be created. Check the details and try again.",
    };
  }

  return { ok: true };
}

export async function signOut(): Promise<AuthActionResult> {
  const { error } = await authClient.signOut();

  if (error) {
    return {
      ok: false,
      error: "You could not be signed out. Please try again.",
    };
  }

  return { ok: true };
}
