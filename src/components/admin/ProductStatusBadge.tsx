import {
  PRODUCT_STATUS_LABELS,
  type ProductAdminStatus,
} from "@/lib/admin/product-status";

const STATUS_CLASS: Record<ProductAdminStatus, string> = {
  DRAFT: "admin-status-badge--draft",
  PUBLISHED: "admin-status-badge--published",
  OUT_OF_STOCK: "admin-status-badge--out",
  ARCHIVED: "admin-status-badge--archived",
};

export function ProductStatusBadge({ status }: { status: ProductAdminStatus }) {
  return (
    <span
      className={`admin-status-badge ${STATUS_CLASS[status]}`}
      title={PRODUCT_STATUS_LABELS[status]}
    >
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}
