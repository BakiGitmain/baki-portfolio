"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Ban,
  Loader2,
  X,
} from "lucide-react";

import {
  banAdminPartner,
  type ActivePartnerBan,
  type PartnerBanDuration,
} from "@/lib/admin-partner-moderation-api";

export default function BanPartnerDialog({
  open,
  representativeId,
  partnerName,
  language,
  sourceChatReportId,
  suggestedReason = "",
  onClose,
  onBanned,
}: {
  open: boolean;
  representativeId: string;
  partnerName: string;
  language: "en" | "am";
  sourceChatReportId?: string | null;
  suggestedReason?: string;
  onClose: () => void;
  onBanned: (ban: ActivePartnerBan) => void | Promise<void>;
}) {
  const [duration, setDuration] = useState<PartnerBanDuration>("24h");
  const [customUntil, setCustomUntil] = useState("");
  const [reason, setReason] = useState(suggestedReason);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const copy = language === "am"
    ? {
        eyebrow: "የመለያ መዳረሻ",
        title: `${partnerName}ን እገድ`,
        body: "እገዳው በሚቀጥለው ጥያቄ ላይ Portal እና Chat መዳረሻን ያቆማል። ጊዜያዊ እገዳ ሲያበቃ መዳረሻው በራሱ ይመለሳል።",
        duration: "የእገዳ ጊዜ",
        reason: "ለPartner የሚታይ ምክንያት (አስፈላጊ)",
        placeholder: "እገዳው ለምን እንደሚያስፈልግ በግልጽ ይጻፉ…",
        custom: "የማብቂያ ጊዜ",
        cancel: "ይቅር",
        confirm: "Partner እገድ",
        required: "የእገዳ ምክንያት ያስገቡ።",
      }
    : {
        eyebrow: "ACCOUNT ACCESS",
        title: `Ban ${partnerName}`,
        body: "The ban blocks Portal and Chat access on the next request. Temporary access restores automatically when the selected period ends.",
        duration: "Ban duration",
        reason: "Reason shown to Partner (required)",
        placeholder: "Explain clearly why this access restriction is needed…",
        custom: "Custom expiry",
        cancel: "Cancel",
        confirm: "Ban Partner",
        required: "Enter a clear ban reason.",
      };

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => reasonRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose, open, suggestedReason]);

  if (!open) return null;

  async function submit() {
    if (!reason.trim()) {
      setError(copy.required);
      reasonRef.current?.focus();
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await banAdminPartner(representativeId, language, {
        duration,
        reason: reason.trim(),
        customUntil: duration === "custom" && customUntil
          ? new Date(customUntil).toISOString()
          : null,
        sourceChatReportId: sourceChatReportId ?? null,
      });
      await onBanned(result.active);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to ban this Partner.");
    } finally {
      setBusy(false);
    }
  }

  const durations: Array<[PartnerBanDuration, string]> = [
    ["1h", language === "am" ? "1 ሰዓት" : "1 hour"],
    ["24h", language === "am" ? "24 ሰዓት" : "24 hours"],
    ["1w", language === "am" ? "1 ሳምንት" : "1 week"],
    ["30d", language === "am" ? "30 ቀን" : "30 days"],
    ["permanent", language === "am" ? "ቋሚ" : "Permanent"],
    ["custom", language === "am" ? "ብጁ" : "Custom"],
  ];

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <button type="button" aria-label={copy.cancel} disabled={busy} onClick={onClose} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" aria-labelledby="ban-partner-title" className="relative z-10 w-full max-w-[560px] rounded-[25px] border border-black/[0.07] bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Ban className="h-5 w-5" aria-hidden="true" /></span>
          <button type="button" onClick={onClose} disabled={busy} aria-label={copy.cancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04] text-black/45"><X className="h-4 w-4" /></button>
        </div>
        <span className="mt-5 block text-[9px] font-black tracking-[0.14em] text-red-600">{copy.eyebrow}</span>
        <h2 id="ban-partner-title" className="mt-1.5 text-[22px] font-black tracking-[-0.04em] text-[#251f1d]">{copy.title}</h2>
        <p className="mt-2 text-[10px] leading-5 text-black/52">{copy.body}</p>

        <fieldset className="mt-5">
          <legend className="mb-2 text-[10px] font-extrabold text-black/55">{copy.duration}</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {durations.map(([value, label]) => (
              <button key={value} type="button" onClick={() => setDuration(value)} className={`h-10 rounded-xl border text-[9px] font-extrabold ${duration === value ? "border-[#b74235] bg-red-50 text-red-650" : "border-black/[0.08] text-black/50"}`}>{label}</button>
            ))}
          </div>
        </fieldset>

        {duration === "custom" && (
          <label className="mt-4 block">
            <span className="mb-2 block text-[10px] font-extrabold text-black/55">{copy.custom}</span>
            <input type="datetime-local" value={customUntil} onChange={(event) => setCustomUntil(event.target.value)} className="h-11 w-full rounded-xl border border-black/10 px-3 text-[11px] outline-none focus:border-red-300" />
          </label>
        )}

        <label className="mt-4 block">
          <span className="mb-2 block text-[10px] font-extrabold text-black/55">{copy.reason}</span>
          <textarea ref={reasonRef} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={4} placeholder={copy.placeholder} className="w-full resize-none rounded-[14px] border border-black/10 bg-[#fafbf8] p-3 text-[11px] leading-5 outline-none focus:border-red-300" />
          <span className="mt-1 block text-right text-[8px] text-black/35">{reason.length}/500</span>
        </label>

        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[10px] text-red-650">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-xl border border-black/10 text-[10px] font-bold text-black/55">{copy.cancel}</button>
          <button type="button" onClick={() => void submit()} disabled={busy || (duration === "custom" && !customUntil)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b74235] text-[10px] font-extrabold text-white disabled:opacity-45">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{copy.confirm}</button>
        </div>
      </section>
    </div>
  );
}
