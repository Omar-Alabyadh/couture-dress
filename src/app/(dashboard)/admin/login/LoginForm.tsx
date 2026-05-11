"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/admin";
  return (
    <div className="login-card" dir="rtl">
      <h1 style={{ margin: "0 0 0.3rem" }}>تسجيل الدخول</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        بريدٌ مسموحٌ فقط. يُفضّل الدخول باستخدام Google.
      </p>
      <button
        type="button"
        className="login-btn"
        onClick={() => {
          void signIn("google", { callbackUrl });
        }}
      >
        الدخول عبر Google
      </button>
      <Link className="login-to-site" href="/">
        ← الموقع العام
      </Link>
    </div>
  );
}
