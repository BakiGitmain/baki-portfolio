"use client";

import {
  Flag,
  ShieldCheck,
  X,
} from "lucide-react";

import PartnerRankBadge from "@/components/representative/partner-rank-badge";

import type {
  PartnerChatParticipant,
} from "@/lib/partner-chat-api";

import ChatAvatar from "./chat-avatar";
import styles from "./partner-chat.module.css";

export default function ChatProfileCard({
  participant,
  language,
  alignRight,
  canReport,
  onReport,
  onClose,
}: {
  participant: PartnerChatParticipant;
  language: "en" | "am";
  alignRight: boolean;
  canReport: boolean;
  onReport: () => void;
  onClose: () => void;
}) {
  const copy = language === "am"
    ? {
        admin: "Baki Digital አስተዳዳሪ",
        partner: "የሽያጭ Partner",
        sales: "የተረጋገጡ ሽያጮች",
        reports: "ሪፖርቶች",
        report: "መልዕክቱን ሪፖርት አድርግ",
        close: "መገለጫውን ዝጋ",
      }
    : {
        admin: "Baki Digital Admin",
        partner: "Sales Partner",
        sales: "Verified sales",
        reports: "Reports",
        report: "Report message",
        close: "Close profile",
      };

  return (
    <section
      role="dialog"
      aria-label={`${participant.name} profile`}
      className={`${styles.profileCard} ${alignRight ? styles.profileCardRight : ""}`}
    >
      <button type="button" onClick={onClose} className={styles.profileCardClose} aria-label={copy.close}>
        <X size={13} aria-hidden="true" />
      </button>
      <div className={styles.profileCardIdentity}>
        <ChatAvatar participant={participant} />
        <div>
          <strong>{participant.name}</strong>
          <span>{participant.role === "admin" ? copy.admin : copy.partner}</span>
          {participant.partnerId && <code>{participant.partnerId}</code>}
        </div>
      </div>

      {participant.role === "admin" ? (
        <div className={styles.profileAdminLine}>
          <ShieldCheck size={14} aria-hidden="true" />
          {copy.admin}
        </div>
      ) : participant.performance ? (
        <>
          <div className={styles.profileRankRow}>
            <PartnerRankBadge rank={participant.performance.rank} language={language} />
          </div>
          <dl className={styles.profileStats}>
            <div><dt>{copy.sales}</dt><dd>{participant.performance.verifiedSales}</dd></div>
            <div><dt>{copy.reports}</dt><dd>{participant.performance.reports}</dd></div>
          </dl>
        </>
      ) : null}

      {canReport && (
        <button type="button" onClick={onReport} className={styles.profileReportButton}>
          <Flag size={14} aria-hidden="true" />
          {copy.report}
        </button>
      )}
    </section>
  );
}
