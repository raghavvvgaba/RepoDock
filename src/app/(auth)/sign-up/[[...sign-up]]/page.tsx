import { AuthForm } from "~/components/auth-form";
import { AuthShell } from "~/components/auth-shell";
import { sanitizeAuthCallbackUrl } from "~/lib/auth-redirect";

type SignUpPageProps = {
  searchParams: Promise<{ callbackURL?: string }>;
};

export default async function SignUpPage({
  searchParams,
}: SignUpPageProps) {
  const params = await searchParams;
  const callbackURL = sanitizeAuthCallbackUrl(params.callbackURL);

  return (
    <AuthShell
      description="Create your RepoDock account, then connect GitHub and import your first repository."
      eyebrow="Authentication / Sign up"
      title="Open your workspace"
    >
      <AuthForm callbackURL={callbackURL} mode="sign-up" />
    </AuthShell>
  );
}
