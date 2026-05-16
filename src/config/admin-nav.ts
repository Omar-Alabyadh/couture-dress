export type AdminNavItem = {
  href: string;
  label: string;
  ownerOnly: boolean;
};

/** Single source of truth for dashboard navigation (Arabic labels until i18n phase). */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "نظرة عامة", ownerOnly: false },
  { href: "/admin/manage/products", label: "المنتجات", ownerOnly: true },
  { href: "/admin/manage/colors", label: "الألوان", ownerOnly: true },
  { href: "/admin/manage/landing", label: "الصفحة الرئيسية", ownerOnly: true },
  { href: "/admin/manage/testimonials", label: "آراء العملاء", ownerOnly: true },
  { href: "/admin/manage/brands", label: "ماركات ومصممين", ownerOnly: true },
  { href: "/admin/manage/media", label: "مكتبة الوسائط", ownerOnly: true },
  { href: "/admin/manage/trash", label: "الأرشيف (محذوف)", ownerOnly: true },
  { href: "/admin/audit", label: "سجل التدقيق", ownerOnly: false },
];

/**
 * `/admin` matches exactly only. Manage routes stay active for nested paths.
 */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
