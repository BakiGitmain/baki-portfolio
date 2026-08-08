"use client";

import AdminShell from "@/components/admin/admin-shell";

import {
  useLanguage,
} from "@/components/providers/language-provider";

function ApplicationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 9H16M8 13H16M8 17H12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6H20V18H4V6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10H16M8 14H13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrainingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M10 8L16 11L10 14V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminDashboardPage() {
  const {
    language,
  } = useLanguage();

  const copy =
    language === "am"
      ? {
          welcome:
            "Control Center",

          title:
            "Portfolio Admin",

          description:
            "Sales representative program፣ applications፣ training እና ሌሎች admin tools ከዚህ ቦታ ይቆጣጠራሉ።",

          applications:
            "Applications",

          applicationsDescription:
            "የSales representative applicationsን review እና manage ያድርጉ።",

          programs:
            "Programs",

          programsDescription:
            "Commission እና sales program settings ያስተዳድሩ።",

          training:
            "Training",

          trainingDescription:
            "Accepted representatives የሚጠቀሙባቸውን resources ያስተዳድሩ።",

          empty:
            "Backend modules በቀጣይ ይገነባሉ።",

          next:
            "NEXT PHASE",
        }
      : {
          welcome:
            "Control Center",

          title:
            "Portfolio Admin",

          description:
            "Your central workspace for managing the sales representative program, applications, training and future portfolio operations.",

          applications:
            "Applications",

          applicationsDescription:
            "Review and manage incoming sales representative applications.",

          programs:
            "Programs",

          programsDescription:
            "Manage commission structures and active sales programs.",

          training:
            "Training",

          trainingDescription:
            "Manage resources and onboarding material for accepted representatives.",

          empty:
            "Backend modules will be connected next.",

          next:
            "NEXT PHASE",
        };

  const cards = [
    {
      title:
        copy.applications,

      description:
        copy.applicationsDescription,

      icon:
        <ApplicationIcon />,
    },

    {
      title:
        copy.programs,

      description:
        copy.programsDescription,

      icon:
        <ProgramIcon />,
    },

    {
      title:
        copy.training,

      description:
        copy.trainingDescription,

      icon:
        <TrainingIcon />,
    },
  ];

  return (
    <AdminShell>
      <section className="rounded-[24px] border border-black/[0.06] bg-[linear-gradient(135deg,#ffffff,#f4f8ef)] p-6 shadow-[0_12px_40px_rgba(39,53,30,0.04)] sm:p-8">
        <span className="text-[8px] font-extrabold tracking-[0.18em] text-[#699549]">
          {copy.welcome}
        </span>

        <h2 className="mt-3 text-[30px] font-black tracking-[-0.055em] text-[#171b15] sm:text-[38px]">
          {copy.title}
        </h2>

        <p className="mt-3 max-w-[650px] text-[10.5px] leading-6 text-black/42">
          {copy.description}
        </p>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {cards.map(
          (card) => (
            <article
              key={
                card.title
              }
              className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_28px_rgba(37,50,29,0.03)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf5e7] text-[#56813a]">
                <span className="h-5 w-5">
                  {card.icon}
                </span>
              </span>

              <h3 className="mt-5 text-[14px] font-bold text-[#20251d]">
                {card.title}
              </h3>

              <p className="mt-2 min-h-[48px] text-[9.5px] leading-5 text-black/38">
                {
                  card.description
                }
              </p>

              <div className="mt-5 border-t border-black/[0.055] pt-4">
                <span className="text-[7.5px] font-extrabold tracking-[0.13em] text-[#759d56]">
                  {copy.next}
                </span>

                <p className="mt-1 text-[8.5px] text-black/30">
                  {copy.empty}
                </p>
              </div>
            </article>
          ),
        )}
      </section>
    </AdminShell>
  );
}