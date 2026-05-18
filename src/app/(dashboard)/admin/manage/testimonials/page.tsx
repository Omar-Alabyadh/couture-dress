"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import {
  normalizeSearch,
  paginateList,
  sortByDateString,
  type SortDirection,
} from "@/lib/admin/list-client";
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
  AdminTable,
  AdminTd,
  AdminTextarea,
} from "@/components/admin/AdminPrimitives";
import { MediaPickerButton } from "@/components/admin/media/MediaPicker";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { Plus } from "lucide-react";

type Testimonial = {
  id: string;
  customerName: string;
  text: string;
  rating: number;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
};

const PAGE_SIZE = 12;
const TESTIMONIAL_STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "published", label: "منشور" },
  { value: "draft", label: "مسودة" },
  { value: "archived", label: "مؤرشف" },
];

export default function AdminTestimonialsPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const [list, setList] = useState<Testimonial[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortDirection>("newest");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/admin/testimonials", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setLoadError(msg);
        setList([]);
      } else {
        const j = (await r.json()) as { data: Testimonial[] };
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

  async function restoreRow(t: Testimonial) {
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تم الاسترجاع.", "success");
    await load();
  }

  async function archiveRow(t: Testimonial) {
    const ok = await requestConfirm({
      title: "أرشفة الرأي",
      message: `هل تريد أرشفة رأي «${t.customerName}»؟`,
      confirmLabel: "أرشِف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
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
    await load();
  }

  async function togglePublished(t: Testimonial) {
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !t.isPublished }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast(t.isPublished ? "أُخفيت عن العامة." : "أُعلنت للعامة.", "success");
    await load();
  }

  async function patchSortOrder(t: Testimonial, raw: string) {
    const r = await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: Number(raw) }),
    });
    if (!r.ok) {
      const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
      pushToast(msg, "error");
      return;
    }
    pushToast("تم حفظ الترتيب.", "success");
    await load();
  }

  const filteredList = useMemo(() => {
    const q = normalizeSearch(search);
    let rows = [...list];
    if (q) {
      rows = rows.filter(
        (t) =>
          t.customerName.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q),
      );
    }
    if (statusFilter === "archived") {
      rows = rows.filter((t) => t.deletedAt);
    } else if (statusFilter === "published") {
      rows = rows.filter((t) => !t.deletedAt && t.isPublished);
    } else if (statusFilter === "draft") {
      rows = rows.filter((t) => !t.deletedAt && !t.isPublished);
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
          title="آراء العملاء"
          description="تظهر المنشورة فقط في الصفحة الرئيسية — مرتبة حسب الترتيب ثم التاريخ."
          actions={
            <AdminButton
              type="button"
              variant="primary"
              icon={Plus}
              onClick={() => setCreating(true)}
            >
              رأي جديد
            </AdminButton>
          }
        />

        {loadError ? (
          <AdminErrorState message={loadError} onRetry={() => void load()} />
        ) : null}

        {loading && list.length === 0 && !loadError ? (
          <AdminLoadingState />
        ) : null}

        <AdminModal open={creating} title="رأي عميل جديد" onClose={() => setCreating(false)}>
          {creating ? (
            <form
              className="admin-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await fetch("/api/admin/testimonials", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    customerName: customerName.trim(),
                    text: text.trim(),
                    rating: Number(rating),
                    imageUrl: imageUrl.trim() || null,
                    sortOrder: Number(sortOrder),
                  }),
                });
                if (!r.ok) {
                  const msg =
                    (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
                  pushToast(msg, "error");
                  return;
                }
                setCustomerName("");
                setText("");
                setRating("5");
                setImageUrl("");
                setSortOrder("0");
                pushToast("تمت الإضافة.", "success");
                setCreating(false);
                await load();
              }}
            >
          <AdminField label="اسم العميل" htmlFor="tm-name">
            <AdminInput
              id="tm-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </AdminField>
          <AdminField label="النص" htmlFor="tm-text">
            <AdminTextarea
              id="tm-text"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </AdminField>
          <AdminField label="التقييم (1–5)" htmlFor="tm-rating">
            <AdminInput
              id="tm-rating"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </AdminField>
          <AdminField label="رابط صورة (اختياري)" htmlFor="tm-img">
            <AdminInput
              id="tm-img"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              dir="ltr"
              placeholder="https://… أو /assets/…"
            />
          </AdminField>
          <MediaPickerButton
            label="اختر صورة من مكتبة الوسائط"
            defaultUsageType="TESTIMONIAL_AVATAR"
            defaultFolder="testimonials"
            onSelect={(asset) => setImageUrl(asset.url)}
          />
          <AdminField label="الترتيب" htmlFor="tm-sort">
            <AdminInput
              id="tm-sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </AdminField>
          <div className="admin-form__submit-row">
            <AdminButton type="submit" variant="primary">
              حفظ
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setCreating(false)}>
              إلغاء
            </AdminButton>
          </div>
            </form>
          ) : null}
        </AdminModal>

        {!loading && !loadError && list.filter((x) => !x.deletedAt).length === 0 ? (
          <AdminEmptyState
            title="لا توجد آراء بعد"
            description='اضغط "رأي جديد" لإضافة أول رأي.'
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
              searchPlaceholder="بحث بالاسم أو النص…"
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
              statusOptions={TESTIMONIAL_STATUS_OPTIONS}
            />
          <AdminTable style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>العميلة</th>
                <th>مقتطف</th>
                <th>تقييم</th>
                <th>ترتيب</th>
                <th>نشر</th>
                <th>—</th>
              </tr>
            </thead>
            <tbody>
              {paginated.items.map((t) => (
                <tr
                  key={t.id}
                  style={{ opacity: t.deletedAt ? 0.45 : 1 }}
                >
                  <AdminTd label="العميلة">{t.customerName}</AdminTd>
                  <AdminTd label="مقتطف" className="admin-table__cell--full" style={{ fontSize: 12 }}>
                    {t.text.length > 120 ? `${t.text.slice(0, 120)}…` : t.text}
                  </AdminTd>
                  <AdminTd label="تقييم">{t.rating}</AdminTd>
                  <AdminTd label="ترتيب">
                    {t.deletedAt ? (
                      t.sortOrder
                    ) : (
                      <AdminInput
                        type="number"
                        defaultValue={t.sortOrder}
                        key={`${t.id}-${t.sortOrder}`}
                        onBlur={(e) => {
                          if (e.target.value === String(t.sortOrder)) return;
                          void patchSortOrder(t, e.target.value);
                        }}
                        style={{ maxWidth: "100%" }}
                      />
                    )}
                  </AdminTd>
                  <AdminTd label="نشر">
                    {t.deletedAt ? (
                      "—"
                    ) : (
                      <AdminButton
                        type="button"
                        variant="ghost"
                        onClick={() => void togglePublished(t)}
                      >
                        {t.isPublished ? "إخفاء" : "نشر"}
                      </AdminButton>
                    )}
                  </AdminTd>
                  <AdminTd label="إجراءات" className="admin-table__cell--actions">
                    <AdminRowActions
                      archived={Boolean(t.deletedAt)}
                      onArchive={t.deletedAt ? undefined : () => void archiveRow(t)}
                      onRestore={t.deletedAt ? () => void restoreRow(t) : undefined}
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
