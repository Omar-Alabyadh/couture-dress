"use client";

import { Archive, Pencil, RotateCcw } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminPrimitives";

export function AdminRowActions({
  archived,
  onEdit,
  onArchive,
  onRestore,
  editLabel = "تعديل",
  archiveLabel = "أرشفة",
  restoreLabel = "استرجاع",
}: {
  archived: boolean;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  editLabel?: string;
  archiveLabel?: string;
  restoreLabel?: string;
}) {
  if (archived) {
    return (
      <div className="admin-table__actions">
        <AdminButton
          type="button"
          variant="secondary"
          icon={RotateCcw}
          onClick={onRestore}
        >
          {restoreLabel}
        </AdminButton>
      </div>
    );
  }

  return (
    <div className="admin-table__actions">
      {onEdit ? (
        <AdminButton type="button" variant="ghost" icon={Pencil} onClick={onEdit}>
          {editLabel}
        </AdminButton>
      ) : null}
      {onArchive ? (
        <AdminButton type="button" variant="ghost" icon={Archive} onClick={onArchive}>
          {archiveLabel}
        </AdminButton>
      ) : null}
    </div>
  );
}
