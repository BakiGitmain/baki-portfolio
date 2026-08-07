"use client";

import { useLanguage } from "@/components/providers/language-provider";
import {
  useExperienceMode,
  type ExperienceMode,
} from "@/components/providers/experience-mode-provider";

function PerformanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[17px] w-[17px] xl:h-[19px] xl:w-[19px]"
      aria-hidden="true"
    >
      <path
        d="M4.7 17.4A8.2 8.2 0 1 1 19.3 17.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 12L17 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
      />

      <path
        d="M12 4.1V6M5.8 7.2L7.3 8.3M18.2 7.2L16.7 8.3M3.9 13H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QualityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[17px] w-[17px] xl:h-[19px] xl:w-[19px]"
      aria-hidden="true"
    >
      <path
        d="M11.8 3.5C11.8 8.4 8.4 11.8 3.5 11.8C8.4 11.8 11.8 15.2 11.8 20.1C11.8 15.2 15.2 11.8 20.1 11.8C15.2 11.8 11.8 8.4 11.8 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M19 3V6M17.5 4.5H20.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const modeOptions: {
  value: ExperienceMode;
  icon: typeof PerformanceIcon;
}[] = [
  {
    value: "performance",
    icon: PerformanceIcon,
  },
  {
    value: "quality",
    icon: QualityIcon,
  },
];

export default function ExperienceModeToggle() {
  const {
    mode,
    setExperienceMode,
  } = useExperienceMode();

  const { language } =
    useLanguage();

  const labels =
    language === "am"
      ? {
          performance:
            "ፍጥነት",
          quality:
            "ጥራት",
          group:
            "የድረ-ገጽ አፈጻጸም ሁነታ",
        }
      : {
          performance:
            "Performance",
          quality:
            "Quality",
          group:
            "Website performance mode",
        };

  return (
    <div
      role="group"
      aria-label={labels.group}
      className={`
        relative
        grid
        h-10
        w-[72px]
        shrink-0
        grid-cols-2
        rounded-[14px]
        border
        border-black/[0.08]
        bg-white/80
        p-1

        shadow-[0_8px_26px_rgba(31,48,22,0.07)]
        backdrop-blur-xl

        transition-all
        duration-300

        hover:border-[#79b84a]/25
        hover:bg-white
        hover:shadow-[0_12px_34px_rgba(67,106,40,0.11)]

        xl:h-12
        xl:w-[220px]
        xl:rounded-full
      `}
    >
      {/* sliding selector */}
      <span
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          bottom-1
          left-1
          top-1

          w-[calc(50%-4px)]

          rounded-[11px]

          border
          border-[#98ce62]/25

          bg-[linear-gradient(135deg,rgba(242,255,219,0.98),rgba(248,255,235,0.94))]

          shadow-[0_7px_22px_rgba(101,158,56,0.13),inset_0_0_20px_rgba(194,255,120,0.18)]

          transition-transform
          duration-500

          ease-[cubic-bezier(0.22,1,0.36,1)]

          xl:rounded-full

          ${
            mode === "quality"
              ? "translate-x-full"
              : "translate-x-0"
          }
        `}
      />

      {modeOptions.map(
        (option) => {
          const Icon =
            option.icon;

          const active =
            option.value === mode;

          const label =
            labels[
              option.value
            ];

          return (
            <button
              key={option.value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={
                active
              }
              onClick={() => {
                setExperienceMode(
                  option.value,
                  {
                    persist: true,
                  },
                );
              }}
              className={`
                group
                relative
                z-10

                flex
                min-w-0
                items-center
                justify-center
                gap-2

                rounded-full

                transition-all
                duration-300

                ${
                  active
                    ? "text-[#4a782d]"
                    : "text-black/43 hover:text-[#4a782d]"
                }
              `}
            >
              <span
                className={`
                  transition-all
                  duration-300

                  ${
                    active
                      ? "scale-100"
                      : "scale-[0.92] group-hover:scale-100"
                  }
                `}
              >
                <Icon />
              </span>

              <span className="hidden text-[12px] font-semibold xl:inline">
                {label}
              </span>

              {active && (
                <span
                  className={`
                    pointer-events-none
                    absolute
                    inset-0
                    -z-10
                    rounded-full
                    bg-[#aee56d]/5
                    blur-lg
                  `}
                />
              )}
            </button>
          );
        },
      )}
    </div>
  );
}