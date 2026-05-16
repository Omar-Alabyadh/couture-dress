"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "هذا البريد غير مسموح بالدخول. تأكدي أن بريد Google مطابق لـ OWNER_EMAIL أو ENGINEER_EMAILS في إعدادات الخادم.",
  Configuration:
    "خطأ في إعداد المصادقة (مفتاح سري أو قاعدة البيانات). راجعي سجلات Vercel.",
};

export function LoginForm() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/admin";
  const authError = sp.get("error");
  const errorMessage =
    authError && AUTH_ERROR_MESSAGES[authError]
      ? AUTH_ERROR_MESSAGES[authError]
      : authError
        ? "تعذر تسجيل الدخول. حاولي مرة أخرى."
        : null;

  return (
    <div className="login-card" dir="rtl">
      <h1 style={{ margin: "0 0 0.3rem" }}>تسجيل الدخول</h1>
      <p className="admin-hint" style={{ marginTop: 0 }}>
        بريدٌ مسموحٌ فقط. يُفضّل الدخول باستخدام Google.
      </p>
      {errorMessage ? (
        <p className="login-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
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
