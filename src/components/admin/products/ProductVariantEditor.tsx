"use client";

import {
  AdminButton,
  AdminCheckbox,
  AdminLuxurySelect,
} from "@/components/admin/AdminPrimitives";
import { SIZE_TYPE_LABELS } from "@/lib/admin/default-size-options";
import { variantRowSellable } from "@/lib/admin/product-status";

export type VariantFormRow = {
  key: string;
  size: string;
  colorId: string;
  /** Legacy free-text color when no colorId match */
  legacyColorLabel?: string;
  quantity: string;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
};

export type VariantColorOption = {
  id: string;
  label: string;
  hex: string | null;
  deletedAt?: string | null;
};

export type VariantSizeOption = {
  id: string;
  label: string;
  type: "STANDARD" | "LETTER" | "NUMBER";
  archivedAt?: string | null;
};

type ProductVariantEditorProps = {
  rows: VariantFormRow[];
  onChange: (rows: VariantFormRow[]) => void;
  colors: VariantColorOption[];
  sizes: VariantSizeOption[];
  /** When true, size is optional (e.g. accessories) — defaults to Standard when empty. */
  allowEmptySize?: boolean;
};

function parseQty(qty: string): number {
  const q = parseInt(qty.trim(), 10);
  return Number.isFinite(q) ? q : 0;
}

function patchRow(
  rows: VariantFormRow[],
  key: string,
  patch: Partial<VariantFormRow>,
): VariantFormRow[] {
  return rows.map((r) => (r.key === key ? { ...r, ...patch } : r));
}

function adminSizeLabel(label: string): string {
  if (label.toLowerCase() === "standard") return "مقاس واحد (Standard)";
  return label;
}

function buildSizeOptions(
  catalog: VariantSizeOption[],
  current: string,
): { value: string; label: string }[] {
  const active = catalog.filter((s) => !s.archivedAt);
  const opts = active.map((s) => ({
    value: s.label,
    label: `${adminSizeLabel(s.label)} — ${SIZE_TYPE_LABELS[s.type]}`,
  }));
  const cur = current.trim();
  if (cur && !opts.some((o) => o.value === cur)) {
    opts.unshift({ value: cur, label: `${adminSizeLabel(cur)} (قديم)` });
  }
  return opts;
}

function buildColorOptions(
  catalog: VariantColorOption[],
  row: VariantFormRow,
): { value: string; label: string }[] {
  const active = catalog.filter((c) => !c.deletedAt);
  const opts: { value: string; label: string }[] = [
    { value: "", label: "— بدون لون —" },
  ];
  for (const c of active) {
    opts.push({ value: c.id, label: c.label });
  }
  if (row.colorId && !active.some((c) => c.id === row.colorId)) {
    const archived = catalog.find((c) => c.id === row.colorId);
    if (archived) {
      opts.push({
        value: archived.id,
        label: `${archived.label} (مؤرشف)`,
      });
    }
  }
  const legacy = row.legacyColorLabel?.trim();
  if (legacy && !row.colorId) {
    opts.push({ value: `__legacy__:${legacy}`, label: `${legacy} (قديم)` });
  }
  return opts;
}

function colorSelectValue(row: VariantFormRow): string {
  if (row.colorId) return row.colorId;
  const legacy = row.legacyColorLabel?.trim();
  if (legacy) return `__legacy__:${legacy}`;
  return "";
}

