"use client";

import type { ReactNode } from "react";
import { AdminConfirmProvider } from "./AdminConfirmProvider";
import { AdminToastProvider } from "./AdminToastProvider";

/** Toast + confirm dialog for all authenticated admin shell pages. */
export function AdminFeedbackProviders({ children }: { children: ReactNode }) {
  return (
    <AdminToastProvider>
      <AdminConfirmProvider>{children}</AdminConfirmProvider>
    </AdminToastProvider>
  );
}
