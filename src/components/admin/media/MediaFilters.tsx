"use client";

import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminLuxurySelect,
} from "@/components/admin/AdminPrimitives";
import type { MediaUIFilters } from "@/lib/admin/media-ui";
import type { SortDirection } from "@/lib/admin/list-client";
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
  sort: SortDirection;
  onSortChange: (v: SortDirection) => void;
  disabled?: boolean;
};

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث أولًا" },
  { value: "oldest", label: "الأقدم أولًا" },
];

export function MediaFilters({ filters, onChange, sort, onSortChange, disabled }: Props) {
  return (
    <div className="admin-media-lib-filters" role="search">
      <AdminField label="نوع الاستخدام" htmlFor="media-filter-usage">
        <AdminLuxurySelect
          id="media-filter-usage"
          value={filters.usageType}
          disabled={disabled}
          options={MEDIA_USAGE_OPTIONS}
          onChange={(e) =>
            onChange({
              ...filters,
              usageType: e.target.value as MediaUsageType | "",
            })
          }
        />
      </AdminField>

      <AdminField label="المجلد" htmlFor="media-filter-folder">
        <AdminLuxurySelect
          id="media-filter-folder"
          value={filters.folder}
          disabled={disabled}
          options={MEDIA_FOLDER_OPTIONS}
          onChange={(e) =>
            onChange({ ...filters, folder: e.target.value })
          }
        />
      </AdminField>

      <AdminField label="الحالة" htmlFor="media-filter-archived">
        <AdminLuxurySelect
          id="media-filter-archived"
          value={filters.archived}
          disabled={disabled}
          options={MEDIA_ARCHIVED_OPTIONS}
          onChange={(e) =>
            onChange({
              ...filters,
              archived: e.target.value as MediaUIFilters["archived"],
            })
          }
        />
      </AdminField>

      <AdminField label="ترتيب" htmlFor="media-filter-sort">
        <AdminLuxurySelect
          id="media-filter-sort"
          value={sort}
          disabled={disabled}
          options={SORT_OPTIONS}
          onChange={(e) => onSortChange(e.target.value as SortDirection)}
        />
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
