import { AuthForm } from "~/components/auth-form";
import { AuthShell } from "~/components/auth-shell";
import { sanitizeAuthCallbackUrl } from "~/lib/auth-redirect";

type SignInPageProps = {
  searchParams: Promise<{ callbackURL?: string }>;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const params = await searchParams;
  const callbackURL = sanitizeAuthCallbackUrl(params.callbackURL);

  return (
    <AuthShell
      description="Sign in to reopen your repository workspaces, sandboxes, and GitHub connection."
      eyebrow="Authentication / Sign in"
      title="Continue building"
    >
      <AuthForm callbackURL={callbackURL} mode="sign-in" />
    </AuthShell>
  );
}
