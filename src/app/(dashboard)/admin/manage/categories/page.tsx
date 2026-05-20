"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { normalizeSearch } from "@/lib/admin/list-client";
import {
  nextSortOrder,
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
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";

type Category = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
  deletedAt: string | null;
};

function CategoryForm({
  initial,
  defaultSortOrder = 0,
  onClose,
  onSaved,
}: {
  initial?: Category;
  /** Used when creating — next internal slot (0-based); shown as +1 in the form */
  defaultSortOrder?: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [sortOrder, setSortOrder] = useState(() =>
    sortOrderToAdminDisplayString(
      initial?.sortOrder ?? defaultSortOrder ?? 0,
    ),
  );
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const body = {
            nameAr: nameAr.trim(),
            slug: slug.trim() || undefined,
            descriptionAr: descriptionAr.trim() || null,
            sortOrder: sortOrderFromAdminDisplay(sortOrder),
          };
          const r = initial
            ? await adminFetch(`/api/admin/categories/${initial.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              })
            : await adminFetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
          if (!r.ok) {
            pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
            return;
          }
          pushToast(initial ? "تم تحديث القسم." : "تمت إضافة القسم.", "success");
          await onSaved();
        } finally {
          setLoading(false);
        }
      }}
    >
      <AdminField label="اسم القسم (عربي)">
        <AdminInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
      </AdminField>
      <AdminField label="المعرّف (إنجليزي — اختياري)" hint="مثال: dresses">
        <AdminInput
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          dir="ltr"
          placeholder="dresses"
        />
      </AdminField>
      <AdminField label="وصف قصير (اختياري)">
        <AdminTextarea
          rows={2}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
        />
      </AdminField>
      <AdminField
        label="الترتيب"
        hint={
          initial
            ? "1 = أول قسم في الموقع، 2 = الثاني، وهكذا."
            : "يُقترح تلقائيًا كالتالي في القائمة (يمكنك تغييره)."
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
          {loading ? "جارٍ الحفظ…" : "حفظ"}
        </AdminButton>
        <AdminButton type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </AdminButton>
      </div>
    </form>
  );
}

export default function AdminCategoriesPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await adminFetch("/api/admin/categories", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
        return;
      }
      const j = (await r.json()) as { data: Category[] };
      setList(Array.isArray(j.data) ? j.data : []);
    } catch {
      setLoadError("تعذر تحميل الأقسام. تحقق من الاتصال وحاول مرة أخرى.");
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

  const activeCategories = useMemo(
    () => list.filter((c) => !c.deletedAt),
    [list],
  );

  const nextCategorySort = useMemo(
    () => nextSortOrder(activeCategories),
    [activeCategories],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    let rows = list.filter((c) => !c.deletedAt);
    if (q) {
      rows = rows.filter(
        (c) =>
          c.nameAr.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.descriptionAr?.toLowerCase().includes(q) ?? false),
      );
    }
    return rows;
  }, [list, search]);

  async function archiveRow(c: Category) {
    const ok = await requestConfirm({
      title: "أرشفة القسم",
      message: `هل تريد أرشفة قسم «${c.nameAr}»؟ المنتجات المرتبطة تبقى كما هي.`,
      confirmLabel: "أرشِف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      pushToast((await readApiErrorMessage(r)) ?? fallbackErrorMessage(r), "error");
      return;
    }
    pushToast("تمت أرشفة القسم.", "success");
    await load();
  }

  return (
    <div className="admin-page admin-page--catalog" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="أقسام المتجر"
          description="تظهر في الصفحة الرئيسية وفلتر المنتجات. المؤرشف يُسترجع من الأرشيف الموحّد."
          actions={
            <AdminButton
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setCreating(true);
                setEditing(null);
              }}
            >
              قسم جديد
            </AdminButton>
          }
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}
        {loading && list.length === 0 && !loadError ? <AdminLoadingState /> : null}

        <label className="admin-list-toolbar__search" style={{ display: "block", marginTop: 12 }}>
          <span className="admin-field__label">بحث</span>
          <AdminInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو المعرّف…"
          />
        </label>

        <AdminModal open={creating} title="قسم جديد" onClose={() => setCreating(false)}>
          {creating ? (
            <CategoryForm
              key={`create-category-${nextCategorySort}`}
              defaultSortOrder={nextCategorySort}
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
          title={editing ? `تعديل: ${editing.nameAr}` : "تعديل"}
          onClose={() => setEditing(null)}
        >
          {editing ? (
            <CategoryForm
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

        {!loading && !loadError && list.filter((c) => !c.deletedAt).length === 0 ? (
          <AdminEmptyState
            title="لا توجد أقسام بعد"
            description='اضغط "قسم جديد" لإضافة أول قسم.'
          />
        ) : null}

        {!loadError && filtered.length > 0 ? (
          <AdminTable style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>المعرّف</th>
                <th>الوصف</th>
                <th>ترتيب</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <AdminTd label="الاسم">{c.nameAr}</AdminTd>
                  <AdminTd label="المعرّف" dir="ltr">
                    {c.slug}
                  </AdminTd>
                  <AdminTd label="الوصف" className="admin-table__cell--full">
                    {c.descriptionAr?.trim() || "—"}
                  </AdminTd>
                  <AdminTd label="ترتيب">
                    {sortOrderToAdminDisplay(c.sortOrder)}
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <AdminRowActions
                      archived={false}
                      onEdit={() => {
                        setEditing(c);
                        setCreating(false);
                      }}
                      onArchive={() => void archiveRow(c)}
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
