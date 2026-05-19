"use client";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { useCallback, useId, useRef, useState } from "react";
import type { MediaUsageType } from "@/generated/prisma/client";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminLuxurySelect,
} from "@/components/admin/AdminPrimitives";
import { readApiErrorMessage, fallbackErrorMessage } from "@/lib/admin/read-api-error";
import {
  ACCEPTED_UPLOAD_MIME,
  MEDIA_UPLOAD_USAGE_OPTIONS,
} from "@/lib/admin/media-ui";

type Props = {
  usageType: MediaUsageType;
  onUsageTypeChange: (v: MediaUsageType) => void;
  onUploaded: (count: number) => void | Promise<void>;
};

export function MediaUploadDropzone({
  usageType,
  onUsageTypeChange,
  onUploaded,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const uploadOne = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      form.set("usageType", usageType);
      const altTrim = alt.trim();
      if (altTrim) form.set("alt", altTrim);

      const r = await adminFetch("/api/admin/media", {
        method: "POST",
        body: form,
      });
      if (!r.ok) {
        const msg = (await readApiErrorMessage(r)) ?? fallbackErrorMessage(r);
        throw new Error(msg);
      }
    },
    [alt, usageType],
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.size > 0);
      if (list.length === 0) return;

      setInlineError(null);
      setUploading(true);
      try {
        for (let i = 0; i < list.length; i++) {
          const file = list[i]!;
          setProgress(
            list.length > 1
              ? `جارٍ رفع ${i + 1} من ${list.length}…`
              : "جارٍ الرفع…",
          );
          await uploadOne(file);
        }
        setAlt("");
        if (inputRef.current) inputRef.current.value = "";
        await onUploaded(list.length);
        return { ok: true as const, count: list.length };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "تعذر الرفع.";
        setInlineError(msg);
        return { ok: false as const };
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [onUploaded, uploadOne],
  );

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(files);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const files = e.dataTransfer.files;
    if (!files?.length) return;
    await processFiles(files);
  };

  return (
    <section
      className="admin-media-lib-upload"
      aria-labelledby="media-upload-heading"
    >
      <h2 id="media-upload-heading" className="admin-media-lib-upload__title">
        رفع صورة
      </h2>
      <div className="admin-media-panel__guidance">
        <strong>إرشادات الرفع</strong>
        <ul>
          <li>الصور تُحوّل تلقائيًا إلى WebP.</li>
          <li>الحد الأقصى 5MB.</li>
          <li>الصيغ المدعومة: JPG, PNG, WebP.</li>
          <li>SVG و GIF غير مدعومين حاليًا.</li>
        </ul>
      </div>

      <div
        className={`admin-media-lib-dropzone${dragOver ? " admin-media-lib-dropzone--over" : ""}${uploading ? " admin-media-lib-dropzone--busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="admin-media-lib-dropzone__input"
          type="file"
          accept={ACCEPTED_UPLOAD_MIME}
          multiple
          disabled={uploading}
          onChange={onInputChange}
        />
        <label htmlFor={inputId} className="admin-media-lib-dropzone__label">
          {uploading ? (progress ?? "جارٍ الرفع…") : "اسحب الصور هنا أو انقر للاختيار"}
        </label>
        <p className="admin-hint admin-media-lib-dropzone__hint">
          يمكن اختيار أكثر من ملف؛ يُرفع كل ملف على حدة.
        </p>
      </div>

      <div className="admin-media-lib-upload__fields">
        <AdminField label="نوع الاستخدام" htmlFor="media-upload-usage">
          <AdminLuxurySelect
            id="media-upload-usage"
            value={usageType}
            disabled={uploading}
            options={MEDIA_UPLOAD_USAGE_OPTIONS}
            onChange={(e) =>
              onUsageTypeChange(e.target.value as MediaUsageType)
            }
          />
        </AdminField>
        <AdminField label="النص البديل (alt)" htmlFor="media-upload-alt" hint="اختياري">
          <AdminInput
            id="media-upload-alt"
            value={alt}
            disabled={uploading}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="وصف مختصر للصورة"
          />
        </AdminField>
      </div>

      {inlineError ? (
        <p className="admin-media-panel__error" role="alert">
          {inlineError}
        </p>
      ) : null}

      {uploading && progress ? (
        <p className="admin-upload-progress" role="status" aria-live="polite">
          {progress}
        </p>
      ) : null}

      <AdminButton
        type="button"
        variant="secondary"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        اختيار ملف
      </AdminButton>
    </section>
  );
}
