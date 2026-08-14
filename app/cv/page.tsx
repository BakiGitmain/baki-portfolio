import type {
  Metadata,
} from "next";

import Link from "next/link";

import CvActions from "@/components/cv/cv-actions";
import {
  cvData,
} from "@/lib/cv-data";

import styles from "./cv.module.css";

export const metadata:
  Metadata = {
    title: {
      absolute:
        "Eyosiyas Daniel — Full-Stack Web Developer CV",
    },

    description:
      "Professional CV for Eyosiyas Daniel, a full-stack web developer known as Baki.",
  };

function SectionHeading({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3">
      <h2 className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#426c2b]">
        {children}
      </h2>

      <span className="h-px flex-1 bg-[#dfe7da]" />
    </div>
  );
}

export default function CvPage() {
  const contactItems = [
    {
      label:
        cvData.contact
          .portfolioLabel,
      href:
        cvData.contact
          .portfolioUrl,
    },
    cvData.contact.email
      ? {
          label:
            cvData.contact.email,
          href:
            `mailto:${cvData.contact.email}`,
        }
      : null,
    {
      label:
        cvData.contact
          .phoneLabel,
      href:
        cvData.contact
          .phoneUrl,
    },
    {
      label:
        cvData.contact
          .location,
      href:
        null,
    },
  ].filter(
    (
      item,
    ): item is {
      label:
        string;
      href:
        string | null;
    } =>
      Boolean(
        item,
      ),
  );

  return (
    <main className={styles.page}>
      <CvActions
        className={
          styles.actions
        }
      />

      <article className={styles.sheet}>
        <header className="border-b border-[#dfe7da] pb-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5c7650]">
                {cvData.identity.brand}
              </p>

              <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.045em] text-[#171b15] sm:text-[42px]">
                {cvData.identity.fullName}
              </h1>

              <p className="mt-2 text-[16px] font-semibold text-[#426c2b]">
                {cvData.identity.title}
              </p>

              <p className="mt-1 text-[11px] text-black/45">
                Known professionally as {cvData.identity.knownAs}
              </p>
            </div>

            <Link
              href="/"
              className="w-fit rounded-full border border-[#426c2b]/15 bg-[#f1f6ed] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#426c2b] print:hidden"
            >
              Back to portfolio
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-medium text-[#4d5648]">
            {contactItems.map(
              (
                item,
                index,
              ) => (
                <span
                  key={
                    item.label
                  }
                  className="flex items-center gap-4"
                >
                  {index >
                    0 && (
                    <span
                      className="text-[#93ad83]"
                      aria-hidden="true"
                    >
                      / 
                    </span>
                  )}

                  {item.href
                    ? (
                        <a
                          href={
                            item.href
                          }
                          className="underline decoration-[#8fbf69]/45 underline-offset-2"
                        >
                          {item.label}
                        </a>
                      )
                    : item.label}
                </span>
              ),
            )}
          </div>
        </header>

        <section>
          <SectionHeading>
            Profile
          </SectionHeading>

          <p className="text-[12px] leading-[1.75] text-[#3f493b]">
            {cvData.summary}
          </p>

          <div className="mt-4 grid overflow-hidden rounded-xl border border-[#dfe7da] bg-[#f7faf5] sm:grid-cols-3">
            {cvData.highlights.map(
              (
                item,
                index,
              ) => (
                <div
                  key={
                    item.label
                  }
                  className={`px-4 py-3 ${
                    index >
                      0
                      ? "border-t border-[#dfe7da] sm:border-l sm:border-t-0"
                      : ""
                  }`}
                >
                  <strong className="block text-[15px] text-[#315a1f]">
                    {item.value}
                  </strong>

                  <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.08em] text-[#65705f]">
                    {item.label}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>

        <section>
          <SectionHeading>
            Technical Skills
          </SectionHeading>

          <div className="space-y-2">
            {cvData.skills.map(
              (
                group,
              ) => (
                <div
                  key={
                    group.category
                  }
                  className="grid grid-cols-1 gap-0.5 text-[11px] leading-5 sm:grid-cols-[110px_1fr] sm:gap-3"
                >
                  <h3 className="font-bold text-[#253020]">
                    {group.category}
                  </h3>

                  <p className="text-[#50594c]">
                    {group.items.join(
                      "  /  ",
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        <section className={styles.avoidBreak}>
          <SectionHeading>
            Development Experience
          </SectionHeading>

          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
            <h3 className="text-[13px] font-bold text-[#20271d]">
              {cvData.developmentBackground.title}
            </h3>

            <span className="text-[10px] font-bold uppercase tracking-[0.11em] text-[#56803d]">
              {cvData.developmentBackground.duration}
            </span>
          </div>

          <ul className="mt-2 space-y-1.5 pl-4 text-[11px] leading-[1.55] text-[#4b5547] marker:text-[#79a75b]">
            {cvData.developmentBackground.bullets.map(
              (
                bullet,
              ) => (
                <li key={bullet}>
                  {bullet}
                </li>
              ),
            )}
          </ul>
        </section>

        <section>
          <SectionHeading>
            Selected Projects
          </SectionHeading>

          <div className="space-y-4">
            {cvData.projects.map(
              (
                project,
              ) => (
                <article
                  key={
                    project.name
                  }
                  className={`${styles.avoidBreak} border-l-2 border-[#8fbd6e] pl-3.5`}
                >
                  <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="text-[13px] font-extrabold text-[#1c2319]">
                        {project.name}
                      </h3>

                      <span className="text-[10px] font-semibold text-[#62705c]">
                        {project.type}
                      </span>
                    </div>

                    <a
                      href={
                        project.url
                      }
                      className="shrink-0 text-[10px] font-semibold text-[#426c2b] underline decoration-[#8fbf69]/50 underline-offset-2"
                    >
                      {project.urlLabel}
                    </a>
                  </div>

                  <p className="mt-1 text-[10.5px] leading-[1.55] text-[#4d5749]">
                    {project.description}
                  </p>

                  <p className="mt-1 text-[9.5px] font-semibold leading-4 text-[#65705f]">
                    {project.technologies.join(
                      "  /  ",
                    )}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        {cvData.education.length >
          0 && (
          <section>
            <SectionHeading>
              Education
            </SectionHeading>

            <div />
          </section>
        )}

        <footer className="mt-6 flex flex-col justify-between gap-2 border-t border-[#dfe7da] pt-3 text-[10px] text-[#65705f] sm:flex-row sm:items-center">
          <p>
            <strong className="text-[#33422d]">
              Languages:
            </strong>{" "}
            {cvData.languages.join(
              " / ",
            )}
          </p>

          <p className="font-semibold text-[#426c2b]">
            {cvData.identity.brand}
          </p>
        </footer>
      </article>
    </main>
  );
}
