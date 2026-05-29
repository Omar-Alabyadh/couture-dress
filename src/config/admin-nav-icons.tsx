import type { IconType } from "react-icons";
import {
  LuArchive,
  LuBadgePercent,
  LuFolderTree,
  LuHouse,
  LuImage,
  LuLayoutDashboard,
  LuPalette,
  LuRuler,
  LuScrollText,
  LuShirt,
  LuStar,
  LuTag,
} from "react-icons/lu";

const ICON_BY_HREF: Record<string, IconType> = {
  "/admin": LuLayoutDashboard,
  "/admin/manage/products": LuShirt,
  "/admin/discounts": LuBadgePercent,
  "/admin/manage/categories": LuFolderTree,
  "/admin/manage/colors": LuPalette,
  "/admin/manage/sizes": LuRuler,
  "/admin/manage/landing": LuHouse,
  "/admin/manage/testimonials": LuStar,
  "/admin/manage/brands": LuTag,
  "/admin/manage/media": LuImage,
  "/admin/manage/trash": LuArchive,
  "/admin/audit": LuScrollText,
};

export function AdminNavIcon({ href }: { href: string }) {
  const Icon = ICON_BY_HREF[href] ?? LuLayoutDashboard;
  return <Icon className="admin-sidebar__icon" aria-hidden />;
}
