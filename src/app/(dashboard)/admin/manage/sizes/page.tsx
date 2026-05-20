"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  nextSortOrder,
  nextSortOrderForAdminDisplay,
  sortOrderFromAdminDisplay,
  sortOrderToAdminDisplay,
  sortOrderToAdminDisplayString,
} from "@/lib/admin/sort-order";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { normalizeSearch } from "@/lib/admin/list-client";
import { SIZE_TYPE_LABELS } from "@/lib/admin/default-size-options";
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
  AdminLuxurySelect,
  AdminTable,
  AdminTd,
} from "@/components/admin/AdminPrimitives";

type SizeOptionType = "STANDARD" | "LETTER" | "NUMBER";

type SizeRow = {
  id: string;
  label: string;
  type: SizeOptionType;
  sortOrder: number;
  archivedAt: string | null;
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "كل الأنواع" },
  { value: "STANDARD", label: SIZE_TYPE_LABELS.STANDARD },
  { value: "LETTER", label: SIZE_TYPE_LABELS.LETTER },
  { value: "NUMBER", label: SIZE_TYPE_LABELS.NUMBER },
];

const TYPE_FORM_OPTIONS: { value: SizeOptionType; label: string }[] = [
  { value: "STANDARD", label: SIZE_TYPE_LABELS.STANDARD },
  { value: "LETTER", label: SIZE_TYPE_LABELS.LETTER },
  { value: "NUMBER", label: SIZE_TYPE_LABELS.NUMBER },
];

function SizeForm({
  initial,
  existing = [],
  onClose,
  onSaved,
}: {
  initial?: SizeRow;
  existing?: SizeRow[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<SizeOptionType>(initial?.type ?? "LETTER");

  const suggestedSort = useMemo(() => {
    const sameType = existing.filter(
      (s) => !s.archivedAt && s.type === type,
    );
    return nextSortOrder(sameType);
  }, [existing, type]);

  const [sortOrder, setSortOrder] = useState(() =>
    sortOrderToAdminDisplayString(initial?.sortOrder ?? suggestedSort),
  );
  const [loading, setLoading] = useState(false);

  function applySuggestedSortForType(nextType: SizeOptionType) {
    const sameType = existing.filter(
      (s) => !s.archivedAt && s.type === nextType,
    );
    setSortOrder(String(nextSortOrderForAdminDisplay(sameType)));
  }

  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const body = {
            label: label.trim(),
            type,
            sortOrder: sortOrderFromAdminDisplay(sortOrder),
          };
          const r = await fetch(
            initial ? `/api/admin/sizes/${initial.id}` : "/api/admin/sizes",
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
          pushToast(initial ? "تم التحديث." : "تمت إضافة المقاس.", "success");
          await onSaved();
        } finally {
          setLoading(false);
        }
      }}
    >
      <AdminField label="الاسم">
        <AdminInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          placeholder="مثال: M أو 42 أو Standard"
          dir="ltr"
        />
      </AdminField>
      <AdminField label="النوع" htmlFor="size-form-type">
        <AdminLuxurySelect
          id="size-form-type"
          value={type}
          options={TYPE_FORM_OPTIONS}
          disabled={Boolean(initial)}
          onChange={(e) => {
            const nextType = e.target.value as SizeOptionType;
            setType(nextType);
            if (!initial) applySuggestedSortForType(nextType);
          }}
        />
      </AdminField>
      <AdminField
        label="الترتيب"
        hint={
          initial
            ? "1 = أول مقاس ضمن نفس النوع في القوائم."
            : "يُحدَّث تلقائيًا حسب النوع — 1 يظهر أولًا ضمن نفس النوع."
        }
      >
        <AdminInput
          type="number"
          min={1}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          dir="ltr"
        />
      </AdminField>
      <div className="admin-form__submit-row">
        <AdminButton type="submit" variant="primary" disabled={loading}>
          {loading ? "جارٍ الحفظ…" : initial ? "حفظ" : "إضافة"}
        </AdminButton>
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </AdminButton>
      </div>
    </form>
  );
}

export default function AdminSizesPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<SizeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SizeRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await adminFetch("/api/admin/sizes", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: SizeRow[] };
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

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    return list.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (!q) return true;
      return (
        s.label.toLowerCase().includes(q) ||
        SIZE_TYPE_LABELS[s.type].includes(q)
      );
    });
  }, [list, search, typeFilter]);

  async function restoreSize(row: SizeRow) {
    const r = await adminFetch(`/api/admin/sizes/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (!r.ok) {
      pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
      return;
    }
    pushToast("تم الاسترجاع.", "success");
    await load();
  }

  async function archiveSize(row: SizeRow) {
    const ok = await requestConfirm({
      title: "أرشفة المقاس",
      message: `هل تريد أرشفة المقاس «${row.label}»؟ لن يظهر عند إضافة منتجات جديدة.`,
      confirmLabel: "أرشِف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/sizes/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
      return;
    }
    pushToast("تمت أرشفة المقاس.", "success");
    await load();
  }

  return (
    <div className="admin-page admin-page--catalog" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="المقاسات"
          description="نظّم المقاسات التي ستظهر عند إضافة المنتجات."
          actions={
            <AdminButton
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => setCreating(true)}
            >
              إضافة مقاس
            </AdminButton>
          }
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && list.length === 0 && !loadError ? <AdminLoadingState /> : null}

        <div
          className="admin-list-toolbar__row"
          style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12 }}
        >
          <label className="admin-list-toolbar__search" style={{ flex: "1 1 200px" }}>
            <span className="admin-field__label">بحث</span>
            <AdminInput
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم…"
            />
          </label>
          <label style={{ minWidth: 160 }}>
            <span className="admin-field__label">النوع</span>
            <AdminLuxurySelect
              id="sizes-type-filter"
              value={typeFilter}
              options={TYPE_FILTER_OPTIONS}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </label>
        </div>

        <AdminModal open={creating} title="إضافة مقاس" onClose={() => setCreating(false)}>
          {creating ? (
            <SizeForm
              existing={list}
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
          title="تعديل مقاس"
          onClose={() => setEditing(null)}
        >
          {editing ? (
            <SizeForm
              initial={editing}
              onClose={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                await load();
              }}
            />
          ) : null}
        </AdminModal>

        {!loading && !loadError && list.length === 0 ? (
          <AdminEmptyState
            title="لا توجد مقاسات"
            description='اضغط "إضافة مقاس" أو حدّث الصفحة لتحميل المقاسات الافتراضية.'
          />
        ) : null}

        {!loadError && filtered.length > 0 ? (
          <AdminTable style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الترتيب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ opacity: s.archivedAt ? 0.55 : 1 }}>
                  <AdminTd label="الاسم" dir="ltr">
                    {s.label}
                  </AdminTd>
                  <AdminTd label="النوع">{SIZE_TYPE_LABELS[s.type]}</AdminTd>
                  <AdminTd label="الترتيب">
                    {sortOrderToAdminDisplay(s.sortOrder)}
                  </AdminTd>
                  <AdminTd label="الحالة">
                    {s.archivedAt ? "مؤرشف" : "نشط"}
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <AdminRowActions
                      archived={Boolean(s.archivedAt)}
                      onEdit={
                        s.archivedAt
                          ? undefined
                          : () => setEditing(s)
                      }
                      onArchive={s.archivedAt ? undefined : () => void archiveSize(s)}
                      onRestore={s.archivedAt ? () => void restoreSize(s) : undefined}
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
