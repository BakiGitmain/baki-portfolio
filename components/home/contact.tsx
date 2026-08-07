"use client";

import {
  useState,
  type FormEvent,
} from "react";

import { useLanguage } from "@/components/providers/language-provider";

import { contactConfig } from "@/lib/contact";

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
        strokeWidth="1.7"
      />

      <path
        d="M4 7L12 13L20 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4C7 4 3 7.4 3 11.5C3 13.8 4.2 15.9 6.2 17.3L5 21L9.2 18.9C10.1 19.1 11 19.3 12 19.3C17 19.3 21 15.9 21 11.5C21 7.4 17 4 12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 21C12 21 19 15.6 19 9.5C19 5.9 15.9 3 12 3C8.1 3 5 5.9 5 9.5C5 15.6 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="9.5"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 7V12L15.5 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 3L10 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M21 3L14 21L10 14L3 10L21 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ContactCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
};

function ContactCard({
  icon,
  title,
  value,
  href,
}: ContactCardProps) {
  const content = (
    <>
      <span className="contact-method-icon">
        {icon}
      </span>

      <span className="contact-method-copy">
        <strong>
          {title}
        </strong>

        <span>
          {value}
        </span>
      </span>

      {href && (
        <span className="contact-method-arrow">
          ↗
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={
          href.startsWith("http")
            ? "_blank"
            : undefined
        }
        rel={
          href.startsWith("http")
            ? "noreferrer"
            : undefined
        }
        className="contact-method-card"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="contact-method-card">
      {content}
    </div>
  );
}

export default function ContactSection() {
  const { language } =
    useLanguage();

  const [
    status,
    setStatus,
  ] = useState("");

  const copy =
    language === "am"
      ? {
          eyebrow:
            "GET IN TOUCH",

          titleStart:
            "ስለ",

          titleAccent:
            "ፕሮጀክትዎ",

          titleEnd:
            "እንነጋገር።",

          description:
            "Idea ወይም project ካለዎት formውን ይሙሉ። ስለሚፈልጉት solution በዝርዝር እንነጋገራለን።",

          email:
            "Email",

          telegram:
            "Telegram / WhatsApp",

          location:
            "Work Location",

          response:
            "Response Time",

          name:
            "ስምዎ",

          namePlaceholder:
            "ስምዎን ያስገቡ",

          emailLabel:
            "Emailዎ",

          emailPlaceholder:
            "Emailዎን ያስገቡ",

          projectType:
            "Project Type",

          projectPlaceholder:
            "Project type ይምረጡ",

          budget:
            "Budget Range",

          budgetPlaceholder:
            "Budget ይምረጡ",

          message:
            "Message",

          messagePlaceholder:
            "ስለ projectዎ፣ goals እና requirements ይንገሩኝ...",

          send:
            "Send Message",

          configuration:
            "በlib/contact.ts ውስጥ እውነተኛ emailዎን ያስገቡ።",
        }
      : {
          eyebrow:
            "GET IN TOUCH",

          titleStart:
            "Let’s Talk About",

          titleAccent:
            "Your",

          titleEnd:
            "Project.",

          description:
            "Have an idea, redesign or full product in mind? Tell me what you want to build and I’ll get back to you.",

          email:
            "Email",

          telegram:
            "Telegram / WhatsApp",

          location:
            "Work Location",

          response:
            "Response Time",

          name:
            "Your Name",

          namePlaceholder:
            "Enter your name",

          emailLabel:
            "Your Email",

          emailPlaceholder:
            "Enter your email",

          projectType:
            "Project Type",

          projectPlaceholder:
            "Select project type",

          budget:
            "Budget Range",

          budgetPlaceholder:
            "Select budget range",

          message:
            "Message",

          messagePlaceholder:
            "Tell me about your project, goals and any specific requirements...",

          send:
            "Send Message",

          configuration:
            "Add your real email inside lib/contact.ts first.",
        };

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !contactConfig.email ||
      contactConfig.email.includes(
        "YOUR_",
      )
    ) {
      setStatus(
        copy.configuration,
      );

      return;
    }

    const form =
      new FormData(
        event.currentTarget,
      );

    const name =
      String(
        form.get("name") ?? "",
      );

    const email =
      String(
        form.get("email") ?? "",
      );

    const projectType =
      String(
        form.get(
          "projectType",
        ) ?? "",
      );

    const budget =
      String(
        form.get("budget") ?? "",
      );

    const message =
      String(
        form.get("message") ?? "",
      );

    const subject =
      encodeURIComponent(
        `Portfolio inquiry from ${name}`,
      );

    const body =
      encodeURIComponent(
        [
          `Name: ${name}`,
          `Email: ${email}`,
          `Project type: ${projectType}`,
          `Budget: ${budget}`,
          "",
          "Project details:",
          message,
        ].join("\n"),
      );

    window.location.href =
      `mailto:${contactConfig.email}?subject=${subject}&body=${body}`;
  }

  return (
    <section
      id="contact"
      className="contact-section scroll-mt-24"
    >
      <div className="contact-shell">
        <div className="contact-intro">
          <div className="contact-eyebrow">
            <span />

            {copy.eyebrow}
          </div>

          <h2>
            {copy.titleStart}{" "}

            <span>
              {copy.titleAccent}
            </span>{" "}

            {copy.titleEnd}
          </h2>

          <div className="contact-title-line" />

          <p className="contact-description">
            {copy.description}
          </p>

          <div className="contact-method-grid">
            <ContactCard
              icon={
                <MailIcon />
              }
              title={
                copy.email
              }
              value={
                contactConfig.email
              }
              href={
                contactConfig.email.includes(
                  "YOUR_",
                )
                  ? undefined
                  : `mailto:${contactConfig.email}`
              }
            />

            <ContactCard
              icon={
                <ChatIcon />
              }
              title={
                copy.telegram
              }
              value="Telegram / WhatsApp"
              href={
                contactConfig.telegramUrl.includes(
                  "YOUR_",
                )
                  ? undefined
                  : contactConfig.telegramUrl
              }
            />

            <ContactCard
              icon={
                <LocationIcon />
              }
              title={
                copy.location
              }
              value={
                contactConfig.location
              }
            />

            <ContactCard
              icon={
                <ClockIcon />
              }
              title={
                copy.response
              }
              value={
                contactConfig.responseTime
              }
            />
          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="contact-form"
        >
          <div className="contact-form-grid">
            <label className="contact-field">
              <span>
                {copy.name}
              </span>

              <input
                name="name"
                required
                autoComplete="name"
                placeholder={
                  copy.namePlaceholder
                }
              />
            </label>

            <label className="contact-field">
              <span>
                {
                  copy.emailLabel
                }
              </span>

              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={
                  copy.emailPlaceholder
                }
              />
            </label>

            <label className="contact-field">
              <span>
                {
                  copy.projectType
                }
              </span>

              <select
                name="projectType"
                required
                defaultValue=""
              >
                <option
                  value=""
                  disabled
                >
                  {
                    copy.projectPlaceholder
                  }
                </option>

                <option value="Full-stack website">
                  Full-stack Website
                </option>

                <option value="Landing page">
                  Landing Page
                </option>

                <option value="Web application">
                  Web Application
                </option>

                <option value="Admin dashboard">
                  Admin Dashboard
                </option>

                <option value="Redesign">
                  UI/UX Redesign
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </label>

            <label className="contact-field">
              <span>
                {copy.budget}
              </span>

              <select
                name="budget"
                required
                defaultValue=""
              >
                <option
                  value=""
                  disabled
                >
                  {
                    copy.budgetPlaceholder
                  }
                </option>

                <option value="Starter">
                  Starter Project
                </option>

                <option value="Standard">
                  Standard Project
                </option>

                <option value="Advanced">
                  Advanced Project
                </option>

                <option value="Discuss">
                  Let&apos;s Discuss
                </option>
              </select>
            </label>
          </div>

          <label className="contact-field contact-field--message">
            <span>
              {copy.message}
            </span>

            <textarea
              name="message"
              required
              rows={7}
              placeholder={
                copy.messagePlaceholder
              }
            />
          </label>

          <button
            type="submit"
            className="contact-submit"
          >
            <span>
              <SendIcon />
            </span>

            {
              copy.send
            }
          </button>

          {status && (
            <p
              role="status"
              className="contact-status"
            >
              {status}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}