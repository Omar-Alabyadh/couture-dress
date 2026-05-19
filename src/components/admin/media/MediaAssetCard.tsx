"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { useState } from "react";
import type { MediaAssetDto } from "@/lib/media/types";
import {
  copyTextToClipboard,
  formatMediaBytes,
  formatMediaDate,
  formatMediaDimensions,
  usageTypeLabel,
} from "@/lib/admin/media-ui";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import { AdminButton, AdminField, AdminInput } from "@/components/admin/AdminPrimitives";

type Props = {
  asset: MediaAssetDto;
  onUpdated: () => void | Promise<void>;
  onToast: (message: string, kind: "success" | "error") => void;
  onConfirmArchive: (asset: MediaAssetDto) => Promise<boolean>;
};

export function MediaAssetCard({
  asset,
  onUpdated,
  onToast,
  onConfirmArchive,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState(asset.alt ?? "");
  const [savingAlt, setSavingAlt] = useState(false);
  const [acting, setActing] = useState(false);

  const altText = asset.alt?.trim() || asset.filename;

  async function saveAlt() {
    setSavingAlt(true);
    try {
      const r = await adminFetch(`/api/admin/media/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: altDraft.trim() || null }),
      });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        onToast(msg, "error");
        return;
      }
      onToast("تم تحديث النص البديل.", "success");
      setEditingAlt(false);
      await onUpdated();
    } finally {
      setSavingAlt(false);
    }
  }

  async function copyUrl() {
    const ok = await copyTextToClipboard(asset.url);
    onToast(
      ok ? "تم نسخ الرابط." : "تعذر النسخ — انسخي الرابط يدويًا من تبويب جديد.",
      ok ? "success" : "error",
    );
  }

  async function archive() {
    const ok = await onConfirmArchive(asset);
    if (!ok) return;
    setActing(true);
    try {
      const r = await adminFetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        onToast(msg, "error");
        return;
      }
      onToast("تمت الأرشفة.", "success");
      await onUpdated();
    } finally {
      setActing(false);
    }
  }

  async function restore() {
    setActing(true);
    try {
      const r = await adminFetch(`/api/admin/media/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        onToast(msg, "error");
        return;
      }
      onToast("تمت الاستعادة.", "success");
      await onUpdated();
    } finally {
      setActing(false);
    }
  }

  return (
    <article
      className={`admin-media-card admin-media-lib-card${asset.isArchived ? " admin-media-lib-card--archived" : ""}`}
    >
      {asset.isArchived ? (
        <span className="admin-media-card__badge">مؤرشف</span>
      ) : null}
      <div
        className={`admin-media-card__preview admin-media-lib-card__preview${imgFailed ? " admin-media-card__preview--broken" : ""}`}
      >
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin library preview
          <img
            src={asset.url}
            alt={altText}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="admin-media-card__preview-error">تعذر تحميل المعاينة</span>
        )}
      </div>

      <div className="admin-media-lib-card__meta">
        <p className="admin-media-lib-card__filename" title={asset.originalFilename}>
          {asset.originalFilename}
        </p>
        <dl className="admin-media-lib-card__facts">
          <div>
            <dt>الأبعاد</dt>
            <dd>{formatMediaDimensions(asset)}</dd>
          </div>
          <div>
            <dt>الحجم</dt>
            <dd>{formatMediaBytes(asset.sizeBytes)}</dd>
          </div>
          <div>
            <dt>النوع</dt>
            <dd>{usageTypeLabel(asset.usageType)}</dd>
          </div>
          <div>
            <dt>المجلد</dt>
            <dd>{asset.folder}</dd>
          </div>
          <div>
            <dt>تاريخ الرفع</dt>
            <dd>{formatMediaDate(asset.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {editingAlt ? (
        <div className="admin-media-lib-card__alt-edit">
          <AdminField label="النص البديل (alt)" htmlFor={`alt-${asset.id}`}>
            <AdminInput
              id={`alt-${asset.id}`}
              value={altDraft}
              disabled={savingAlt}
              onChange={(e) => setAltDraft(e.target.value)}
            />
          </AdminField>
          <div className="admin-media-lib-card__alt-actions">
            <AdminButton
              type="button"
              variant="primary"
              disabled={savingAlt}
              onClick={() => void saveAlt()}
            >
              حفظ
            </AdminButton>
            <AdminButton
              type="button"
              variant="ghost"
              disabled={savingAlt}
              onClick={() => {
                setAltDraft(asset.alt ?? "");
                setEditingAlt(false);
              }}
            >
              إلغاء
            </AdminButton>
          </div>
        </div>
      ) : (
        <p className="admin-media-lib-card__alt-display admin-hint">
          <strong>alt:</strong> {asset.alt?.trim() || "—"}
        </p>
      )}

      <div className="admin-media-card__toolbar admin-media-lib-card__actions">
        <AdminButton type="button" variant="secondary" onClick={() => void copyUrl()}>
          نسخ الرابط
        </AdminButton>
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => window.open(asset.url, "_blank", "noopener,noreferrer")}
        >
          فتح
        </AdminButton>
        {!editingAlt ? (
          <AdminButton
            type="button"
            variant="ghost"
            onClick={() => {
              setAltDraft(asset.alt ?? "");
              setEditingAlt(true);
            }}
          >
            تعديل alt
          </AdminButton>
        ) : null}
        {asset.isArchived ? (
          <AdminButton
            type="button"
            variant="primary"
            disabled={acting}
            onClick={() => void restore()}
          >
            استعادة
          </AdminButton>
        ) : (
          <AdminButton
            type="button"
            variant="danger"
            disabled={acting}
            onClick={() => void archive()}
          >
            أرشفة
          </AdminButton>
        )}
      </div>
    </article>
  );
}
