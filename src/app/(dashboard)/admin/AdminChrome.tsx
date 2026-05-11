"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";

const nav: { href: string; label: string; ownerOnly: boolean }[] = [
  { href: "/admin", label: "نظرة عامة", ownerOnly: false },
  { href: "/admin/manage/products", label: "المنتجات", ownerOnly: true },
  { href: "/admin/manage/colors", label: "الألوان", ownerOnly: true },
  { href: "/admin/manage/landing", label: "الصفحة الرئيسية", ownerOnly: true },
  { href: "/admin/manage/trash", label: "الأرشيف (محذوف)", ownerOnly: true },
  { href: "/admin/audit", label: "سجل التدقيق", ownerOnly: false },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: s, status } = useSession();
  const isLogin = pathname === "/admin/login";
  const isOwner = s?.user?.role === "OWNER";
  const isEngineer = s?.user?.role === "ENGINEER";

  const onSignOut = useCallback(() => {
    void signOut({ callbackUrl: "/" });
  }, []);

  if (isLogin) {
    return <>{children}</>;
  }
  if (status === "loading") {
    return <div className="admin-canvas">…</div>;
  }
  if (!s) {
    return <>{children}</>;
  }
  return (
    <div className="admin-canvas">
      <div className="admin-sidebar">
        <p className="admin-brand">لوحة التحكم</p>
        {nav
          .filter((n) => (n.ownerOnly ? isOwner : true))
          .filter((n) => (isEngineer ? n.href === "/admin/audit" : true))
          .map((n) => (
            <Link
              key={n.href}
              className={pathname === n.href ? "is-active" : ""}
              href={n.href}
            >
              {n.label}
            </Link>
          ))}
        <button type="button" onClick={onSignOut} className="admin-signout">
          تسجيل خروج
        </button>
        <p className="admin-user">{s.user?.email}</p>
      </div>
      <div className="admin-body">{children}</div>
    </div>
  );
}
