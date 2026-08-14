"use client";

import {
  useEffect,
} from "react";

import {
  m,
} from "motion/react";

import RobotScene from "@/components/home/robot-scene";
import AnimatedCounter from "@/components/motion/animated-counter";
import AnimatedHeading from "@/components/motion/animated-heading";
import MagneticLink from "@/components/motion/magnetic-link";
import {
  CONTROLLED_SPRING,
  PREMIUM_EASE,
  VIEWPORT_ONCE,
} from "@/components/motion/motion-config";
import {
  usePortfolioMotion,
} from "@/components/motion/motion-provider";
import { useLanguage } from "@/components/providers/language-provider";
import {
  useLoading,
} from "@/components/providers/loading-provider";
import {
  CV_DOWNLOAD_PATH,
  cvData,
} from "@/lib/cv-data";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M5 15L15 5M7 5H15V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function AiAssistantCard({
  title,
  description,
  online,
}: {
  title: string;
  description: string;
  online: string;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      className="
        group relative w-full text-left
        rounded-[18px] border border-black/[0.08]
        bg-white/95 p-3
        shadow-[0_22px_55px_rgba(31,48,22,0.22)]
        backdrop-blur-2xl
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_28px_65px_rgba(31,48,22,0.27)]

        sm:p-3.5
        lg:rounded-2xl lg:p-4
        lg:shadow-[0_24px_65px_rgba(31,48,22,0.22)]
      "
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#315a1f] text-base text-white shadow-[0_8px_20px_rgba(49,90,31,0.28)] transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10 lg:h-11 lg:w-11 lg:text-lg">
          ✦
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-5 text-[#1c2118] sm:text-sm">
            {title}
          </p>

          <p className="mt-0.5 text-[11px] leading-[17px] text-black/50 sm:mt-1 sm:text-xs sm:leading-5">
            {description}
          </p>

          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#527b37] sm:mt-2 sm:text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#72b84f] opacity-40" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#72b84f]" />
            </span>

            {online}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Hero() {
  const { language, copy } = useLanguage();

  const {
    hasRevealed,
  } = useLoading();

  const {
    heroHasPlayed,
    isPremium,
    markHeroPlayed,
    reducedMotion,
  } = usePortfolioMotion();

  const hero = copy.hero;

  const isAmharic = language === "am";

  useEffect(() => {
    if (
      !hasRevealed ||
      heroHasPlayed
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        markHeroPlayed,
        1_200,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    hasRevealed,
    heroHasPlayed,
    markHeroPlayed,
  ]);

  return (
    <section
      id="home"
      className="relative scroll-mt-24 overflow-hidden bg-[#f8f8f4]"
    >
      <div className="pointer-events-none absolute -left-40 top-16 h-96 w-96 rounded-full bg-[#dce8d3]/35 blur-[110px]" />

      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-white blur-[100px]" />

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-8 sm:px-8 sm:pb-12 sm:pt-10 lg:px-12 lg:pb-14 lg:pt-8">
        <div className="relative">
          <div className="grid items-center gap-6 lg:min-h-[660px] lg:grid-cols-[0.88fr_1.12fr] lg:gap-8">
            <div className="relative z-30 py-5 lg:py-12">
              <AnimatedHeading
                as="h1"
                language={language}
                mode="hero"
                active={hasRevealed}
                skipInitial={heroHasPlayed}
                delay={0.1}
                segments={[
                  {
                    text: `${hero.greeting} `,
                  },
                  {
                    accent: true,
                    text: hero.name,
                  },
                ]}
                className={`
                  max-w-[720px] font-semibold text-[#11130f]

                  ${
                    isAmharic
                      ? "text-[clamp(2.75rem,6vw,5.7rem)] leading-[1.08] tracking-[-0.025em]"
                      : "text-[clamp(3.25rem,7vw,6.4rem)] leading-[0.93] tracking-[-0.065em]"
                  }
                `}
              />

              <m.h2
                initial={
                  heroHasPlayed
                    ? false
                    : {
                        letterSpacing:
                          isPremium
                            ? "0.015em"
                            : "-0.03em",
                        opacity: 0,
                        y:
                          reducedMotion
                            ? 0
                            : 12,
                      }
                }
                animate={
                  hasRevealed
                    ? {
                        letterSpacing:
                          "-0.03em",
                        opacity: 1,
                        y: 0,
                      }
                    : undefined
                }
                transition={{
                  delay: 0.43,
                  duration: 0.58,
                  ease: PREMIUM_EASE,
                }}
                className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#171914] sm:text-2xl lg:text-[2rem]"
              >
                {hero.role}
              </m.h2>

              <m.p
                initial={
                  heroHasPlayed
                    ? false
                    : {
                        opacity: 0,
                        y:
                          reducedMotion
                            ? 0
                            : 15,
                      }
                }
                animate={
                  hasRevealed
                    ? {
                        opacity: 1,
                        y: 0,
                      }
                    : undefined
                }
                transition={{
                  delay: 0.53,
                  duration: 0.56,
                  ease: PREMIUM_EASE,
                }}
                className={`
                  mt-5 max-w-[620px] text-base text-black/55
                  sm:text-lg

                  ${
                    isAmharic
                      ? "leading-8 sm:leading-9"
                      : "leading-7 sm:leading-8"
                  }
                `}
              >
                {hero.description}
              </m.p>

              <div className="mt-8 flex flex-col gap-3 min-[430px]:flex-row">
                <MagneticLink
                  href="#projects"
                  initial={
                    heroHasPlayed
                      ? false
                      : {
                          opacity: 0,
                          y:
                            reducedMotion
                              ? 0
                              : 14,
                        }
                  }
                  animate={
                    hasRevealed
                      ? {
                          opacity: 1,
                          y: 0,
                        }
                      : undefined
                  }
                  transition={{
                    ...CONTROLLED_SPRING,
                    delay: 0.64,
                  }}
                  className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#315a1f] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_16px_35px_rgba(49,90,31,0.20)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#294c1b] hover:shadow-[0_20px_42px_rgba(49,90,31,0.28)]"
                >
                  {hero.viewProjects}

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#315a1f] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowIcon />
                  </span>
                </MagneticLink>

                <m.a
                  href={
                    CV_DOWNLOAD_PATH
                  }
                  download={
                    cvData.downloadFileName
                  }
                  aria-label={`Download ${cvData.identity.fullName}'s CV as a PDF`}
                  initial={
                    heroHasPlayed
                      ? false
                      : {
                          opacity: 0,
                          y:
                            reducedMotion
                              ? 0
                              : 14,
                        }
                  }
                  animate={
                    hasRevealed
                      ? {
                          opacity: 1,
                          y: 0,
                        }
                      : undefined
                  }
                  whileTap={{
                    scale: 0.98,
                  }}
                  transition={{
                    ...CONTROLLED_SPRING,
                    delay: 0.7,
                  }}
                  className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-6 py-3 text-center text-sm font-semibold text-[#151713] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#4b702f]/30 hover:text-[#3d6726] hover:shadow-[0_15px_35px_rgba(30,48,20,0.08)]"
                >
                  {hero.downloadCv}

                  <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                    <DownloadIcon />
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-black/35">
                    PDF
                  </span>
                </m.a>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4 lg:max-w-[700px]">
                {hero.statistics.map((stat, index) => (
                  <m.div
                    key={`${stat.value}-${stat.label}`}
                    initial={
                      heroHasPlayed
                        ? false
                        : {
                            opacity: 0,
                            x:
                              reducedMotion
                                ? 0
                                : -10,
                          }
                    }
                    animate={
                      hasRevealed
                        ? {
                            opacity: 1,
                            x: 0,
                          }
                        : undefined
                    }
                    transition={{
                      delay:
                        0.75 +
                        index * 0.055,
                      duration: 0.46,
                      ease: PREMIUM_EASE,
                    }}
                    className={`border-l pl-4 ${
                      index === 0
                        ? "border-[#527b37]"
                        : "border-black/10"
                    }`}
                  >
                    <p className="text-lg font-bold tracking-[-0.04em] text-[#171914] sm:text-xl">
                      <AnimatedCounter
                        active={hasRevealed}
                        value={stat.value}
                      />
                    </p>

                    <p className="mt-1 text-xs leading-5 text-black/45">
                      {stat.label}
                    </p>
                  </m.div>
                ))}
              </div>
            </div>

            <m.div
              initial={
                heroHasPlayed
                  ? false
                  : {
                      opacity: 0.82,
                      scale:
                        reducedMotion
                          ? 1
                          : 0.985,
                    }
              }
              animate={
                hasRevealed
                  ? {
                      opacity: 1,
                      scale: 1,
                    }
                  : undefined
              }
              transition={{
                delay: 0.12,
                duration: 0.72,
                ease: PREMIUM_EASE,
              }}
              className="relative z-20 -mx-4 h-[520px] sm:mx-0 sm:h-[610px] md:h-[650px] lg:h-[660px]"
            >
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-x-[5%] bottom-[8%] top-[6%] rounded-[50%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(255,255,255,0.35)_48%,transparent_72%)]" />

                <div className="pointer-events-none absolute left-[7%] top-[19%] hidden h-[58%] w-[82%] rounded-[50%] border border-[#638b48]/10 sm:block" />

                <div className="pointer-events-none absolute left-[13%] top-[25%] hidden h-[47%] w-[70%] rounded-[50%] border border-[#638b48]/10 sm:block" />

                <RobotScene />
              </div>

              <m.div
                className="pointer-events-none absolute left-[4%] top-[21%] z-30 sm:left-[8%] lg:left-[13%]"
                initial={
                  heroHasPlayed
                    ? false
                    : {
                        opacity: 0,
                        x: -16,
                        y: 9,
                      }
                }
                animate={
                  hasRevealed
                    ? {
                        opacity: 1,
                        x: 0,
                        y: 0,
                      }
                    : undefined
                }
                transition={{
                  delay: 0.78,
                  duration: 0.52,
                  ease: PREMIUM_EASE,
                }}
              >
                <m.div
                  animate={
                    isPremium
                      ? {
                          y: [0, -4, 0],
                        }
                      : {
                          y: 0,
                        }
                  }
                  transition={{
                    delay: 1.25,
                    duration: 5.8,
                    ease: "easeInOut",
                    repeat:
                      isPremium
                        ? Infinity
                        : 0,
                  }}
                  className="flex h-12 w-12 -rotate-6 items-center justify-center rounded-xl border border-black/[0.05] bg-white/90 font-mono text-sm font-bold text-black/60 shadow-[0_15px_40px_rgba(0,0,0,0.08)] backdrop-blur"
                >
                  TS
                </m.div>
              </m.div>

              <m.div
                className="pointer-events-none absolute right-[4%] top-[16%] z-30 sm:right-[8%] lg:right-[10%]"
                initial={
                  heroHasPlayed
                    ? false
                    : {
                        opacity: 0,
                        x: 16,
                        y: -8,
                      }
                }
                animate={
                  hasRevealed
                    ? {
                        opacity: 1,
                        x: 0,
                        y: 0,
                      }
                    : undefined
                }
                transition={{
                  delay: 0.82,
                  duration: 0.52,
                  ease: PREMIUM_EASE,
                }}
              >
                <m.div
                  animate={
                    isPremium
                      ? {
                          y: [0, 3, 0],
                        }
                      : {
                          y: 0,
                        }
                  }
                  transition={{
                    delay: 1.1,
                    duration: 6.4,
                    ease: "easeInOut",
                    repeat:
                      isPremium
                        ? Infinity
                        : 0,
                  }}
                  className="flex h-12 w-12 rotate-6 items-center justify-center rounded-xl border border-black/[0.05] bg-white/90 text-lg font-bold text-[#426c2b] shadow-[0_15px_40px_rgba(0,0,0,0.08)] backdrop-blur"
                >
                  ⚛
                </m.div>
              </m.div>

              <m.div
                className="pointer-events-none absolute right-[2%] top-[45%] z-30 hidden sm:block lg:right-[5%]"
                initial={
                  heroHasPlayed
                    ? false
                    : {
                        opacity: 0,
                        x: 14,
                        y: 8,
                      }
                }
                animate={
                  hasRevealed
                    ? {
                        opacity: 1,
                        x: 0,
                        y: 0,
                      }
                    : undefined
                }
                transition={{
                  delay: 0.86,
                  duration: 0.52,
                  ease: PREMIUM_EASE,
                }}
              >
                <m.div
                  animate={
                    isPremium
                      ? {
                          y: [0, -3, 0],
                        }
                      : {
                          y: 0,
                        }
                  }
                  transition={{
                    delay: 1.35,
                    duration: 7,
                    ease: "easeInOut",
                    repeat:
                      isPremium
                        ? Infinity
                        : 0,
                  }}
                  className="flex h-12 w-12 -rotate-3 items-center justify-center rounded-xl border border-black/[0.05] bg-white/90 font-mono text-sm font-bold text-black/60 shadow-[0_15px_40px_rgba(0,0,0,0.08)] backdrop-blur"
                >
                  &lt;/&gt;
                </m.div>
              </m.div>

              <m.div
                className="absolute bottom-[-10px] right-[-5px] z-[70] w-[calc(100%-1rem)] max-w-[270px] sm:bottom-[-12px] sm:right-[-8px] sm:w-[285px] sm:max-w-[285px] md:bottom-[-18px] md:right-[-14px] md:w-[305px] md:max-w-[305px] lg:bottom-0 lg:right-0 lg:w-[330px] lg:max-w-[330px]"
                initial={
                  heroHasPlayed
                    ? false
                    : {
                        opacity: 0,
                        scale:
                          reducedMotion
                            ? 1
                            : 0.96,
                        y:
                          reducedMotion
                            ? 0
                            : 18,
                      }
                }
                animate={
                  hasRevealed
                    ? {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                      }
                    : undefined
                }
                transition={{
                  delay: 0.87,
                  duration: 0.58,
                  ease: PREMIUM_EASE,
                }}
              >
                <AiAssistantCard
                  title={hero.aiTitle}
                  description={hero.aiDescription}
                  online={hero.online}
                />
              </m.div>
            </m.div>
          </div>
        </div>

        <div
          id="about"
          className="relative z-30 mt-8 grid gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06] shadow-[0_15px_50px_rgba(28,42,20,0.05)] sm:mt-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4"
        >
          {hero.strengths.map((strength) => (
            <m.article
              key={strength.number}
              initial={{
                opacity: 0,
                y:
                  reducedMotion
                    ? 0
                    : 16,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={VIEWPORT_ONCE}
              transition={{
                delay:
                  Number(
                    strength.number,
                  ) * 0.045,
                duration: 0.5,
                ease: PREMIUM_EASE,
              }}
              className="group flex min-h-[106px] gap-4 bg-white/95 p-5 backdrop-blur transition-colors duration-300 hover:bg-[#f7faf5] sm:p-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eff4eb] text-xs font-bold text-[#4b702f] transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-[#e5efdf]">
                {strength.number}
              </span>

              <div>
                <h3 className="text-sm font-bold text-[#181b16] sm:text-base">
                  {strength.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-black/45 sm:text-sm">
                  {strength.description}
                </p>
              </div>
            </m.article>
          ))}
        </div>
      </div>
    </section>
  );
}
