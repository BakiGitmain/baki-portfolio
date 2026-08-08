"use client";

import Link from "next/link";

import ProjectGallery from "@/components/projects/project-gallery";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import type {
  LocalizedText,
  Project,
  ProjectGalleryImage,
  ProjectStep,
} from "@/lib/projects";

/* =========================================================
   ICON
   ========================================================= */

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M8 16L16 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M9 8H16V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   TEMP GYM FALLBACK
   ========================================================= */

const gymHouseHowItWorks:
  ProjectStep[] = [
    {
      title: {
        en:
          "Secure Authentication",

        am:
          "ደህንነቱ የተጠበቀ መግቢያ",
      },

      description: {
        en:
          "Customers and administrators authenticate through protected backend sessions with role-based access.",

        am:
          "ደንበኞች እና administrators በprotected backend sessions እና role-based access ወደ system ይገባሉ።",
      },
    },

    {
      title: {
        en:
          "Customer Management",

        am:
          "የደንበኛ አስተዳደር",
      },

      description: {
        en:
          "Administrators can create and manage customer accounts, profile images and account status.",

        am:
          "Administrators customer accounts፣ profile images እና account status መፍጠርና ማስተዳደር ይችላሉ።",
      },
    },

    {
      title: {
        en:
          "Membership Tracking",

        am:
          "Membership ክትትል",
      },

      description: {
        en:
          "Membership start dates, expiration dates and current status are calculated and tracked by the system.",

        am:
          "Membership start date፣ expiration date እና current status በsystem ይሰላሉ እና ይከታተላሉ።",
      },
    },

    {
      title: {
        en:
          "Customer Experience",

        am:
          "የደንበኛ Experience",
      },

      description: {
        en:
          "Customers receive a responsive account experience designed for both mobile and desktop.",

        am:
          "ደንበኞች ለmobile እና desktop የተዘጋጀ responsive account experience ያገኛሉ።",
      },
    },
  ];

