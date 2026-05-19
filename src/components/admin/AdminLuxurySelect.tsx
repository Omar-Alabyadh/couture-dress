"use client";

import { useId } from "react";
import {
  LuxuryListbox,
  type LuxuryListboxOption,
} from "@/components/ui/LuxuryListbox";

export type AdminSelectOption = LuxuryListboxOption;

type AdminLuxurySelectProps = {
  id?: string;
  value?: string;
  options: AdminSelectOption[];
  onChange?: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  emptyLabel?: string;
  className?: string;
};

/** Custom dropdown — matches public /products luxury listbox (not native &lt;select&gt;). */
export function AdminLuxurySelect({
  id,
  value = "",
  options,
  onChange,
  disabled,
  emptyLabel,
  className = "",
}: AdminLuxurySelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={`admin-luxury-dd-inline ${className}`.trim()}>
      <LuxuryListbox
        id={selectId}
        value={value}
        options={options}
        onChange={(v) => onChange?.({ target: { value: v } })}
        disabled={disabled}
        emptyLabel={emptyLabel}
      />
    </div>
  );
}
