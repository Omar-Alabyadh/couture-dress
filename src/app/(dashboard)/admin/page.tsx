import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminOverviewDashboard } from "@/components/admin/AdminOverviewDashboard";

export default async function AdminDashboard() {
  const s = await auth();
  if (!s?.user) {
    redirect("/admin/login");
  }
  if (s.user.role === "ENGINEER") {
    redirect("/admin/audit");
  }
  return (
    <div className="admin-page admin-page--wide" dir="rtl">
      <h1 style={{ margin: "0 0 0.25rem" }}>مرحبًا {s.user.name ?? s.user.email}</h1>
      <p className="admin-hint" style={{ marginBottom: "1rem" }}>
        لوحة تحكم متجر كوتور — نظرة سريعة على المحتوى والاختصارات اليومية.
      </p>
      <AdminOverviewDashboard />
      <p className="admin-hint" style={{ marginTop: "1.25rem" }}>
        <a href="/" target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
          عرض الموقع للعامة
        </a>
        {" · "}
        <Link href="/admin/audit" style={{ fontWeight: 700 }}>
          سجل التدقيق
        </Link>
      </p>
    </div>
  );
}
