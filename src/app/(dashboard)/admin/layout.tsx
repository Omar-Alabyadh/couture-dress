import type { ReactNode } from "react";
import { AdminChrome } from "./AdminChrome";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/auth";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <AdminChrome>{children}</AdminChrome>
    </SessionProvider>
  );
}
