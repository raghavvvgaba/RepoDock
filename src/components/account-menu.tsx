"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { signOut, useAuthSession } from "~/lib/auth-client";

function getInitials(name: string | undefined) {
  if (!name) {
    return "RD";
  }

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AccountMenu() {
  const router = useRouter();
  const { isPending, user } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    const result = await signOut();

    if (!result.ok) {
      toast.error(result.error);
      setIsSigningOut(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (isPending || !user) {
    return (
      <div
        aria-label="Loading account"
        className="size-8 animate-pulse rounded-full bg-muted"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open account menu"
          className="rounded-full outline-none ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          type="button"
        >
          <Avatar>
            {user.image ? (
              <AvatarImage alt={user.name} src={user.image} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-none border border-border shadow-xl"
      >
        <DropdownMenuLabel className="space-y-1 px-3 py-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-none"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          variant="destructive"
        >
          {isSigningOut ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LogOut />
          )}
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
