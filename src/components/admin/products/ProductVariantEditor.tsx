"use client";

import { AdminButton, AdminSelect } from "@/components/admin/AdminPrimitives";
import { variantRowSellable } from "@/lib/admin/product-status";

export type VariantFormRow = {
  key: string;
  size: string;
  colorId: string;
  quantity: string;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
};

type ColorOption = { id: string; label: string; deletedAt?: string | null };

type ProductVariantEditorProps = {
  rows: VariantFormRow[];
  colors: ColorOption[];
  onChange: (rows: VariantFormRow[]) => void;
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

export function ProductVariantEditor({
  rows,
  colors,
  onChange,
}: ProductVariantEditorProps) {
  function addRow() {
    onChange([
      ...rows,
      {
        key: `var-${Math.random().toString(36).slice(2, 11)}`,
        size: "",
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
        size: src.size ? `${src.size} (نسخة)` : "",
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
          الكمية 0 تعني غير متوفر للبيع. «طلب خاص» يسمح بطلب واتساب عند عدم التوفر.
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
          return (
            <div
              key={row.key}
              className={`admin-variant-editor__row${unavailable ? " admin-variant-editor__row--unavailable" : ""}`}
              role="row"
            >
              <label className="admin-variant-editor__cell" role="cell">
                <span className="admin-variant-editor__cell-label">لون</span>
                <AdminSelect
                  value={row.colorId}
                  onChange={(e) =>
                    onChange(patchRow(rows, row.key, { colorId: e.target.value }))
                  }
                >
                  <option value="">— بدون —</option>
                  {colors.map((c) => {
                    const archived = Boolean(c.deletedAt);
                    if (archived && row.colorId !== c.id) return null;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.label}
                        {archived ? " (مؤرشف)" : ""}
                      </option>
                    );
                  })}
                </AdminSelect>
              </label>

              <label className="admin-variant-editor__cell" role="cell">
                <span className="admin-variant-editor__cell-label">مقاس</span>
                <input
                  className="admin-control"
                  value={row.size}
                  required
                  onChange={(e) =>
                    onChange(patchRow(rows, row.key, { size: e.target.value }))
                  }
                />
              </label>

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

              <label
                className="admin-variant-editor__cell admin-variant-editor__cell--check"
                role="cell"
              >
                <span className="admin-variant-editor__cell-label">متاح</span>
                <input
                  type="checkbox"
                  checked={row.isAvailable && qty > 0}
                  disabled={qty <= 0}
                  onChange={(e) =>
                    onChange(
                      patchRow(rows, row.key, { isAvailable: e.target.checked }),
                    )
                  }
                />
              </label>

              <label
                className="admin-variant-editor__cell admin-variant-editor__cell--check"
                role="cell"
              >
                <span className="admin-variant-editor__cell-label">طلب خاص</span>
                <input
                  type="checkbox"
                  checked={row.allowSpecialOrder}
                  onChange={(e) =>
                    onChange(
                      patchRow(rows, row.key, {
                        allowSpecialOrder: e.target.checked,
                      }),
                    )
                  }
                />
              </label>

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
