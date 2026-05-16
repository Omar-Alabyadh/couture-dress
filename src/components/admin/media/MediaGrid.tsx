"use client";

import type { MediaAssetDto } from "@/lib/media/types";
import {
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from "@/components/admin/AdminPrimitives";
import { MediaAssetCard } from "./MediaAssetCard";

type Props = {
  items: MediaAssetDto[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  nextCursor: string | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onUpdated: () => void | Promise<void>;
  onToast: (message: string, kind: "success" | "error") => void;
  onConfirmArchive: (asset: MediaAssetDto) => Promise<boolean>;
};

export function MediaGrid({
  items,
  loading,
  loadingMore,
  error,
  nextCursor,
  onRetry,
  onLoadMore,
  onUpdated,
  onToast,
  onConfirmArchive,
}: Props) {
  if (loading && items.length === 0) {
    return <AdminLoadingState label="جارٍ تحميل الوسائط…" />;
  }

  if (error && items.length === 0) {
    return <AdminErrorState message={error} onRetry={onRetry} />;
  }

  if (!loading && items.length === 0) {
    return (
      <AdminEmptyState
        title="لا توجد وسائط"
        description="ارفعي صورة جديدة أو غيّري عوامل التصفية لعرض المزيد."
      />
    );
  }

  return (
    <section className="admin-media-lib-grid-section" aria-label="قائمة الوسائط">
      {error && items.length > 0 ? (
        <p className="admin-media-panel__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="admin-media-grid admin-media-lib-grid">
        {items.map((asset) => (
          <MediaAssetCard
            key={asset.id}
            asset={asset}
            onUpdated={onUpdated}
            onToast={onToast}
            onConfirmArchive={onConfirmArchive}
          />
        ))}
      </div>
      {loadingMore ? (
        <AdminLoadingState label="جارٍ تحميل المزيد…" />
      ) : null}
      {nextCursor ? (
        <div className="admin-media-lib-load-more">
          <AdminButton
            type="button"
            variant="secondary"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            تحميل المزيد
          </AdminButton>
        </div>
      ) : null}
    </section>
  );
}
