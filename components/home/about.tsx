"use client";

import AboutScene from "@/components/home/about-scene";
import { useLanguage } from "@/components/providers/language-provider";

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 3V12M10 12L6.5 8.5M10 12L13.5 8.5M4 15.5H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const copy = {
  en: {
    label: "ABOUT ME",

    titleTop: "Crafting digital",
    titleBottom: "experiences with",
    titleAccent: "passion & purpose.",

    description:
      "I'm a full-stack developer who loves building scalable web apps, clean UI, and smart solutions that solve real-world problems.",

    download: "Download CV",

    stats: [
      {
        value: "2+",
        label: "Years Experience",
      },
      {
        value: "10+",
        label: "Projects Completed",
      },
      {
        value: "6+",
        label: "Happy Clients",
      },
    ],
  },

  am: {
    label: "ስለ እኔ",

    titleTop: "ዲጂታል ልምዶችን",
    titleBottom: "በፍላጎት እና",
    titleAccent: "በዓላማ እገነባለሁ።",

    description:
      "ዘመናዊ የድር መተግበሪያዎችን፣ ንጹህ UI እና ተግባራዊ ስርዓቶችን መገንባት የምወድ ፉል-ስታክ ዴቨሎፐር ነኝ።",

    download: "CV ያውርዱ",

    stats: [
      {
        value: "2+",
        label: "ዓመት ልምድ",
      },
      {
        value: "10+",
        label: "የተጠናቀቁ ፕሮጀክቶች",
      },
      {
        value: "6+",
        label: "ደስተኛ ደንበኞች",
      },
    ],
  },
} as const;

