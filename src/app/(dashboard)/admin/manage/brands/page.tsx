"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import {
  normalizeSearch,
  paginateList,
  sortByDateString,
  type SortDirection,
} from "@/lib/admin/list-client";
import {
  nextSortOrderForAdminDisplay,
  sortOrderFromAdminDisplay,
  sortOrderToAdminDisplay,
  sortOrderToAdminDisplayString,
} from "@/lib/admin/sort-order";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { useAdminConfirm } from "@/components/admin/AdminConfirmProvider";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminInput,
  AdminLoadingState,
  AdminSectionHeader,
  AdminCheckbox,
  AdminLuxurySelect,
  AdminTable,
  AdminTd,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";
import { MediaPickerButton } from "@/components/admin/media/MediaPicker";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { Plus } from "lucide-react";

const BRAND_TYPE_OPTIONS = [
  { value: "BRAND", label: "ماركة" },
  { value: "DESIGNER", label: "مصمم" },
];

type Brand = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  type: "BRAND" | "DESIGNER";
  logoUrl: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  isPublished: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
};

const PAGE_SIZE = 12;
const BRAND_STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "published", label: "منشور" },
  { value: "draft", label: "مسودة" },
];

function typeLabel(t: Brand["type"]) {
  return t === "BRAND" ? "ماركة" : "مصمم";
}

