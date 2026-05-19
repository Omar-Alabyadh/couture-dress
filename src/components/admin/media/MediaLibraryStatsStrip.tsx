"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { useCallback, useEffect, useState } from "react";
import { runAfterEffectFlush } from "@/lib/react/effect-schedule";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { formatMediaBytes, formatMediaDate } from "@/lib/admin/media-ui";
import type { MediaAssetDto } from "@/lib/media/types";

type MediaStats = {
  activeCount: number;
  archivedCount: number;
  totalSizeBytesActive: number;
  latestUploads: MediaAssetDto[];
};

type Props = {
  refreshKey?: number;
};

export function MediaLibraryStatsStrip({ refreshKey = 0 }: Props) {
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await adminFetch("/api/admin/media/stats", { cache: "no-store" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        setError(msg);
        setStats(null);
        return;
      }
      const j = (await r.json()) as { data: MediaStats };
      setStats(j.data);
    } catch {
      setError("تعذر تحميل الإحصائيات.");
      setStats(null);
    }
  }, []);

  useEffect(() => {
    return runAfterEffectFlush(() => {
      void load();
    });
  }, [load, refreshKey]);

  if (error) {
    return (
      <p className="admin-media-stats admin-media-stats--error" role="status">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="admin-media-stats admin-hint" role="status">
        جارٍ تحميل الإحصائيات…
      </p>
    );
  }

  const latest = stats.latestUploads[0];

  return (
    <div className="admin-media-stats" role="status" aria-label="إحصائيات الوسائط">
      <span className="admin-media-stats__item">
        <strong>{stats.activeCount}</strong> نشطة
      </span>
      <span className="admin-media-stats__item">
        <strong>{stats.archivedCount}</strong> مؤرشفة
      </span>
      <span className="admin-media-stats__item">
        الحجم: <strong>{formatMediaBytes(stats.totalSizeBytesActive)}</strong>
      </span>
      <span className="admin-media-stats__item admin-media-stats__item--latest">
        آخر رفع:{" "}
        {latest ? (
          <strong title={latest.originalFilename}>
            {formatMediaDate(latest.createdAt)}
          </strong>
        ) : (
          <strong>—</strong>
        )}
      </span>
    </div>
  );
}
