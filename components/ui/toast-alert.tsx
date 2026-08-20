"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
}

export function ToastAlert({ message, type = "success", onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md text-xs sm:text-sm font-semibold ${
          type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
            : "bg-destructive/10 border-destructive/30 text-destructive"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0" />
        )}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
