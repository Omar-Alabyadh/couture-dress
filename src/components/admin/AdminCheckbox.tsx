"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

type AdminCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  label: ReactNode;
  className?: string;
};

/** Checkbox + label inline — admin dark luxury identity. */
export function AdminCheckbox({
  label,
  className = "",
  id,
  disabled,
  ...rest
}: AdminCheckboxProps) {
  return (
    <label
      className={`admin-checkbox${disabled ? " admin-checkbox--disabled" : ""} ${className}`.trim()}
      htmlFor={id}
    >
      <input
        type="checkbox"
        id={id}
        className="admin-checkbox__input"
        disabled={disabled}
        {...rest}
      />
      <span className="admin-checkbox__box" aria-hidden />
      <span className="admin-checkbox__label">{label}</span>
    </label>
  );
}
