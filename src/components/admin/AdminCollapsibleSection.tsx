"use client";

import { useId, useState, type ReactNode } from "react";

export function AdminCollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={`admin-form-section${open ? " admin-form-section--open" : ""}`}>
      <button
        type="button"
        className="admin-form-section__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="admin-form-section__chevron" aria-hidden />
        <span className="admin-form-section__heading">
          <span className="admin-form-section__title">{title}</span>
          {description ? (
            <span className="admin-form-section__desc">{description}</span>
          ) : null}
        </span>
        {badge ? <span className="admin-form-section__badge">{badge}</span> : null}
      </button>
      {open ? (
        <div id={panelId} className="admin-form-section__panel">
          <div className="admin-form-section__body">{children}</div>
        </div>
      ) : null}
    </section>
  );
}
