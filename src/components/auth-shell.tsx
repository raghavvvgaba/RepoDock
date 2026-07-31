import { ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 bg-primary/10 blur-[110px]"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden border border-border bg-card shadow-2xl shadow-black/10 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden border-r border-border bg-foreground p-10 text-background lg:flex">
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <Link
            className="relative flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em]"
            href="/"
          >
            <span className="flex size-9 items-center justify-center border border-background/25">
              <Terminal className="size-4" />
            </span>
            RepoDock
          </Link>

          <div className="relative space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/55">
              Shared engineering workspace
            </p>
            <h2 className="max-w-sm text-4xl font-semibold leading-[1.05] tracking-tight">
              Your repository.
              <br />
              Your environment.
              <br />
              One visible agent.
            </h2>
            <p className="max-w-sm text-sm leading-6 text-background/60">
              Inspect every command, diff, preview, and Git action from the same
              cloud workspace.
            </p>
          </div>

          <div className="relative flex items-center gap-3 border-t border-background/15 pt-6 text-xs text-background/55">
            <ShieldCheck className="size-4" />
            Credentials stay inside RepoDock.
          </div>
        </aside>

        <section className="flex min-h-[560px] flex-col justify-center p-6 sm:p-10 lg:p-14">
          <Link
            className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] lg:hidden"
            href="/"
          >
            <Terminal className="size-4" />
            RepoDock
          </Link>

          <div className="mb-8 space-y-3">
            {eyebrow ? (
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            ) : null}
            {description ? (
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
