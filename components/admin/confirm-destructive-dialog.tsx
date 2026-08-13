"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

export default function ConfirmDestructiveDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label={cancelLabel}
        className="absolute inset-0"
        disabled={busy}
        onClick={onClose}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="destructive-dialog-title"
        aria-describedby="destructive-dialog-description"
        className="relative z-10 w-full max-w-[470px] rounded-[24px] border border-red-100 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={cancelLabel}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04] text-black/45 disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <h2 id="destructive-dialog-title" className="mt-5 text-[21px] font-black tracking-[-0.035em] text-[#251d1b]">
          {title}
        </h2>
        <p id="destructive-dialog-description" className="mt-2 text-[11px] leading-6 text-black/55">
          {description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 rounded-xl border border-black/10 text-[10px] font-bold text-black/60 disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b74235] text-[10px] font-extrabold text-white shadow-[0_8px_20px_rgba(183,66,53,0.2)] disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
