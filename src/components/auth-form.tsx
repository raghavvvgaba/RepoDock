"use client";

import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  signInWithEmail,
  signUpWithEmail,
} from "~/lib/auth-client";
import { DEFAULT_AUTH_CALLBACK_URL } from "~/lib/auth-redirect";

type AuthFormProps = {
  callbackURL: string;
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ callbackURL, mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (!email || !password || (isSignUp && !name)) {
      setError("Complete every required field.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      setIsSubmitting(false);
      return;
    }

    const result = isSignUp
      ? await signUpWithEmail({ email, name, password })
      : await signInWithEmail({ email, password });

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    window.location.assign(callbackURL);
  }

  const alternatePath = isSignUp ? "/sign-in" : "/sign-up";
  const alternateHref =
    callbackURL === DEFAULT_AUTH_CALLBACK_URL
      ? alternatePath
      : `${alternatePath}?${new URLSearchParams({ callbackURL }).toString()}`;

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {isSignUp ? (
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wider"
              htmlFor="name"
            >
              Name
            </label>
            <Input
              autoComplete="name"
              className="h-11 rounded-none border-border bg-background px-3"
              disabled={isSubmitting}
              id="name"
              maxLength={120}
              name="name"
              placeholder="Ada Lovelace"
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wider"
            htmlFor="email"
          >
            Email
          </label>
          <Input
            autoComplete="email"
            className="h-11 rounded-none border-border bg-background px-3"
            disabled={isSubmitting}
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <label
              className="text-xs font-semibold uppercase tracking-wider"
              htmlFor="password"
            >
              Password
            </label>
            {isSignUp ? (
              <span className="font-mono text-[10px] text-muted-foreground">
                8–128 characters
              </span>
            ) : null}
          </div>
          <Input
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="h-11 rounded-none border-border bg-background px-3"
            disabled={isSubmitting}
            id="password"
            maxLength={128}
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>

        {error ? (
          <Alert className="rounded-none" variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="h-11 w-full rounded-none"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <ArrowRight />
          )}
          {isSubmitting
            ? isSignUp
              ? "Creating account…"
              : "Signing in…"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Local credentials
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account?" : "New to RepoDock?"}{" "}
        <Link
          className="font-semibold text-foreground underline-offset-4 hover:underline"
          href={alternateHref}
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
