import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-card" dir="rtl">
          <p className="admin-hint">جارٍ التحميل…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
