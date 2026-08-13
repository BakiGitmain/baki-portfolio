"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  Flag,
  Loader2,
  X,
} from "lucide-react";

import {
  reportPartnerChatMessage,
  type PartnerChatMessage,
  type PartnerChatReportReason,
} from "@/lib/partner-chat-api";

import styles from "./partner-chat.module.css";

export default function ChatReportDialog({
  message,
  language,
  onClose,
}: {
  message: PartnerChatMessage;
  language: "en" | "am";
  onClose: () => void;
}) {
  const [reason, setReason] = useState<PartnerChatReportReason>("spam");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const copy = language === "am"
    ? {
        title: "ይህን መልዕክት ሪፖርት ያድርጉ",
        body: "ሪፖርቱ የዚህን መልዕክት ቅጂ በደህና ይይዛል እና ለBaki Digital አስተዳዳሪዎች ብቻ ይታያል።",
        reason: "ምክንያት",
        note: "ተጨማሪ ማስታወሻ (አማራጭ)",
        notePlaceholder: "ለግምገማው ጠቃሚ የሆነ አውድ ያክሉ…",
        cancel: "ይቅር",
        submit: "ሪፖርት ላክ",
        success: "እናመሰግናለን። መልዕክቱ ለAdmin ግምገማ ተልኳል።",
        done: "ዝጋ",
      }
    : {
        title: "Report this message",
        body: "The report safely preserves a copy of this message and is visible only to Baki Digital administrators.",
        reason: "Reason",
        note: "Additional note (optional)",
        notePlaceholder: "Add context that may help the review…",
        cancel: "Cancel",
        submit: "Send report",
        success: "Thank you. The message was sent for Admin review.",
        done: "Close",
      };

  const reasons: Array<[PartnerChatReportReason, string]> = language === "am"
    ? [["spam", "Spam"], ["harassment", "ትንኮሳ"], ["scam", "ማጭበርበር"], ["inappropriate", "ተገቢ ያልሆነ"], ["threats", "ዛቻ"], ["other", "ሌላ"]]
    : [["spam", "Spam"], ["harassment", "Harassment"], ["scam", "Scam"], ["inappropriate", "Inappropriate"], ["threats", "Threats"], ["other", "Other"]];

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await reportPartnerChatMessage(language, {
        messageId: message.id,
        reason,
        note: note.trim() || undefined,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send this report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.reportDialogBackdrop}>
      <button type="button" aria-label={copy.cancel} disabled={busy} onClick={onClose} className={styles.reportDialogScrim} />
      <section role="dialog" aria-modal="true" aria-labelledby="chat-report-title" className={styles.reportDialog}>
        <div className={styles.reportDialogTop}>
          <span><Flag size={18} aria-hidden="true" /></span>
          <button ref={closeRef} type="button" onClick={onClose} disabled={busy} aria-label={copy.cancel}><X size={16} /></button>
        </div>
        {submitted ? (
          <div className={styles.reportSuccess}>
            <CheckCircle2 size={28} aria-hidden="true" />
            <h2 id="chat-report-title">{copy.success}</h2>
            <button type="button" onClick={onClose}>{copy.done}</button>
          </div>
        ) : (
          <>
            <h2 id="chat-report-title">{copy.title}</h2>
            <p>{copy.body}</p>
            <blockquote className={styles.reportEvidence}><strong>{message.sender.name}</strong>{message.message}</blockquote>
            <fieldset className={styles.reportReasons}>
              <legend>{copy.reason}</legend>
              {reasons.map(([value, label]) => (
                <label key={value}><input type="radio" name={`report-${message.id}`} value={value} checked={reason === value} onChange={() => setReason(value)} />{label}</label>
              ))}
            </fieldset>
            <label className={styles.reportNote}>
              <span>{copy.note}</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} placeholder={copy.notePlaceholder} />
            </label>
            {error && <p role="alert" className={styles.reportError}>{error}</p>}
            <div className={styles.reportDialogActions}>
              <button type="button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
              <button type="button" onClick={() => void submit()} disabled={busy}>{busy && <Loader2 size={14} className={styles.spinner} />}{copy.submit}</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
