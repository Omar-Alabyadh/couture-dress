"use client";

import {
  LuxuryListbox,
  type LuxuryListboxOption,
} from "@/components/ui/LuxuryListbox";

export type { LuxuryListboxOption };

type AdminLuxuryListboxProps = {
  id: string;
  label?: string;
  value: string;
  options: LuxuryListboxOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
  hint?: string;
};

/** Custom listbox styled for admin (matches public /products luxury dropdown). */
export function AdminLuxuryListbox({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
  emptyLabel,
  hint,
}: AdminLuxuryListboxProps) {
  return (
    <div className="admin-luxury-dd-field">
      {label ? (
        <label className="admin-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <LuxuryListbox
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        emptyLabel={emptyLabel}
      />
      {hint ? <p className="admin-hint">{hint}</p> : null}
    </div>
  );
}
