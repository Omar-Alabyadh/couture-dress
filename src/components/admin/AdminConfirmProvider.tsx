"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AdminConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, primary button uses danger styling */
  destructive?: boolean;
};

type ConfirmContextValue = {
  requestConfirm: (opts: AdminConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useAdminConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useAdminConfirm must be used within AdminConfirmProvider");
  }
  return ctx;
}

type OpenState = AdminConfirmOptions & {
  resolve: (v: boolean) => void;
};

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<OpenState | null>(null);
  const titleId = useId();
  const descId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        open.resolve(false);
        setOpen(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  const requestConfirm = useCallback((opts: AdminConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpen({ ...opts, resolve });
    });
  }, []);

  const value = useMemo(() => ({ requestConfirm }), [requestConfirm]);

  const close = (result: boolean) => {
    if (!open) return;
    open.resolve(result);
    setOpen(null);
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open ? (
        <div
          className="admin-modal-root"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="admin-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
          >
            <h2 id={titleId} className="admin-modal__title">
              {open.title}
            </h2>
            <p id={descId} className="admin-modal__message">
              {open.message}
            </p>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-modal__btn admin-modal__btn--secondary"
                onClick={() => close(false)}
              >
                {open.cancelLabel ?? "إلغاء"}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={
                  open.destructive
                    ? "admin-modal__btn admin-modal__btn--danger"
                    : "admin-modal__btn admin-modal__btn--primary"
                }
                onClick={() => close(true)}
              >
                {open.confirmLabel ?? "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
