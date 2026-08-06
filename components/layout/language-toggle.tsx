"use client";

import { useLanguage } from "@/components/providers/language-provider";
import type { Language } from "@/lib/site-copy";

const languageOptions: {
  label: string;
  value: Language;
}[] = [
  {
    label: "EN",
    value: "en",
  },
  {
    label: "AM",
    value: "am",
  },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Choose website language"
      className="
        relative grid h-11 w-[116px] shrink-0 grid-cols-2
        rounded-[15px] border border-black/[0.09]
        bg-white/75 p-1
        shadow-[0_8px_25px_rgba(25,38,18,0.06)]
        backdrop-blur-xl
        transition-all duration-300
        hover:border-[#68a93d]/30
        hover:bg-white
        hover:shadow-[0_12px_32px_rgba(62,102,38,0.12)]

        sm:w-[128px]

        lg:h-12 lg:w-[144px] lg:rounded-[17px]
      "
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none absolute bottom-1 left-1 top-1
          w-[calc(50%-4px)]
          rounded-[12px]
          border border-[#79c84b]/45
          bg-[linear-gradient(135deg,rgba(236,255,216,0.98),rgba(246,255,235,0.94))]
          shadow-[0_8px_24px_rgba(94,167,48,0.18),0_0_0_1px_rgba(123,215,65,0.08)]
          transition-transform duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]

          lg:rounded-[14px]

          ${
            language === "am"
              ? "translate-x-full"
              : "translate-x-0"
          }
        `}
      />

      {languageOptions.map((option) => {
        const isActive = language === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            aria-label={`Change language to ${option.label}`}
            onClick={() => setLanguage(option.value)}
            className={`
              group relative z-10 flex min-w-0
              items-center justify-center rounded-xl
              text-[12px] font-extrabold tracking-[0.02em]
              transition-all duration-300

              sm:text-[13px]
              lg:text-sm

              ${
                isActive
                  ? "text-[#3f7225]"
                  : "text-black/42 hover:text-[#4c7b31]"
              }
            `}
          >
            <span
              aria-hidden="true"
              className={`
                absolute left-[9px] h-1.5 w-1.5
                rounded-full bg-[#71c53f]
                shadow-[0_0_12px_rgba(113,197,63,0.75)]
                transition-all duration-300

                sm:left-[11px]

                ${
                  isActive
                    ? "scale-100 opacity-100"
                    : "scale-0 opacity-0"
                }
              `}
            />

            <span
              className={`
                transition-transform duration-300
                group-hover:scale-[1.04]

                ${isActive ? "scale-100" : "scale-[0.98]"}
              `}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}