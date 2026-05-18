"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { AdminButton, AdminInput, AdminSelect } from "@/components/admin/AdminPrimitives";
import type { SortDirection } from "@/lib/admin/list-client";

export type AdminListToolbarProps = {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  sort: SortDirection;
  onSortChange: (v: SortDirection) => void;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
  extra?: ReactNode;
};

export function AdminListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "بحث…",
  sort,
  onSortChange,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  extra,
}: AdminListToolbarProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="admin-list-toolbar" dir="rtl">
      <div className="admin-list-toolbar__row">
        <label className="admin-list-toolbar__search">
          <span className="admin-field__label">بحث</span>
          <span className="admin-input-with-icon">
            <Search className="admin-input-with-icon__icon" size={16} aria-hidden />
            <AdminInput
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
            />
          </span>
        </label>
        <label className="admin-list-toolbar__sort">
          <span className="admin-field__label">ترتيب</span>
          <AdminSelect
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortDirection)}
          >
            <option value="newest">الأحدث أولًا</option>
            <option value="oldest">الأقدم أولًا</option>
          </AdminSelect>
        </label>
        {statusOptions && onStatusFilterChange ? (
          <label className="admin-list-toolbar__sort">
            <span className="admin-field__label">الحالة</span>
            <AdminSelect
              value={statusFilter ?? "all"}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </AdminSelect>
          </label>
        ) : null}
        {extra}
      </div>
      <div className="admin-list-toolbar__pager">
        <span className="admin-hint">
          {total === 0 ? "لا توجد نتائج" : `عرض ${from}–${to} من ${total}`}
        </span>
        <div className="admin-list-toolbar__pager-btns">
          <AdminButton
            type="button"
            variant="ghost"
            icon={ChevronRight}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            السابق
          </AdminButton>
          <span className="admin-hint" aria-live="polite">
            {page} / {totalPages}
          </span>
          <AdminButton
            type="button"
            variant="ghost"
            icon={ChevronLeft}
            iconPosition="end"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            التالي
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
