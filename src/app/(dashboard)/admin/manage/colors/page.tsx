"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { normalizeSearch } from "@/lib/admin/list-client";
import {
  sortOrderFromAdminDisplay,
  sortOrderToAdminDisplay,
  sortOrderToAdminDisplayString,
} from "@/lib/admin/sort-order";
import { useAdminConfirm } from "@/components/admin/AdminConfirmProvider";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminInput,
  AdminLoadingState,
  AdminSectionHeader,
  AdminTable,
  AdminTd,
} from "@/components/admin/AdminPrimitives";

type Color = {
  id: string;
  label: string;
  hex: string | null;
  sortOrder: number;
  deletedAt: string | null;
};

function ColorSwatch({ hex }: { hex: string | null }) {
  const h = hex?.trim().replace(/^#/, "");
  const valid = h && /^[0-9a-fA-F]{3,8}$/.test(h);
  return (
    <span
      className="admin-color-table-swatch"
      style={valid ? { background: `#${h!.slice(0, 6)}` } : undefined}
      aria-hidden
    />
  );
}

function ColorForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Color;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [hex, setHex] = useState(initial?.hex ?? "");
  const [sortOrder, setSortOrder] = useState(
    initial ? sortOrderToAdminDisplayString(initial.sortOrder) : "",
  );
  const [loading, setLoading] = useState(false);

  const previewHex = hex.trim().replace(/^#/, "");
  const previewValid =
    previewHex && /^[0-9a-fA-F]{3,8}$/.test(previewHex)
      ? `#${previewHex.slice(0, 6)}`
      : undefined;

  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const body = {
            label: label.trim(),
            hex: hex.trim() || null,
            ...(initial && sortOrder.trim()
              ? { sortOrder: sortOrderFromAdminDisplay(sortOrder) }
              : {}),
          };
          const r = await adminFetch(
            initial ? `/api/admin/colors/${initial.id}` : "/api/admin/colors",
            {
              method: initial ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
          );
          if (!r.ok) {
            pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
            return;
          }
          if (!initial) {
            setLabel("");
            setHex("");
          }
          pushToast(initial ? "تم تحديث اللون." : "تمت إضافة اللون.", "success");
          await onSaved();
        } finally {
          setLoading(false);
        }
      }}
    >
      <AdminField label="اسم اللون (للعميل)">
        <AdminInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          placeholder="مثال: كحلي"
        />
      </AdminField>
      <AdminField label="كود اللون (اختياري)" hint="بدون # — مثال: 2a1b3c">
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
          <AdminInput
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="2a1b3c"
            dir="ltr"
            style={{ flex: 1 }}
          />
          <span
            className="admin-color-table-swatch admin-color-table-swatch--lg"
            style={{ background: previewValid ?? "rgba(255,255,255,0.06)" }}
            aria-hidden
          />
        </div>
      </AdminField>
      {initial ? (
        <AdminField
          label="الترتيب"
          hint="1 = أول لون في قائمة الفلاتر."
        >
          <AdminInput
            type="number"
            min={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            dir="ltr"
          />
        </AdminField>
      ) : null}
      <div className="admin-form__submit-row">
        <AdminButton type="submit" variant="primary" disabled={loading}>
          {loading
            ? "جارٍ الحفظ…"
            : initial
              ? "حفظ"
              : "إضافة"}
        </AdminButton>
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </AdminButton>
      </div>
    </form>
  );
}

export default function AdminColorsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await adminFetch("/api/admin/colors", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Color[] };
        setList(j.data);
      }
    } catch {
      setLoadError("تعذر الاتصال بالخادم.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load]);

  const activeList = useMemo(() => list.filter((c) => !c.deletedAt), [list]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    let rows = activeList;
    if (q) {
      rows = rows.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          (c.hex?.toLowerCase().includes(q) ?? false),
      );
    }
    return rows;
  }, [activeList, search]);

  async function archiveColor(c: Color) {
    const ok = await requestConfirm({
      title: "أرشفة اللون",
      message: `هل تريد أرشفة اللون «${c.label}»؟ لن يظهر في الفلاتر للمنتجات الجديدة.`,
      confirmLabel: "أرشِف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/colors/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
      return;
    }
    pushToast("تمت أرشفة اللون.", "success");
    await load();
  }

  return (
    <div className="admin-page admin-page--catalog" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="ألوان الفلتر"
          description="تظهر في صفحة المنتجات كفلاتر. المؤرشف يُسترجع من الأرشيف الموحّد."
          actions={
            <AdminButton
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => setCreating(true)}
            >
              لون جديد
            </AdminButton>
          }
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && list.length === 0 && !loadError ? (
          <AdminLoadingState />
        ) : null}

        <label className="admin-list-toolbar__search" style={{ display: "block", marginTop: 12 }}>
          <span className="admin-field__label">بحث</span>
          <AdminInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم اللون أو الكود…"
          />
        </label>

        <AdminModal open={creating} title="لون جديد" onClose={() => setCreating(false)}>
          {creating ? (
            <ColorForm
              onClose={() => setCreating(false)}
              onSaved={async () => {
                setCreating(false);
                await load();
              }}
            />
          ) : null}
        </AdminModal>

        <AdminModal
          open={Boolean(editing)}
          title={editing ? `تعديل: ${editing.label}` : "تعديل"}
          onClose={() => setEditing(null)}
        >
          {editing ? (
            <ColorForm
              key={editing.id}
              initial={editing}
              onClose={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                await load();
              }}
            />
          ) : null}
        </AdminModal>

        {!loading && !loadError && activeList.length === 0 ? (
          <AdminEmptyState
            title="لا توجد ألوان"
            description='اضغط "لون جديد" أو حدّث الصفحة لتحميل الألوان الافتراضية.'
          />
        ) : null}

        {!loadError && filtered.length > 0 ? (
          <AdminTable style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th aria-label="معاينة">لون</th>
                <th>الاسم</th>
                <th>Hex</th>
                <th>ترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <AdminTd label="لون">
                    <ColorSwatch hex={c.hex} />
                  </AdminTd>
                  <AdminTd label="الاسم">{c.label}</AdminTd>
                  <AdminTd label="Hex" dir="ltr" style={{ fontSize: 12 }}>
                    {c.hex ? `#${c.hex.replace(/^#/, "")}` : "—"}
                  </AdminTd>
                  <AdminTd label="ترتيب">
                    {sortOrderToAdminDisplay(c.sortOrder)}
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <AdminRowActions
                      archived={false}
                      onEdit={() => setEditing(c)}
                      onArchive={() => void archiveColor(c)}
                    />
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : null}
      </AdminCard>
    </div>
  );
}
