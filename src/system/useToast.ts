import { createContext, useContext } from "react";
export interface ToastMessage {
  title: string;
  description?: string;
  tone?: "success" | "error" | "info" | "warning";
  duration?: number;
}
export const ToastContext = createContext<{
  toast: (message: ToastMessage) => void;
} | null>(null);
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast requires ToastProvider");
  return context;
}