export function ProductVariantEditor({
  rows,
  onChange,
  colors,
  sizes,
  allowEmptySize = false,
}: ProductVariantEditorProps) {
  function addRow() {
    const defaultSize =
      sizes.find((s) => !s.archivedAt && s.type === "STANDARD")?.label ?? "Standard";
    onChange([
      ...rows,
      {
        key: `var-${Math.random().toString(36).slice(2, 11)}`,
        size: defaultSize,
        colorId: "",
        quantity: "1",
        isAvailable: true,
        allowSpecialOrder: false,
      },
    ]);
  }

  function duplicateRow(key: string) {
    const src = rows.find((r) => r.key === key);
    if (!src) return;
    onChange([
      ...rows,
      {
        ...src,
        key: `var-${Math.random().toString(36).slice(2, 11)}`,
      },
    ]);
  }

  function removeRow(key: string) {
    if (rows.length <= 1) return;
    onChange(rows.filter((r) => r.key !== key));
  }

  function updateQuantity(key: string, quantity: string) {
    const q = parseQty(quantity);
    onChange(
      patchRow(rows, key, {
        quantity,
        isAvailable: q > 0 ? rows.find((r) => r.key === key)?.isAvailable ?? true : false,
      }),
    );
  }

  return (
    <section className="admin-variant-editor" aria-labelledby="variant-editor-title">
      <div className="admin-variant-editor__head">
        <h4 id="variant-editor-title" className="admin-variant-editor__title">
          المقاسات والتوفر
        </h4>
        <p className="admin-hint admin-variant-editor__hint">
          اختاري المقاس واللون من القوائم المعرّفة في الداشبورد. الكمية 0 تعني غير متوفر.
        </p>
      </div>

      <div className="admin-variant-editor__table" role="table" aria-label="صفوف المقاسات">
        <div className="admin-variant-editor__header" role="row">
          <span role="columnheader">لون</span>
          <span role="columnheader">مقاس</span>
          <span role="columnheader">كمية</span>
          <span role="columnheader">متاح</span>
          <span role="columnheader">طلب خاص</span>
          <span role="columnheader" className="admin-variant-editor__actions-head">
            —
          </span>
        </div>

        {rows.map((row) => {
          const qty = parseQty(row.quantity);
          const sellable = variantRowSellable(qty, row.isAvailable);
          const unavailable = !sellable;
          const sizeOptions = buildSizeOptions(sizes, row.size);
          const colorOptions = buildColorOptions(colors, row);
          return (
            <div
              key={row.key}
              className={`admin-variant-editor__row${unavailable ? " admin-variant-editor__row--unavailable" : ""}`}
              role="row"
            >
              <div className="admin-variant-editor__cell" role="cell">
                <span className="admin-variant-editor__cell-label">لون</span>
                <AdminLuxurySelect
                  id={`variant-color-${row.key}`}
                  value={colorSelectValue(row)}
                  options={colorOptions}
                  emptyLabel="— بدون لون —"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.startsWith("__legacy__:")) {
                      onChange(
                        patchRow(rows, row.key, {
                          colorId: "",
                          legacyColorLabel: v.slice("__legacy__:".length),
                        }),
                      );
                      return;
                    }
                    onChange(
                      patchRow(rows, row.key, {
                        colorId: v,
                        legacyColorLabel: undefined,
                      }),
                    );
                  }}
                />
              </div>

              <div className="admin-variant-editor__cell" role="cell">
                <span className="admin-variant-editor__cell-label">مقاس</span>
                <AdminLuxurySelect
                  id={`variant-size-${row.key}`}
                  value={row.size}
                  options={
                    allowEmptySize
                      ? [{ value: "", label: "— بدون —" }, ...sizeOptions]
                      : sizeOptions
                  }
                  emptyLabel="— اختر مقاسًا —"
                  onChange={(e) =>
                    onChange(patchRow(rows, row.key, { size: e.target.value }))
                  }
                />
              </div>

              <label className="admin-variant-editor__cell" role="cell">
                <span className="admin-variant-editor__cell-label">كمية</span>
                <input
                  className="admin-control"
                  type="number"
                  min={0}
                  value={row.quantity}
                  onChange={(e) => updateQuantity(row.key, e.target.value)}
                />
              </label>

              <div
                className="admin-variant-editor__cell admin-variant-editor__cell--check"
                role="cell"
              >
                <AdminCheckbox
                  id={`variant-available-${row.key}`}
                  label="متاح"
                  checked={row.isAvailable && qty > 0}
                  disabled={qty <= 0}
                  onChange={(e) =>
                    onChange(
                      patchRow(rows, row.key, { isAvailable: e.target.checked }),
                    )
                  }
                />
              </div>

              <div
                className="admin-variant-editor__cell admin-variant-editor__cell--check"
                role="cell"
              >
                <AdminCheckbox
                  id={`variant-special-${row.key}`}
                  label="طلب خاص"
                  checked={row.allowSpecialOrder}
                  onChange={(e) =>
                    onChange(
                      patchRow(rows, row.key, {
                        allowSpecialOrder: e.target.checked,
                      }),
                    )
                  }
                />
              </div>

              <div
                className="admin-variant-editor__cell admin-variant-editor__row-actions"
                role="cell"
              >
                {unavailable ? (
                  <span className="admin-variant-editor__unavailable-tag">
                    غير متوفر
                  </span>
                ) : null}
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => duplicateRow(row.key)}
                  aria-label="نسخ الصف"
                >
                  نسخ
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 1}
                  aria-label="حذف الصف"
                >
                  حذف
                </AdminButton>
              </div>
            </div>
          );
        })}
      </div>

      <AdminButton type="button" variant="secondary" onClick={addRow}>
        + إضافة صف مقاس
      </AdminButton>
    </section>
  );
}
