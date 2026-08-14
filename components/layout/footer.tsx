"use client";

import Image from "next/image";

import {
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";

import { contactConfig } from "@/lib/contact";

type SectionId =
  | "home"
  | "about"
  | "projects"
  | "skills"
  | "experience"
  | "contact";

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 7L12 13L20 7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 4L3.7 10.7C2.9 11 2.9 12.1 3.8 12.4L8 13.8L9.7 19C10 19.9 11.1 20 11.5 19.2L21 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 13.8L16.5 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="9"
        width="3"
        height="10"
        rx="1"
        fill="currentColor"
      />

      <circle
        cx="5.5"
        cy="5.5"
        r="1.8"
        fill="currentColor"
      />

      <path
        d="M11 19V9H14V10.5C14.8 9.4 16 8.7 17.5 8.7C20 8.7 21 10.4 21 13V19H18V13.7C18 12.4 17.5 11.5 16.2 11.5C14.8 11.5 14 12.5 14 14V19H11Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11.5C20 16.2 16.2 20 11.5 20C10 20 8.6 19.6 7.4 18.9L4 20L5.1 16.7C4.4 15.5 4 14 4 12.5C4 7.8 7.8 4 12.5 4C16.7 4 20 7.3 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 8.5C9.5 11.7 11.6 13.8 15 14.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Footer() {
  const { language } =
    useLanguage();

  const year =
    new Date().getFullYear();

  const copy =
    language === "am"
      ? {
          description:
            "Modern digital experiences የሚገነባ full-stack developer።",

          navigation:
            "NAVIGATION",

          built:
            "BUILT WITH",

          home:
            "Home",

          about:
            "About",

          projects:
            "Projects",

          skills:
            "Skills",

          experience:
            "Experience",

          contact:
            "Contact",

          rights:
            "All rights reserved.",

          motto:
            "Code. Build. Ship. Repeat.",

          ending:
            "Built with curiosity & caffeine.",
        }
      : {
          description:
            "Full-stack developer crafting modern digital experiences.",

          navigation:
            "NAVIGATION",

          built:
            "BUILT WITH",

          home:
            "Home",

          about:
            "About",

          projects:
            "Projects",

          skills:
            "Skills",

          experience:
            "Experience",

          contact:
            "Contact",

          rights:
            "All rights reserved.",

          motto:
            "Code. Build. Ship. Repeat.",

          ending:
            "Built with curiosity & caffeine.",
        };

  const navigation: {
    id: SectionId;
    label: string;
  }[] = [
    {
      id: "home",
      label: copy.home,
    },

    {
      id: "about",
      label: copy.about,
    },

    {
      id: "projects",
      
      label: copy.projects,
    },

    {
      id: "skills",
      label: copy.skills,
    },

    {
      id: "experience",
      label:
        copy.experience,
    },

    {
      id: "contact",
      label: copy.contact,
    },
  ];

  function scrollToSection(
    sectionId: SectionId,
  ) {
    const section =
      document.getElementById(
        sectionId,
      );

    if (!section) {
      return;
    }

    const top =
      sectionId === "home"
        ? 0
        : section.getBoundingClientRect()
            .top +
          window.scrollY -
          84;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  }

  return (
    <footer className="portfolio-footer">
      <StaggerGroup
        className="footer-shell"
        stagger={0.07}
      >
        <StaggerItem distance={14}>
          <div className="footer-main">
          <div className="footer-brand">
            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "home",
                )
              }
              className="footer-logo"
            >
              BAKI{" "}

              <span>
                &lt;/&gt;
              </span>
            </button>

            <p>
              {copy.description}
            </p>

            <div className="footer-socials">
              {!contactConfig.linkedinUrl.includes(
                "YOUR_",
              ) && (
                <a
                  href={
                    contactConfig.linkedinUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </a>
              )}

              {!contactConfig.telegramUrl.includes(
                "YOUR_",
              ) && (
                <a
                  href={
                    contactConfig.telegramUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telegram"
                >
                  <TelegramIcon />
                </a>
              )}

              {!contactConfig.whatsappUrl.includes(
                "YOUR_",
              ) && (
                <a
                  href={
                    contactConfig.whatsappUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              )}

              {!contactConfig.email.includes(
                "YOUR_",
              ) && (
                <a
                  href={`mailto:${contactConfig.email}`}
                  aria-label="Email"
                >
                  <MailIcon />
                </a>
              )}
            </div>
          </div>

          <div className="footer-navigation">
            <span className="footer-label">
              {
                copy.navigation
              }
            </span>

            <div>
              {navigation.map(
                (item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      scrollToSection(
                        item.id,
                      )
                    }
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="footer-stack">
            <span className="footer-label">
              {copy.built}
            </span>

            <div className="footer-stack-list">
              <span>
                <Image
                  src="/images/stack/nextjs.png"
                  alt=""
                  width={24}
                  height={24}
                />

                Next.js
              </span>

              <span>
                <Image
                  src="/images/stack/typescript.png"
                  alt=""
                  width={24}
                  height={24}
                />

                TypeScript
              </span>

              <span>
                <Image
                  src="/images/stack/tailwind.png"
                  alt=""
                  width={24}
                  height={24}
                />

                Tailwind
              </span>
            </div>
          </div>
          </div>
        </StaggerItem>

        <StaggerItem distance={10}>
          <div className="footer-bottom">
          <p>
            © {year} Baki.{" "}
            {copy.rights}
          </p>

          <p className="footer-motto">
            <span>
              &lt;/&gt;
            </span>

            {copy.motto}
          </p>

          <p className="footer-ending">
            <span />

            {copy.ending}
          </p>
          </div>
        </StaggerItem>
      </StaggerGroup>
    </footer>
  );
}
