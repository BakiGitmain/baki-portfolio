export type PartnerRank =
  | "NOOB"
  | "PRO"
  | "EXPERT";

export default function PartnerRankBadge({
  rank,
  language =
    "en",
  className =
    "",
}: {
  rank:
    PartnerRank;

  language?:
    "en" |
    "am";

  className?:
    string;
}) {
  const styles =
    rank ===
    "EXPERT"
      ? "border-amber-400/30 bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800"
      : rank ===
          "PRO"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
        : "border-black/10 bg-black/[0.045] text-black/50";

  const label =
    language ===
    "am"
      ? rank ===
        "EXPERT"
        ? "ኤክስፐርት"
        : rank ===
            "PRO"
          ? "ፕሮ"
          : "ኖብ"
      : rank;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