const gymHouseFeatures:
  LocalizedText[] = [
    {
      en:
        "Secure role-based administrator and customer authentication",

      am:
        "ደህንነቱ የተጠበቀ role-based admin እና customer authentication",
    },

    {
      en:
        "Protected administrator dashboard for customer management",

      am:
        "Customer management ያለው protected administrator dashboard",
    },

    {
      en:
        "Customer account and profile management",

      am:
        "Customer account እና profile management",
    },

    {
      en:
        "Membership start, expiration and status tracking",

      am:
        "Membership start፣ expiration እና status tracking",
    },
  ];

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ProjectDetail({
  project,
}: {
  project:
    Project;
}) {
  const {
    language,
  } = useLanguage();

  const title =
    language === "am"
      ? project.title.am
      : project.title.en;

  const category =
    language === "am"
      ? project.category.am
      : project.category.en;

  const description =
    language === "am"
      ? project.description.am
      : project.description.en;

  const role =
    language === "am"
      ? project.role.am
      : project.role.en;

  const projectStatus =
    language === "am"
      ? project.status.am
      : project.status.en;

  const overview =
    language === "am"
      ? project.overview.am
      : project.overview.en;

  const challenge =
    language === "am"
      ? project.challenge.am
      : project.challenge.en;

  const solution =
    language === "am"
      ? project.solution.am
      : project.solution.en;

  /* =======================================================
     FALLBACK CASE STUDY
     ======================================================= */

  const isGymHouse =
    project.slug ===
    "gym-house";

  const howItWorks =
    project.howItWorks.length >
    0
      ? project.howItWorks
      : isGymHouse
        ? gymHouseHowItWorks
        : [];

  const features =
    project.features.length >
    0
      ? project.features
      : isGymHouse
        ? gymHouseFeatures
        : [];

  /* =======================================================
     GALLERY
     ======================================================= */

  const fallbackGallery:
    ProjectGalleryImage[] = [
      {
        url:
          project.thumbnail,

        publicId:
          `${project.slug}-cover`,

        alt: {
          en:
            `${project.title.en} project`,

          am:
            `${project.title.am} ፕሮጀክት`,
        },
      },
    ];

  const gallery =
    project.gallery.length >
    0
      ? project.gallery.slice(
          0,
          5,
        )
      : fallbackGallery;

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language === "am"
      ? {
          back:
            "ሁሉም ፕሮጀክቶች",

          overview:
            "ስለ ፕሮጀክቱ",

          challenge:
            "ፈተናው",

          solution:
            "መፍትሄው",

          howItWorks:
            "እንዴት ይሰራል",

          features:
            "ዋና ባህሪያት",

          technologies:
            "ቴክኖሎጂዎች",

          year:
            "ዓመት",

          role:
            "የእኔ ስራ",

          status:
            "ሁኔታ",

          live:
            "Live Website",
        }
      : {
          back:
            "All Projects",

          overview:
            "Project Overview",

          challenge:
            "The Challenge",

          solution:
            "The Solution",

          howItWorks:
            "How It Works",

          features:
            "Key Features",

          technologies:
            "Technologies",

          year:
            "Year",

          role:
            "My Role",

          status:
            "Status",

          live:
            "Live Website",
        };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f4] pb-24">
      {/* =================================================
          HERO
         ================================================= */}

      <section className="px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-[1450px]">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-black/45 transition-colors hover:text-[#4b792f]"
          >
            ←{" "}
            {
              copy.back
            }
          </Link>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-[1px] w-7 bg-[#4d7a30]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#4d7a30]">
                  {
                    category
                  }
                </span>
              </div>

              <h1 className="max-w-[700px] text-[48px] font-bold leading-[0.95] tracking-[-0.065em] text-[#141713] sm:text-[66px] lg:text-[78px]">
                {
                  title
                }
              </h1>

              <p className="mt-6 max-w-[650px] text-[14px] leading-7 text-black/48 sm:text-[16px] sm:leading-8">
                {
                  description
                }
              </p>

              {project.liveUrl && (
                <div className="mt-7">
                  <a
                    href={
                      project.liveUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#356521] px-5 text-[12px] font-bold text-white shadow-[0_14px_30px_rgba(53,101,33,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#2d581b]"
                  >
                    {
                      copy.live
                    }

                    <ExternalIcon />
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-[20px] border border-black/[0.07] bg-white shadow-[0_15px_45px_rgba(34,45,28,0.05)]">
              <div className="p-4 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  {
                    copy.year
                  }
                </p>

                <p className="mt-2 text-[12px] font-bold text-[#171a15] sm:text-[14px]">
                  {
                    project.year
                  }
                </p>
              </div>

              <div className="border-l border-black/[0.06] p-4 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  {
                    copy.role
                  }
                </p>

                <p className="mt-2 text-[11px] font-bold leading-5 text-[#171a15] sm:text-[13px]">
                  {
                    role
                  }
                </p>
              </div>

              <div className="border-l border-black/[0.06] p-4 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/30">
                  {
                    copy.status
                  }
                </p>

                <p className="mt-2 text-[11px] font-bold leading-5 text-[#4b792f] sm:text-[13px]">
                  {
                    projectStatus
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          PROJECT GALLERY
         ================================================= */}

      <section className="px-4 sm:px-6 lg:px-8">
        <ProjectGallery
          images={
            gallery
          }
          projectTitle={
            title
          }
        />
      </section>

      {/* =================================================
          OVERVIEW / CHALLENGE
         ================================================= */}

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-2 lg:gap-24">
          <article>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
              01
            </p>

            <h2 className="mt-3 text-[30px] font-bold tracking-[-0.045em] text-[#151813] sm:text-[38px]">
              {
                copy.overview
              }
            </h2>

            <p className="mt-5 whitespace-pre-line text-[14px] leading-7 text-black/50 sm:text-[15px] sm:leading-8">
              {
                overview
              }
            </p>
          </article>

          <article>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
              02
            </p>

            <h2 className="mt-3 text-[30px] font-bold tracking-[-0.045em] text-[#151813] sm:text-[38px]">
              {
                copy.challenge
              }
            </h2>

            <p className="mt-5 whitespace-pre-line text-[14px] leading-7 text-black/50 sm:text-[15px] sm:leading-8">
              {
                challenge
              }
            </p>
          </article>
        </div>
      </section>

      {/* =================================================
          SOLUTION
         ================================================= */}

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] rounded-[28px] border border-[#4e7c31]/10 bg-[#eef5e9] p-7 sm:p-10 lg:p-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
            03
          </p>

          <h2 className="mt-3 text-[30px] font-bold tracking-[-0.045em] text-[#151813] sm:text-[40px]">
            {
              copy.solution
            }
          </h2>

          <p className="mt-5 max-w-[850px] whitespace-pre-line text-[14px] leading-7 text-black/55 sm:text-[16px] sm:leading-8">
            {
              solution
            }
          </p>
        </div>
      </section>

      {/* =================================================
          HOW IT WORKS
         ================================================= */}

      {howItWorks.length >
        0 && (
        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4e7c31]">
              04
            </p>

            <h2 className="mt-3 text-[32px] font-bold tracking-[-0.05em] text-[#151813] sm:text-[44px]">
              {
                copy.howItWorks
              }
            </h2>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {howItWorks.map(
                (
                  step,
                  index,
                ) => {
                  const stepTitle =
                    language ===
                    "am"
                      ? step.title.am
                      : step.title.en;

                  const stepDescription =
                    language ===
                    "am"
                      ? step.description.am
                      : step.description.en;

                  return (
                    <article
                      key={`${step.title.en}-${index}`}
                      className="min-h-[180px] rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_10px_35px_rgba(34,45,28,0.04)] sm:p-7"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf5e8] text-[11px] font-bold text-[#4e7c31]">
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <h3 className="mt-5 text-[18px] font-bold tracking-[-0.025em] text-[#181b16]">
                        {
                          stepTitle
                        }
                      </h3>

                      <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-black/45">
                        {
                          stepDescription
                        }
                      </p>
                    </article>
                  );
                },
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================
          FEATURES / TECHNOLOGIES
         ================================================= */}

      <section
        className={`px-4 sm:px-6 lg:px-8 ${
          howItWorks.length ===
          0
            ? "pt-20 sm:pt-28"
            : ""
        }`}
      >
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-7 sm:p-9">
            <h2 className="text-[24px] font-bold tracking-[-0.04em] text-[#161914]">
              {
                copy.features
              }
            </h2>

            {features.length >
            0 ? (
              <div className="mt-7 space-y-4">
                {features.map(
                  (
                    feature,
                    index,
                  ) => {
                    const text =
                      language ===
                      "am"
                        ? feature.am
                        : feature.en;

                    return (
                      <div
                        key={`${feature.en}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-black/[0.045] bg-[#fafbf8] px-4 py-3"
                      >
                        <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[#75ad4f]" />

                        <p className="text-[13px] leading-6 text-black/55">
                          {
                            text
                          }
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="mt-6 text-[13px] text-black/35">
                —
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-black/[0.06] bg-[#192017] p-7 sm:p-9">
            <h2 className="text-[24px] font-bold tracking-[-0.04em] text-white">
              {
                copy.technologies
              }
            </h2>

            <div className="mt-7 flex flex-wrap gap-2">
              {project.technologies.map(
                (
                  technology,
                ) => (
                  <span
                    key={
                      technology
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] font-semibold text-white/65"
                  >
                    {
                      technology
                    }
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}