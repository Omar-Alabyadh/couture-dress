"use client";

import { useEffect } from "react";
import { AdminPortal } from "@/components/admin/AdminPortal";
import { AdminButton } from "@/components/admin/AdminPrimitives";

type ImagePreviewModalProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImagePreviewModal({
  open,
  src,
  alt,
  onClose,
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AdminPortal>
    <div
      className="admin-modal-root admin-overlay-root admin-image-preview-root"
      role="dialog"
      aria-modal="true"
      aria-label="معاينة الصورة"
      onClick={onClose}
    >
      <div
        className="admin-image-preview"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-image-preview__header">
          <AdminButton type="button" variant="ghost" onClick={onClose}>
            إغلاق
          </AdminButton>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
        <img src={src} alt={alt} className="admin-image-preview__img" />
      </div>
    </div>
    </AdminPortal>
  );
}
