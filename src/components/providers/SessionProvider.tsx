"use client";

import { SessionProvider as NextSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

type SessionProviderProps = {
  children: ReactNode;
  /** From `await auth()` in a Server Component so SSR matches the first client render */
  session?: Session | null;
};

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextSessionProvider session={session ?? undefined}>
      {children}
    </NextSessionProvider>
  );
}
