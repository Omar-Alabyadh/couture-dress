"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`admin-card ${className}`.trim()}>{children}</div>;
}

export type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
};

export function AdminButton({
  variant = "primary",
  className = "",
  ...rest
}: AdminButtonProps) {
  return (
    <button
      className={`admin-btn admin-btn--${variant} ${className}`.trim()}
      {...rest}
    />
  );
}

export function AdminSectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-section-header">
      <div className="admin-section-header__text">
        <h1 className="admin-section-header__title">{title}</h1>
        {description ? (
          <p className="admin-section-header__desc admin-hint">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="admin-section-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}

export function AdminField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="admin-field" htmlFor={htmlFor}>
      <span className="admin-field__label">{label}</span>
      {children}
      {hint ? <span className="admin-field__hint admin-hint">{hint}</span> : null}
    </label>
  );
}

export function AdminInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`admin-control ${className ?? ""}`.trim()} {...rest} />
  );
}

export function AdminTextarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`admin-control ${className ?? ""}`.trim()} {...rest} />
  );
}

export function AdminSelect({
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`admin-control ${className ?? ""}`.trim()} {...rest} />
  );
}

export function AdminTable({
  children,
  className = "",
  responsiveCards = true,
  ...rest
}: TableHTMLAttributes<HTMLTableElement> & { responsiveCards?: boolean }) {
  return (
    <div className="admin-table-wrap">
      <table
        className={`admin-table${responsiveCards ? " admin-table--cards" : ""} ${className}`.trim()}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

export function AdminTd({
  label,
  className = "",
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { label: string }) {
  const visual = label === "";
  return (
    <td
      data-label={label}
      className={`${visual ? "admin-table__cell--visual " : ""}${className}`.trim()}
      {...rest}
    >
      {children}
    </td>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="admin-empty" role="status">
      <p className="admin-empty__title">{title}</p>
      {description ? <p className="admin-empty__desc admin-hint">{description}</p> : null}
    </div>
  );
}

export function AdminLoadingState({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="admin-loading" role="status" aria-busy="true">
      <span className="admin-loading__dot" aria-hidden />
      <span className="admin-loading__text">{label}</span>
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
  retryLabel = "إعادة المحاولة",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="admin-error-state" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <AdminButton type="button" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </AdminButton>
      ) : null}
    </div>
  );
}
