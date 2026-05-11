import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminManageLayout({
  children,
}: {
  children: ReactNode;
}) {
  const s = await auth();
  if (s?.user?.role !== "OWNER") {
    redirect("/admin/audit");
  }
  return <>{children}</>;
}