function BrandLogoThumb({ url }: { url: string | null }) {
  const u = url?.trim();
  const [failed, setFailed] = useState(false);
  if (!u || failed) {
    return <div className="admin-table-thumb admin-table-thumb--empty">—</div>;
  }
  return (
    <div className="admin-table-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin list */}
      <img src={u} alt="" loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

function BrandEditPanel({
  initial,
  onClose,
  onSaved,
}: {
  initial: Brand;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { pushToast } = useAdminToast();
  const [nameAr, setNameAr] = useState(initial.nameAr);
  const [nameEn, setNameEn] = useState(initial.nameEn ?? "");
  const [type, setType] = useState<Brand["type"]>(initial.type);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial.descriptionEn ?? "");
  const [sortOrder, setSortOrder] = useState(
    sortOrderToAdminDisplayString(initial.sortOrder),
  );
  const [isPublished, setIsPublished] = useState(initial.isPublished);
  const [loading, setLoading] = useState(false);

  return (
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const r = await adminFetch(`/api/admin/brands/${initial.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nameAr: nameAr.trim(),
                nameEn: nameEn.trim() || null,
                type,
                logoUrl: logoUrl.trim() || null,
                descriptionAr: descriptionAr.trim() || null,
                descriptionEn: descriptionEn.trim() || null,
                sortOrder: sortOrderFromAdminDisplay(sortOrder),
                isPublished,
              }),
            });
            if (!r.ok) {
              const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
              pushToast(msg, "error");
              return;
            }
            pushToast("تم الحفظ.", "success");
            await onSaved();
          } finally {
            setLoading(false);
          }
        }}
      >
        <AdminField label="الاسم (عربي)">
          <AdminInput
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
        </AdminField>
        <AdminField label="الاسم (EN) اختياري">
          <AdminInput
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            dir="ltr"
          />
        </AdminField>
        <AdminField label="النوع" htmlFor="brand-edit-type">
          <AdminLuxurySelect
            id="brand-edit-type"
            value={type}
            options={BRAND_TYPE_OPTIONS}
            onChange={(e) => setType(e.target.value as Brand["type"])}
          />
        </AdminField>
        <AdminField label="رابط الشعار (اختياري)">
          <AdminInput
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            dir="ltr"
            placeholder="https://… أو /assets/…"
          />
        </AdminField>
        <MediaPickerButton
          label="اختر شعار من مكتبة الوسائط"
          defaultUsageType="BRAND_LOGO"
          defaultFolder="brands"
          onSelect={(asset) => setLogoUrl(asset.url)}
        />
        <AdminField label="وصف عربي (اختياري)">
          <AdminTextarea
            rows={2}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </AdminField>
        <AdminField label="وصف EN (اختياري)">
          <AdminTextarea
            rows={2}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            dir="ltr"
          />
        </AdminField>
        <AdminField
          label="الترتيب"
          hint="1 = أول ظهور في الموقع، 2 = الثاني، وهكذا."
        >
          <AdminInput
            type="number"
            min={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            dir="ltr"
          />
        </AdminField>
        <AdminCheckbox
          id="brand-edit-published"
          label="منشور للعامة"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <AdminButton type="submit" variant="primary" disabled={loading}>
            حفظ
          </AdminButton>
          <AdminButton type="button" variant="ghost" onClick={onClose}>
            إلغاء
          </AdminButton>
        </div>
      </form>
  );
}

function BrandCreateForm({
  nameAr,
  setNameAr,
  nameEn,
  setNameEn,
  type,
  setType,
  logoUrl,
  setLogoUrl,
  descriptionAr,
  setDescriptionAr,
  sortOrder,
  setSortOrder,
  loading,
  onSubmit,
  onClose,
}: {
  nameAr: string;
  setNameAr: (v: string) => void;
  nameEn: string;
  setNameEn: (v: string) => void;
  type: Brand["type"];
  setType: (v: Brand["type"]) => void;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  descriptionAr: string;
  setDescriptionAr: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <AdminField label="الاسم (عربي)">
        <AdminInput value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
      </AdminField>
      <AdminField label="الاسم (EN) اختياري">
        <AdminInput value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
      </AdminField>
      <AdminField label="النوع" htmlFor="brand-create-type">
        <AdminLuxurySelect
          id="brand-create-type"
          value={type}
          options={BRAND_TYPE_OPTIONS}
          onChange={(e) => setType(e.target.value as Brand["type"])}
        />
      </AdminField>
      <AdminField label="رابط الشعار (اختياري)">
        <AdminInput value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} dir="ltr" />
      </AdminField>
      <MediaPickerButton
        label="اختر شعار من مكتبة الوسائط"
        defaultUsageType="BRAND_LOGO"
        defaultFolder="brands"
        onSelect={(asset) => setLogoUrl(asset.url)}
      />
      <AdminField label="وصف عربي (اختياري)">
        <AdminTextarea rows={2} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} />
      </AdminField>
      <AdminField
        label="الترتيب"
        hint="يُقترح تلقائيًا عند الإضافة — 1 يظهر أولًا في الموقع."
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

export default function AdminBrandsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Brand[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [type, setType] = useState<Brand["type"]>("BRAND");
  const [logoUrl, setLogoUrl] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const activeBrands = useMemo(
    () => list.filter((b) => !b.deletedAt),
    [list],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortDirection>("newest");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await adminFetch("/api/admin/brands", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Brand[] };
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

  async function archiveRow(b: Brand) {
    const ok = await requestConfirm({
      title: "أرشفة السجل",
      message: `هل تريد أرشفة «${b.nameAr}»؟ لن يظهر في الواجهة العامة.`,
      confirmLabel: "أرشِف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/brands/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ softDelete: true }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تمت الأرشفة.", "success");
    setEditing((e) => (e?.id === b.id ? null : e));
    await load();
  }

  async function togglePublished(b: Brand) {
    const r = await adminFetch(`/api/admin/brands/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !b.isPublished }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast(b.isPublished ? "أُخفيت عن العامة." : "أُعلنت للعامة.", "success");
    await load();
  }

  const filteredList = useMemo(() => {
    const q = normalizeSearch(search);
    let rows = [...list];
    if (q) {
      rows = rows.filter(
        (b) =>
          b.nameAr.toLowerCase().includes(q) ||
          (b.nameEn?.toLowerCase().includes(q) ?? false) ||
          (b.descriptionAr?.toLowerCase().includes(q) ?? false),
      );
    }
    rows = rows.filter((b) => !b.deletedAt);
    if (statusFilter === "published") {
      rows = rows.filter((b) => b.isPublished);
    } else if (statusFilter === "draft") {
      rows = rows.filter((b) => !b.isPublished);
    }
    return sortByDateString(rows, sort);
  }, [list, search, statusFilter, sort]);

  const paginated = useMemo(
    () => paginateList(filteredList, page, PAGE_SIZE),
    [filteredList, page],
  );

  return (
    <div className="admin-page admin-page--wide" dir="rtl">
      <AdminCard>
        <AdminSectionHeader
          title="ماركات ومصممون"
          description="يُربَط اختياريًا بالمنتجات. المؤرشف يُسترجع من الأرشيف الموحّد."
          actions={
            <AdminButton
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSortOrder(String(nextSortOrderForAdminDisplay(activeBrands)));
                setCreating(true);
                setEditing(null);
              }}
            >
              إضافة جديد
            </AdminButton>
          }
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && list.length === 0 && !loadError ? (
          <AdminLoadingState />
        ) : null}

        <AdminModal
          open={creating}
          title="ماركة / مصمم جديد"
          onClose={() => setCreating(false)}
        >
          {creating ? (
            <BrandCreateForm
              nameAr={nameAr}
              setNameAr={setNameAr}
              nameEn={nameEn}
              setNameEn={setNameEn}
              type={type}
              setType={setType}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              descriptionAr={descriptionAr}
              setDescriptionAr={setDescriptionAr}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              loading={createLoading}
              onClose={() => setCreating(false)}
              onSubmit={async (e) => {
                e.preventDefault();
                setCreateLoading(true);
                try {
                  const r = await adminFetch("/api/admin/brands", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      nameAr: nameAr.trim(),
                      nameEn: nameEn.trim() || null,
                      type,
                      logoUrl: logoUrl.trim() || null,
                      descriptionAr: descriptionAr.trim() || null,
                      sortOrder: sortOrderFromAdminDisplay(sortOrder),
                    }),
                  });
                  if (!r.ok) {
                    pushToast(
                      (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r),
                      "error",
                    );
                    return;
                  }
                  setNameAr("");
                  setNameEn("");
                  setType("BRAND");
                  setLogoUrl("");
                  setDescriptionAr("");
                  pushToast("تمت الإضافة.", "success");
                  setCreating(false);
                  await load();
                } finally {
                  setCreateLoading(false);
                }
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
            <BrandEditPanel
              initial={editing}
              onClose={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                await load();
              }}
            />
          ) : null}
        </AdminModal>

        {!loading && !loadError && list.filter((x) => !x.deletedAt).length === 0 ? (
          <AdminEmptyState
            title="لا توجد سجلات بعد"
            description='اضغط "إضافة جديد" لإضافة أول ماركة أو مصمم.'
          />
        ) : null}

        {!loadError && list.length > 0 ? (
          <>
            <AdminListToolbar
              searchValue={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder="بحث بالاسم…"
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              page={paginated.page}
              totalPages={paginated.totalPages}
              total={paginated.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              statusFilter={statusFilter}
              onStatusFilterChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              statusOptions={BRAND_STATUS_OPTIONS}
            />
          <AdminTable style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th aria-label="شعار">شعار</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>ترتيب</th>
                <th>نشر</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paginated.items.map((b) => (
                <tr key={b.id}>
                  <AdminTd label="">
                    <BrandLogoThumb url={b.logoUrl} />
                  </AdminTd>
                  <AdminTd label="الاسم">{b.nameAr}</AdminTd>
                  <AdminTd label="النوع">{typeLabel(b.type)}</AdminTd>
                  <AdminTd label="ترتيب">
                    {sortOrderToAdminDisplay(b.sortOrder)}
                  </AdminTd>
                  <AdminTd label="نشر">
                    <AdminButton
                      type="button"
                      variant="ghost"
                      onClick={() => void togglePublished(b)}
                    >
                      {b.isPublished ? "إخفاء" : "نشر"}
                    </AdminButton>
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <AdminRowActions
                      archived={false}
                      onEdit={() => setEditing(b)}
                      onArchive={() => void archiveRow(b)}
                    />
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          </>
        ) : null}
      </AdminCard>
    </div>
  );
}
