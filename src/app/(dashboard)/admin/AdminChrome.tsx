"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/config/admin-nav";
import { AdminNavIcon } from "@/config/admin-nav-icons";
import { AdminFeedbackProviders } from "@/components/admin/AdminFeedbackProviders";
import { AdminLoadingState } from "@/components/admin/AdminPrimitives";

const MOBILE_NAV_MAX = 900;

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: s, status } = useSession();
  const isLogin = pathname === "/admin/login";
  const isOwner = s?.user?.role === "OWNER";
  const isEngineer = s?.user?.role === "ENGINEER";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      const mobile = window.innerWidth <= MOBILE_NAV_MAX;
      setIsMobileViewport(mobile);
      setSidebarOpen(window.innerWidth > MOBILE_NAV_MAX);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_NAV_MAX;
      setIsMobileViewport(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onSignOut = useCallback(() => {
    void signOut({ callbackUrl: "/" });
  }, []);

  const filteredNav = ADMIN_NAV_ITEMS.filter((n) =>
    n.ownerOnly ? isOwner : true,
  ).filter((n) => (isEngineer ? n.href === "/admin/audit" : true));

  const closeMobileSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth <= MOBILE_NAV_MAX) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth > MOBILE_NAV_MAX) return;
    const id = requestAnimationFrame(() => setSidebarOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileViewport || !sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileViewport, sidebarOpen]);

  useEffect(() => {
    if (!isMobileViewport || !sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileViewport, sidebarOpen]);

  if (isLogin) {
    return <>{children}</>;
  }
  if (status === "loading") {
    return (
      <div className="admin-canvas" dir="rtl">
        <div className="admin-body">
          <AdminLoadingState label="جارٍ التحقق من الجلسة…" />
        </div>
      </div>
    );
  }
  if (!s) {
    return <>{children}</>;
  }

  return (
    <AdminFeedbackProviders>
      <div className="admin-canvas" dir="rtl">
        <div
          className={`admin-backdrop${sidebarOpen && isMobileViewport ? " admin-backdrop--visible" : ""}`}
          role="presentation"
          onClick={closeMobileSidebar}
        />
        <header className="admin-topbar">
          <p className="admin-topbar__brand">لوحة التحكم</p>
          <button
            type="button"
            className="admin-topbar__toggle"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar-nav"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            {sidebarOpen ? "إخفاء القائمة" : "القائمة"}
          </button>
        </header>
        <aside
          id="admin-sidebar-nav"
          className={`admin-sidebar${sidebarOpen ? " admin-sidebar--open" : ""}`}
          aria-hidden={isMobileViewport && !sidebarOpen}
        >
          <p className="admin-brand admin-hide-mobile">لوحة التحكم</p>
          <nav className="admin-sidebar__nav" aria-label="التنقل الرئيسي">
            {filteredNav.map((n) => (
              <Link
                key={n.href}
                className={`admin-sidebar__link${isAdminNavActive(pathname, n.href) ? " is-active" : ""}`}
                href={n.href}
                onClick={closeMobileSidebar}
              >
                <AdminNavIcon href={n.href} />
                <span className="admin-sidebar__label">{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="admin-sidebar__footer">
            <button type="button" onClick={onSignOut} className="admin-signout">
              تسجيل خروج
            </button>
            <p className="admin-user">{s.user?.email}</p>
          </div>
        </aside>
        <div className="admin-body">{children}</div>
      </div>
    </AdminFeedbackProviders>
  );
}
