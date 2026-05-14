"use client";

import { useEffect, type ReactNode } from "react";

export type MobileNavShellProps = {
  open: boolean;
  onClose: () => void;
  /** Must match `aria-controls` on the menu toggle. */
  id: string;
  children: ReactNode;
};

/**
 * Full-screen mobile nav overlay: backdrop tap, body scroll lock, Escape to close.
 * Visual styling lives in `motion.css` (max-width: 720px).
 */
export function MobileNavShell({
  open,
  onClose,
  id,
  children,
}: MobileNavShellProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`mobile-nav-shell${open ? " mobile-nav-shell--open" : ""}`}
    >
      <button
        type="button"
        className="mobile-nav-shell__backdrop"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
      />
      <nav
        id={id}
        className="mobile-nav mobile-nav--drawer"
        dir="rtl"
        aria-hidden={!open}
      >
        <div className="mobile-nav__panel">{children}</div>
      </nav>
    </div>
  );
}