export default function About() {
  const { language } = useLanguage();

  const text = copy[language];

  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden bg-[#f8f8f4] py-10 sm:py-14 lg:py-24"
    >
      {/* OUTER PAGE GLOWS */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#e4eedc]/45 blur-[120px]" />

      <div className="pointer-events-none absolute right-[-160px] top-1/4 h-[520px] w-[520px] rounded-full bg-white blur-[120px]" />

      <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-6 lg:px-12">
        <div
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border border-black/[0.055]
            bg-[#fafaf7]
            shadow-[0_25px_80px_rgba(35,52,24,0.07)]
            lg:rounded-[30px]
          "
        >
          {/* =====================================================
              GLOBAL CARD BACKGROUND
             ===================================================== */}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_45%,rgba(217,235,205,0.38),transparent_39%)]" />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.90)_39%,rgba(248,248,244,0.62)_60%,rgba(248,248,244,0.18)_100%)] lg:hidden" />

          {/* =====================================================
              MOBILE / TABLET MAIN AREA
             ===================================================== */}

          <div className="relative min-h-[540px] lg:hidden">
            {/* 3D SCENE BEHIND / RIGHT */}
            <div
              className="
                absolute
                bottom-0
                right-[-28%]
                top-0
                z-0
                w-[76%]

                sm:right-[-14%]
                sm:w-[66%]
              "
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.18) 9%, black 31%, black 100%)",
                maskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.18) 9%, black 31%, black 100%)",
              }}
            >
              <div
                className="
                  absolute
                  inset-[-10%_-30%_-10%_-18%]
                  scale-[0.73]

                  sm:inset-[-10%_-20%_-10%_-12%]
                  sm:scale-[0.82]
                "
              >
                <AboutScene />
              </div>
            </div>

            {/* EXTRA EDGE FADE */}
            <div
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-[48%]
                z-[1]
                w-[26%]

                bg-gradient-to-r
                from-[#fafaf7]
                via-[#fafaf7]/85
                to-transparent

                sm:left-[53%]
                sm:w-[22%]
              "
            />

            {/* SOFT BOTTOM FADE */}
            <div
              className="
                pointer-events-none
                absolute
                inset-x-0
                bottom-0
                z-[2]
                h-28
                bg-gradient-to-t
                from-[#fafaf7]
                via-[#fafaf7]/70
                to-transparent
              "
            />

            {/* TEXT CONTENT */}
            <div
              className="
                relative
                z-10
                w-[67%]
                px-5
                pb-9
                pt-8

                sm:w-[62%]
                sm:px-8
                sm:pb-10
                sm:pt-10
              "
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="h-px w-5 shrink-0 bg-[#426c2b]" />

                <p className="text-[8px] font-bold tracking-[0.16em] text-[#426c2b] sm:text-[10px]">
                  {text.label}
                </p>
              </div>

              <h2
                className="
                  text-[clamp(1.95rem,8vw,2.8rem)]
                  font-semibold
                  leading-[0.94]
                  tracking-[-0.06em]
                  text-[#11130f]

                  sm:text-[clamp(2.7rem,6vw,4rem)]
                "
              >
                {text.titleTop}

                <br />

                {text.titleBottom}

                <br />

                <span className="text-[#426c2b]">
                  {text.titleAccent}
                </span>
              </h2>

              <p
                className="
                  mt-6
                  max-w-[380px]
                  text-[10.5px]
                  leading-[1.85]
                  text-black/48

                  sm:text-sm
                  sm:leading-7
                "
              >
                {text.description}
              </p>

              <a
                href="/baki-cv.pdf"
                download
                className="
                  group
                  mt-6
                  inline-flex
                  h-10
                  w-fit
                  items-center
                  gap-2
                  rounded-[11px]
                  border
                  border-black/[0.08]
                  bg-white/90
                  px-3.5
                  text-[11px]
                  font-semibold
                  text-[#171914]
                  shadow-[0_10px_30px_rgba(20,30,14,0.08)]
                  backdrop-blur-xl
                  transition-all
                  duration-300

                  hover:-translate-y-1
                  hover:border-[#426c2b]/25
                  hover:text-[#426c2b]

                  sm:h-11
                  sm:px-4
                  sm:text-xs
                "
              >
                {text.download}

                <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                  <DownloadIcon />
                </span>
              </a>
            </div>

            {/* SMALL DECORATIVE TECH LABEL */}
            <div
              className="
                pointer-events-none
                absolute
                right-4
                top-5
                z-20
                rounded-full
                border border-[#426c2b]/10
                bg-white/75
                px-2.5
                py-1.5
                font-mono
                text-[8px]
                font-semibold
                text-[#426c2b]
                shadow-sm
                backdrop-blur-xl

                sm:right-6
                sm:top-6
                sm:text-[9px]
              "
            >
              &lt;/&gt; SYSTEM
            </div>
          </div>

          {/* =====================================================
              MOBILE / TABLET STATS
             ===================================================== */}

          <div
            className="
              relative
              z-20
              mx-4
              mb-5
              grid
              grid-cols-3
              overflow-hidden
              rounded-2xl
              border border-black/[0.07]
              bg-white/92
              shadow-[0_15px_45px_rgba(36,52,25,0.055)]
              backdrop-blur-xl

              sm:mx-6
              sm:mb-7

              lg:hidden
            "
          >
            {text.stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`
                  relative
                  min-h-[108px]
                  px-4
                  py-5
                  transition-colors
                  duration-300
                  hover:bg-[#f7faf5]

                  sm:min-h-[118px]
                  sm:px-5

                  ${
                    index !== text.stats.length - 1
                      ? "border-r border-black/[0.07]"
                      : ""
                  }
                `}
              >
                <p className="text-lg font-bold tracking-[-0.04em] text-[#161914] sm:text-xl">
                  {stat.value}
                </p>

                <p className="mt-2 text-[9px] leading-4 text-black/40 sm:text-[10px]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* =====================================================
              DESKTOP
             ===================================================== */}

          <div
            className="
              relative
              hidden
              min-h-[720px]
              grid-cols-[0.78fr_1.22fr]
              lg:grid
            "
          >
            {/* DESKTOP LEFT */}
            <div className="relative z-20 flex flex-col justify-center px-14 py-16">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-[#426c2b]" />

                <p className="text-[11px] font-bold tracking-[0.14em] text-[#426c2b]">
                  {text.label}
                </p>
              </div>

              <h2 className="max-w-[570px] text-[clamp(3.6rem,5vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[#11130f]">
                {text.titleTop}

                <br />

                {text.titleBottom}

                <br />

                <span className="text-[#426c2b]">
                  {text.titleAccent}
                </span>
              </h2>

              <p className="mt-7 max-w-[520px] text-base leading-8 text-black/50">
                {text.description}
              </p>

              {/* DESKTOP STATS */}
              <div
                className="
                  mt-9
                  grid
                  max-w-[520px]
                  grid-cols-3
                  overflow-hidden
                  rounded-2xl
                  border border-black/[0.07]
                  bg-white/75
                  shadow-[0_16px_45px_rgba(36,52,25,0.05)]
                  backdrop-blur-xl
                "
              >
                {text.stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`
                      min-h-[120px]
                      px-5
                      py-5
                      transition-all
                      duration-300
                      hover:bg-white

                      ${
                        index !== text.stats.length - 1
                          ? "border-r border-black/[0.07]"
                          : ""
                      }
                    `}
                  >
                    <p className="text-2xl font-bold tracking-[-0.04em] text-[#161914]">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-black/40">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP 3D */}
            <div className="relative overflow-hidden bg-[#f8f8f4]">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dcebd2]/35 blur-[90px]" />

              <AboutScene />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#f8f8f4] to-transparent" />

              <a
                href="/baki-cv.pdf"
                download
                className="
                  group
                  absolute
                  bottom-7
                  right-7
                  z-30
                  inline-flex
                  h-12
                  items-center
                  gap-3
                  rounded-xl
                  border border-black/[0.08]
                  bg-white/95
                  px-5
                  text-sm
                  font-semibold
                  text-[#171914]
                  shadow-[0_14px_40px_rgba(20,30,14,0.13)]
                  backdrop-blur-xl
                  transition-all
                  duration-300

                  hover:-translate-y-1
                  hover:border-[#426c2b]/25
                  hover:text-[#426c2b]
                  hover:shadow-[0_20px_45px_rgba(46,76,28,0.17)]
                "
              >
                {text.download}

                <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                  <DownloadIcon />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}