"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MediaUsageType } from "@/generated/prisma/client";
import { useAdminConfirm } from "@/components/admin/AdminConfirmProvider";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { AdminCard, AdminSectionHeader } from "@/components/admin/AdminPrimitives";
import { MediaFilters } from "@/components/admin/media/MediaFilters";
import { MediaGrid } from "@/components/admin/media/MediaGrid";
import { MediaLibraryStatsStrip } from "@/components/admin/media/MediaLibraryStatsStrip";
import { MediaUploadDropzone } from "@/components/admin/media/MediaUploadDropzone";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import {
  DEFAULT_MEDIA_UI_FILTERS,
  buildMediaListQuery,
  type MediaUIFilters,
} from "@/lib/admin/media-ui";
import type { MediaAssetDto, MediaListResult } from "@/lib/media/types";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";

const SEARCH_DEBOUNCE_MS = 350;

export default function AdminMediaLibraryPage() {
  const { pushToast } = useAdminToast();
  const { requestConfirm } = useAdminConfirm();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<MediaUIFilters>(() => {
    if (searchParams.get("archived") === "true") {
      return { ...DEFAULT_MEDIA_UI_FILTERS, archived: "true" };
    }
    return DEFAULT_MEDIA_UI_FILTERS;
  });
  const [debouncedFilters, setDebouncedFilters] =
    useState<MediaUIFilters>(DEFAULT_MEDIA_UI_FILTERS);
  const [uploadUsageType, setUploadUsageType] =
    useState<MediaUsageType>("GENERAL");

  const [items, setItems] = useState<MediaAssetDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters]);

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadError(null);
      }
      try {
        const url = buildMediaListQuery(debouncedFilters, cursor ?? undefined);
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) {
          const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
          setLoadError(msg);
          if (!append) setItems([]);
          setNextCursor(null);
          return;
        }
        const j = (await r.json()) as MediaListResult;
        setItems((prev) => (append ? [...prev, ...j.data] : j.data));
        setNextCursor(j.nextCursor);
        setLoadError(null);
      } catch {
        setLoadError("تعذر الاتصال بالخادم.");
        if (!append) {
          setItems([]);
          setNextCursor(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedFilters],
  );

  const refreshList = useCallback(async () => {
    await fetchPage(null, false);
  }, [fetchPage]);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void fetchPage(null, false);
    });
  }, [fetchPage]);

  const handleConfirmArchive = useCallback(
    async (asset: MediaAssetDto) => {
      let message = `هل تريدين أرشفة «${asset.originalFilename}»؟ لن يُحذف من التخزين في هذه المرحلة.`;
      try {
        const r = await fetch(`/api/admin/media/${asset.id}/usage`, {
          cache: "no-store",
        });
        if (r.ok) {
          const j = (await r.json()) as {
            data: { totalReferences: number };
          };
          const n = j.data.totalReferences;
          if (n > 0) {
            message = `هذه الصورة مستخدمة في ${n} موضع. أرشفتها قد تكسر الصور في الموقع.\n\nهل تريدين المتابعة؟`;
          } else {
            message = `هذه الصورة غير مستخدمة حاليًا.\n\nهل تريدين أرشفتها؟`;
          }
        }
      } catch {
        /* keep default message */
      }
      return requestConfirm({
        title: "أرشفة الوسيط",
        message,
        confirmLabel: "أرشِفي",
        cancelLabel: "إلغاء",
        destructive: true,
      });
    },
    [requestConfirm],
  );

  const bumpStats = useCallback(() => {
    setStatsRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="admin-page" dir="rtl">
      <AdminSectionHeader
        title="مكتبة الوسائط"
        description="رفع وإدارة الصور المخزّنة في Supabase — للاستخدام لاحقًا في المنتجات والماركات وغيرها."
      />

      <AdminCard className="admin-media-lib-layout">
        <MediaUploadDropzone
          usageType={uploadUsageType}
          onUsageTypeChange={setUploadUsageType}
          onUploaded={async (count) => {
            pushToast(
              count > 1 ? `تم رفع ${count} صور بنجاح.` : "تم رفع الصورة بنجاح.",
              "success",
            );
            await refreshList();
            bumpStats();
          }}
        />
      </AdminCard>

      <AdminCard className="admin-media-lib-layout">
        <h2 className="admin-media-lib-section-title">تصفية وعرض</h2>
        <MediaLibraryStatsStrip refreshKey={statsRefreshKey} />
        <MediaFilters
          filters={filters}
          disabled={loading && items.length === 0}
          onChange={setFilters}
        />
        <MediaGrid
          items={items}
          loading={loading}
          loadingMore={loadingMore}
          error={loadError}
          nextCursor={nextCursor}
          onRetry={() => void refreshList()}
          onLoadMore={() => {
            if (nextCursor) void fetchPage(nextCursor, true);
          }}
          onUpdated={async () => {
            await refreshList();
            bumpStats();
          }}
          onToast={(message, kind) => pushToast(message, kind)}
          onConfirmArchive={handleConfirmArchive}
        />
      </AdminCard>
    </div>
  );
}
