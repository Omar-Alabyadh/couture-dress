import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const s = await auth();
  if (!s?.user) {
    redirect("/admin/login");
  }
  if (s.user.role === "ENGINEER") {
    redirect("/admin/audit");
  }
  return (
    <div style={{ maxWidth: 600 }} dir="rtl">
      <h1 style={{ margin: "0 0 0.4rem" }}>مرحبًا {s.user.name ?? s.user.email}</h1>
      <p className="admin-hint">
        هنا تتحكّمين بكل الموقع: المنتجات، الألوان، الصفحة الرئيسية، والسجل. الحذف
        يكون ناعمًا (يُرجَع لاحقًا من الأرشيف).
      </p>
      <ul style={{ margin: "1rem 0 0 1.2rem", lineHeight: 1.7 }}>
        <li>
          <Link href="/admin/manage/products" style={{ fontWeight: 800, color: "#b9856f" }}>
            إدارة المنتجات
          </Link>
        </li>
        <li>
          <Link href="/admin/manage/colors" style={{ fontWeight: 800, color: "#b9856f" }}>
            ألوان الفلتر
          </Link>
        </li>
        <li>
          <Link href="/admin/manage/landing" style={{ fontWeight: 800, color: "#b9856f" }}>
            محرّر الصفحة الرئيسية
          </Link>
        </li>
        <li>
          <Link href="/admin/manage/trash" style={{ fontWeight: 800, color: "#b9856f" }}>
            المنتجات المؤرشفة
          </Link>
        </li>
        <li>
          <Link href="/admin/audit" style={{ fontWeight: 800, color: "#b9856f" }}>
            سجل التدقيق
          </Link>{" "}
          (أنت + مهندس المشروع)
        </li>
        <li>
          <a href="/" target="_blank" rel="noreferrer" style={{ fontWeight: 800 }}>
            عرض الموقع
          </a>
        </li>
      </ul>
    </div>
  );
}
