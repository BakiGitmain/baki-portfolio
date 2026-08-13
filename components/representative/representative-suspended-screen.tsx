"use client";

import {
  Ban,
  Clock3,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export type RepresentativeSuspension = {
  reason: string;
  bannedUntil: string | null;
  isPermanent: boolean;
};

export default function RepresentativeSuspendedScreen({
  suspension,
  language,
  onLogout,
}: {
  suspension: RepresentativeSuspension;
  language: "en" | "am";
  onLogout?: () => void;
}) {
  const until = suspension.bannedUntil
    ? new Intl.DateTimeFormat(language === "am" ? "am-ET" : "en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(suspension.bannedUntil))
    : null;

  const copy = language === "am"
    ? {
        eyebrow: "የመለያ መዳረሻ",
        title: "የPartner መለያዎ ታግዷል",
        body: suspension.isPermanent
          ? "የPortal እና Partner Chat መዳረሻዎ በአስተዳዳሪ ታግዷል።"
          : "የPortal እና Partner Chat መዳረሻዎ ለጊዜው ታግዷል። የእገዳው ጊዜ ሲያበቃ መዳረሻዎ በራሱ ይመለሳል።",
        reason: "ምክንያት",
        until: "መዳረሻው የሚመለሰው",
        permanent: "ቋሚ እገዳ — ለተጨማሪ መረጃ Baki Digitalን ያነጋግሩ።",
        logout: "ውጣ",
        support: "ይህ ስህተት ነው ብለው ካመኑ በመደበኛው የBaki Digital ድጋፍ መንገድ ያነጋግሩ።",
      }
    : {
        eyebrow: "ACCOUNT ACCESS",
        title: "Your Partner account is suspended",
        body: suspension.isPermanent
          ? "Portal and Partner Chat access has been suspended by an administrator."
          : "Portal and Partner Chat access is temporarily suspended. Access restores automatically when the suspension period ends.",
        reason: "Reason",
        until: "Access restores",
        permanent: "Permanent suspension — contact Baki Digital for further information.",
        logout: "Log out",
        support: "If you believe this is a mistake, contact Baki Digital through the usual support channel.",
      };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7f1] px-4 py-12">
      <div aria-hidden="true" className="absolute left-1/2 top-[-300px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-red-200/25 blur-[140px]" />
      <section className="relative w-full max-w-[560px] rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-[0_28px_90px_rgba(40,43,35,0.1)] sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-red-50 text-red-600"><ShieldAlert className="h-6 w-6" /></span>
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[9px] font-black text-red-650"><Ban className="h-3 w-3" />SUSPENDED</span>
        </div>
        <span className="mt-7 block text-[9px] font-black tracking-[0.16em] text-[#638d46]">{copy.eyebrow}</span>
        <h1 className="mt-2 text-[28px] font-black tracking-[-0.05em] text-[#201f1b] sm:text-[34px]">{copy.title}</h1>
        <p className="mt-3 text-[11px] leading-6 text-black/52">{copy.body}</p>

        <dl className="mt-6 space-y-2">
          <div className="rounded-[15px] bg-[#f7f8f5] p-4"><dt className="text-[9px] font-extrabold text-black/38">{copy.reason}</dt><dd className="mt-1.5 whitespace-pre-wrap text-[11px] font-bold leading-5 text-[#343a31]">{suspension.reason}</dd></div>
          <div className="rounded-[15px] bg-[#f7f8f5] p-4"><dt className="flex items-center gap-1.5 text-[9px] font-extrabold text-black/38"><Clock3 className="h-3 w-3" />{copy.until}</dt><dd className="mt-1.5 text-[11px] font-bold text-[#343a31]">{suspension.isPermanent ? copy.permanent : until}</dd></div>
        </dl>

        <p className="mt-5 text-[9px] leading-5 text-black/40">{copy.support}</p>
        {onLogout && <button type="button" onClick={onLogout} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-[10px] font-extrabold text-black/58"><LogOut className="h-4 w-4" />{copy.logout}</button>}
      </section>
    </main>
  );
}
