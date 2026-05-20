"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AdminPortal } from "@/components/admin/AdminPortal";

export type AdminToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: AdminToastVariant;
};

type ToastContextValue = {
  pushToast: (message: string, variant?: AdminToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION: Record<AdminToastVariant, number> = {
  success: 4800,
  error: 9000,
  info: 5600,
};

function newId() {
  return `toast-${Math.random().toString(36).slice(2, 11)}`;
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const regionId = useId();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, variant: AdminToastVariant = "info") => {
      const id = newId();
      const trimmed = message.trim();
      if (!trimmed) return;
      setItems((prev) => [...prev, { id, message: trimmed, variant }]);
      const ms = DURATION[variant];
      timers.current.set(
        id,
        setTimeout(() => {
          dismiss(id);
        }, ms),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AdminPortal>
        <div
          id={regionId}
          className="admin-toast-region"
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="true"
        >
          {items.map((t) => (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className={`admin-toast admin-toast--${t.variant}`}
              tabIndex={0}
            >
              <span className="admin-toast__text">{t.message}</span>
              <button
                type="button"
                className="admin-toast__close"
                aria-label="إغلاق الإشعار"
                onClick={() => dismiss(t.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </AdminPortal>
    </ToastContext.Provider>
  );
}
