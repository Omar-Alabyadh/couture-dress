"use client";

import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminPrimitives";
import type { MediaUIFilters } from "@/lib/admin/media-ui";
import {
  DEFAULT_MEDIA_UI_FILTERS,
  MEDIA_ARCHIVED_OPTIONS,
  MEDIA_FOLDER_OPTIONS,
  MEDIA_USAGE_OPTIONS,
} from "@/lib/admin/media-ui";
import type { MediaUsageType } from "@/generated/prisma/client";

type Props = {
  filters: MediaUIFilters;
  onChange: (next: MediaUIFilters) => void;
  disabled?: boolean;
};

export function MediaFilters({ filters, onChange, disabled }: Props) {
  return (
    <div className="admin-media-lib-filters" role="search">
      <AdminField label="نوع الاستخدام" htmlFor="media-filter-usage">
        <AdminSelect
          id="media-filter-usage"
          value={filters.usageType}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...filters,
              usageType: e.target.value as MediaUsageType | "",
            })
          }
        >
          {MEDIA_USAGE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </AdminSelect>
      </AdminField>

      <AdminField label="المجلد" htmlFor="media-filter-folder">
        <AdminSelect
          id="media-filter-folder"
          value={filters.folder}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...filters, folder: e.target.value })
          }
        >
          {MEDIA_FOLDER_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </AdminSelect>
      </AdminField>

      <AdminField label="الحالة" htmlFor="media-filter-archived">
        <AdminSelect
          id="media-filter-archived"
          value={filters.archived}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...filters,
              archived: e.target.value as MediaUIFilters["archived"],
            })
          }
        >
          {MEDIA_ARCHIVED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </AdminSelect>
      </AdminField>

      <AdminField label="بحث" htmlFor="media-filter-q" hint="اسم الملف أو النص البديل">
        <AdminInput
          id="media-filter-q"
          type="search"
          value={filters.q}
          disabled={disabled}
          placeholder="ابحثي…"
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
        />
      </AdminField>

      <div className="admin-media-lib-filters__actions">
        <AdminButton
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange({ ...DEFAULT_MEDIA_UI_FILTERS })}
        >
          إعادة التصفية
        </AdminButton>
      </div>
    </div>
  );
}
