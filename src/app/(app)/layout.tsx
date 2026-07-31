import { requireCurrentAuth } from "~/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireCurrentAuth();

  return children;
}
