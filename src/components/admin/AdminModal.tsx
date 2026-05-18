"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { AdminButton } from "@/components/admin/AdminPrimitives";

type AdminModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export function AdminModal({
  open,
  title,
  onClose,
  children,
  wide,
}: AdminModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="admin-form-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-form-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`admin-form-modal__panel${wide ? " admin-form-modal__panel--wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-form-modal__header">
          <h2 id="admin-form-modal-title">{title}</h2>
          <AdminButton
            type="button"
            variant="ghost"
            icon={X}
            onClick={onClose}
            aria-label="إغلاق"
          />
        </header>
        <div className="admin-form-modal__body">{children}</div>
      </div>
    </div>
  );
}
