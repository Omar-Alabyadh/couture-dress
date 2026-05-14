/**
 * Reads `{ error: string }` from JSON admin API responses when present.
 */
export async function readApiErrorMessage(res: Response): Promise<string | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  try {
    const j = (await res.clone().json()) as unknown;
    if (
      j &&
      typeof j === "object" &&
      "error" in j &&
      typeof (j as { error: unknown }).error === "string"
    ) {
      const t = (j as { error: string }).error.trim();
      return t.length > 0 ? t : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function fallbackErrorMessage(res: Response): string {
  if (res.status === 401) return "غير مصرّح — سجّلي الدخول من جديد.";
  if (res.status === 403) return "غير مسموح بهذا الإجراء.";
  if (res.status === 404) return "غير موجود.";
  if (res.status >= 500) return "خطأ في الخادم. حاولي لاحقًا.";
  return "تعذر إتمام الطلب.";
}
