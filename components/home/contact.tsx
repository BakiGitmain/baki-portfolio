"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  m,
} from "motion/react";

import AnimatedHeading from "@/components/motion/animated-heading";
import {
  CONTROLLED_SPRING,
  PREMIUM_EASE,
} from "@/components/motion/motion-config";
import {
  EyebrowAccent,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/reveal";

import { useLanguage } from "@/components/providers/language-provider";

import {
  submitContactInquiry,
  validateContactInquiry,
  type ContactField,
  type ContactInquiryInput,
  type ContactValidationErrors,
} from "@/lib/contact-api";

import { contactConfig } from "@/lib/contact";

/* =========================================================
   ICONS
   ========================================================= */

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

function CheckIcon() {
  return (
    <m.svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      initial={{
        opacity: 0,
        scale: 0.78,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={CONTROLLED_SPRING}
    >
      <m.circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
        initial={{
          pathLength: 0,
        }}
        animate={{
          pathLength: 1,
        }}
        transition={{
          duration: 0.42,
          ease: PREMIUM_EASE,
        }}
      />

      <m.path
        d="M8 12.2L10.7 15L16.3 9.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{
          pathLength: 0,
        }}
        animate={{
          pathLength: 1,
        }}
        transition={{
          delay: 0.16,
          duration: 0.34,
          ease: PREMIUM_EASE,
        }}
      />
    </m.svg>
  );
}

/* =========================================================
   COPY
   ========================================================= */

const CONTACT_COPY = {
  en: {
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

    messaging:
      "Telegram / WhatsApp",

    location:
      "Work Location",

    response:
      "Response Time",

    name:
      "Name",

    namePlaceholder:
      "Enter your name",

    emailLabel:
      "Email",

    emailPlaceholder:
      "Enter your email",

    mobileNumber:
      "Mobile Number",

    mobileNumberPlaceholder:
      "+251...",

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

    sending:
      "Sending...",

    success:
      "Message sent! I’ll get back to you as soon as possible.",

    timeout:
      "Sending took longer than expected. Please try again.",

    deliveryUnavailable:
      "Unable to send your message. Please try again.",

    honeypot:
      "Company website",
  },

  am: {
    eyebrow:
      "ያግኙኝ",

    titleStart:
      "ስለ",

    titleAccent:
      "ፕሮጀክትዎ",

    titleEnd:
      "እንነጋገር።",

    description:
      "የድረ ገጽ ሐሳብ፣ ዳግም ንድፍ ወይም ሙሉ የድር ምርት አለዎት? ምን መገንባት እንደሚፈልጉ ይንገሩኝ፤ በቅርቡ እመልስልዎታለሁ።",

    email:
      "ኢሜይል",

    messaging:
      "ቴሌግራም / ዋትስአፕ",

    location:
      "የሥራ ቦታ",

    response:
      "የምላሽ ጊዜ",

    name:
      "ስም",

    namePlaceholder:
      "ስምዎን ያስገቡ",

    emailLabel:
      "ኢሜይል",

    emailPlaceholder:
      "ኢሜይልዎን ያስገቡ",

    mobileNumber:
      "የሞባይል ቁጥር",

    mobileNumberPlaceholder:
      "+251...",

    projectType:
      "የፕሮጀክት ዓይነት",

    projectPlaceholder:
      "የፕሮጀክት ዓይነት ይምረጡ",

    budget:
      "የበጀት መጠን",

    budgetPlaceholder:
      "የበጀት መጠን ይምረጡ",

    message:
      "መልዕክት",

    messagePlaceholder:
      "ስለፕሮጀክትዎ፣ ግቦቹ እና የሚፈልጉት ነገር ይንገሩኝ...",

    send:
      "መልዕክት ላክ",

    sending:
      "በመላክ ላይ...",

    success:
      "መልዕክትዎ ተልኳል! በተቻለ ፍጥነት እመልስልዎታለሁ።",

    timeout:
      "መላኩ ከተጠበቀው በላይ ጊዜ ወሰደ። እባክዎ እንደገና ይሞክሩ።",

    deliveryUnavailable:
      "መልዕክትዎን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",

    honeypot:
      "የድርጅት ድረ ገጽ",
  },
} as const;

const PROJECT_OPTIONS = {
  en: [
    {
      value:
        "full-stack-website",
      label:
        "Full-stack Website",
    },
    {
      value:
        "landing-page",
      label:
        "Landing Page",
    },
    {
      value:
        "web-application",
      label:
        "Web Application",
    },
    {
      value:
        "admin-dashboard",
      label:
        "Admin Dashboard",
    },
    {
      value:
        "ui-ux-redesign",
      label:
        "UI/UX Redesign",
    },
    {
      value:
        "other",
      label:
        "Other",
    },
  ],

  am: [
    {
      value:
        "full-stack-website",
      label:
        "ሙሉ-ስታክ ድረ ገጽ",
    },
    {
      value:
        "landing-page",
      label:
        "ላንዲንግ ፔጅ",
    },
    {
      value:
        "web-application",
      label:
        "የድር መተግበሪያ",
    },
    {
      value:
        "admin-dashboard",
      label:
        "የአስተዳዳሪ ዳሽቦርድ",
    },
    {
      value:
        "ui-ux-redesign",
      label:
        "የUI/UX ዳግም ንድፍ",
    },
    {
      value:
        "other",
      label:
        "ሌላ",
    },
  ],
} as const;

const BUDGET_OPTIONS = {
  en: [
    {
      value:
        "etb-35000-50000",
      label:
        "ETB 35,000 – 50,000",
    },
    {
      value:
        "etb-50000-80000",
      label:
        "ETB 50,000 – 80,000",
    },
    {
      value:
        "etb-80000-100000-plus",
      label:
        "ETB 80,000 – 100,000+",
    },
    {
      value:
        "discuss",
      label:
        "Let’s Discuss",
    },
  ],

  am: [
    {
      value:
        "etb-35000-50000",
      label:
        "ETB 35,000 – 50,000",
    },
    {
      value:
        "etb-50000-80000",
      label:
        "ETB 50,000 – 80,000",
    },
    {
      value:
        "etb-80000-100000-plus",
      label:
        "ETB 80,000 – 100,000+",
    },
    {
      value:
        "discuss",
      label:
        "እንወያይበት",
    },
  ],
} as const;

const CONTACT_FIELD_ORDER:
  readonly ContactField[] = [
    "name",
    "email",
    "mobileNumber",
    "projectType",
    "budget",
    "message",
  ];

const REQUEST_TIMEOUT_MS =
  15_000;

/* =========================================================
   CONTACT CARDS
   ========================================================= */

type ContactCardProps = {
  icon:
    ReactNode;

  title:
    string;

  value:
    string;

  href?:
    string;
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

  if (
    href
  ) {
    return (
      <a
        href={href}
        target={
          href.startsWith(
            "http",
          )
            ? "_blank"
            : undefined
        }
        rel={
          href.startsWith(
            "http",
          )
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

function isConfiguredPublicValue(
  value:
    string,
) {
  return Boolean(
    value &&
    !value.includes(
      "YOUR_",
    ),
  );
}

/* =========================================================
   FORM
   ========================================================= */

type SubmissionStatus = {
  kind:
    | "submitting"
    | "success"
    | "error";

  message:
    string;
} | null;

export default function ContactSection() {
  const {
    language,
  } =
    useLanguage();

  const copy =
    CONTACT_COPY[
      language
    ];

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<ContactValidationErrors>(
      {},
    );

  const [
    submissionStatus,
    setSubmissionStatus,
  ] =
    useState<SubmissionStatus>(
      null,
    );

  const activeRequest =
    useRef<AbortController | null>(
      null,
    );

  useEffect(
    () => () => {
      activeRequest
        .current
        ?.abort();
    },
    [],
  );

  const isSubmitting =
    submissionStatus
      ?.kind ===
    "submitting";

  const emailConfigured =
    isConfiguredPublicValue(
      contactConfig.email,
    );

  const telegramConfigured =
    isConfiguredPublicValue(
      contactConfig.telegramUrl,
    );

  const whatsappConfigured =
    isConfiguredPublicValue(
      contactConfig.whatsappUrl,
    );

  const messagingHref =
    telegramConfigured
      ? contactConfig
          .telegramUrl
      : whatsappConfigured
        ? contactConfig
            .whatsappUrl
        : undefined;

  function clearFieldError(
    event:
      ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
      >,
  ) {
    const field =
      event.currentTarget
        .name as
        ContactField;

    if (
      !CONTACT_FIELD_ORDER.includes(
        field,
      )
    ) {
      return;
    }

    setFieldErrors(
      (
        current,
      ) => {
        if (
          !current[
            field
          ]
        ) {
          return current;
        }

        const next = {
          ...current,
        };

        delete next[
          field
        ];

        return next;
      },
    );

    if (
      submissionStatus
        ?.kind !==
      "submitting"
    ) {
      setSubmissionStatus(
        null,
      );
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isSubmitting
    ) {
      return;
    }

    const form =
      event.currentTarget;

    const formData =
      new FormData(
        form,
      );

    const input:
      ContactInquiryInput = {
      name:
        String(
          formData.get(
            "name",
          ) ??
            "",
        ),

      email:
        String(
          formData.get(
            "email",
          ) ??
            "",
        ),

      mobileNumber:
        String(
          formData.get(
            "mobileNumber",
          ) ??
            "",
        ),

      projectType:
        String(
          formData.get(
            "projectType",
          ) ??
            "",
        ),

      budget:
        String(
          formData.get(
            "budget",
          ) ??
            "",
        ),

      message:
        String(
          formData.get(
            "message",
          ) ??
            "",
        ),

      companyWebsite:
        String(
          formData.get(
            "companyWebsite",
          ) ??
            "",
        ),
    };

    const errors =
      validateContactInquiry(
        input,
        language,
      );

    if (
      Object.keys(
        errors,
      ).length >
      0
    ) {
      setFieldErrors(
        errors,
      );

      setSubmissionStatus(
        null,
      );

      const firstError =
        CONTACT_FIELD_ORDER
          .find(
            (
              field,
            ) =>
              Boolean(
                errors[
                  field
                ],
              ),
          );

      if (
        firstError
      ) {
        const field =
          form.elements
            .namedItem(
              firstError,
            );

        if (
          field instanceof
            HTMLElement
        ) {
          field.focus();
        }
      }

      return;
    }

    setFieldErrors(
      {},
    );

    setSubmissionStatus({
      kind:
        "submitting",

      message:
        "",
    });

    const controller =
      new AbortController();

    activeRequest.current =
      controller;

    const timeoutId =
      window.setTimeout(
        () => {
          controller.abort();
        },
        REQUEST_TIMEOUT_MS,
      );

    try {
      const message =
        await submitContactInquiry(
          input,
          language,
          controller.signal,
        );

      form.reset();

      setSubmissionStatus({
        kind:
          "success",

        message:
          message ??
          copy.success,
      });
    } catch (
      error
    ) {
      const message =
        controller.signal
          .aborted
          ? copy.timeout
          : error instanceof
                Error &&
              error.message
            ? error.message
            : copy.deliveryUnavailable;

      setSubmissionStatus({
        kind:
          "error",

        message,
      });
    } finally {
      window.clearTimeout(
        timeoutId,
      );

      if (
        activeRequest
          .current ===
        controller
      ) {
        activeRequest.current =
          null;
      }
    }
  }

  return (
    <section
      id="contact"
      className="contact-section scroll-mt-24"
    >
      <div className="contact-shell">
        <div className="contact-intro">
          <Reveal
            direction="right"
            distance={14}
            className="contact-eyebrow"
          >
            <EyebrowAccent shape="dot" />

            {copy.eyebrow}
          </Reveal>

          <AnimatedHeading
            language={language}
            segments={[
              {
                text:
                  `${copy.titleStart} `,
              },
              {
                accent: true,
                text:
                  `${copy.titleAccent} `,
              },
              {
                text:
                  copy.titleEnd,
              },
            ]}
          />

          <Reveal
            direction="right"
            distance={18}
            delay={0.08}
            className="contact-title-line"
          />

          <Reveal
            delay={0.12}
            className="contact-description"
          >
            <p>
              {copy.description}
            </p>
          </Reveal>

          <StaggerGroup
            className="contact-method-grid"
            delay={0.1}
          >
            <StaggerItem distance={16}>
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
                  emailConfigured
                    ? `mailto:${contactConfig.email}`
                    : undefined
                }
              />
            </StaggerItem>

            <StaggerItem distance={20}>
              <ContactCard
                icon={
                  <ChatIcon />
                }
                title={
                  copy.messaging
                }
                value={
                  copy.messaging
                }
                href={
                  messagingHref
                }
              />
            </StaggerItem>

            <StaggerItem distance={24}>
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
            </StaggerItem>

            <StaggerItem distance={28}>
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
            </StaggerItem>
          </StaggerGroup>
        </div>

        <StaggerGroup
          className="min-w-0"
          delay={0.04}
          stagger={0.055}
        >
          <form
            onSubmit={
              handleSubmit
            }
            className="contact-form"
            noValidate
            aria-busy={
              isSubmitting
            }
          >
          <div
            className="contact-honeypot"
            aria-hidden="true"
          >
            <label htmlFor="contact-company-website">
              {copy.honeypot}
            </label>

            <input
              id="contact-company-website"
              name="companyWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              disabled={
                isSubmitting
              }
            />
          </div>

          <div className="contact-form-grid">
            <StaggerItem
              className="contact-field"
              distance={14}
            >
              <label htmlFor="contact-name">
                {copy.name}
              </label>

              <input
                id="contact-name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder={
                  copy.namePlaceholder
                }
                disabled={
                  isSubmitting
                }
                aria-invalid={
                  Boolean(
                    fieldErrors.name,
                  )
                }
                aria-describedby={
                  fieldErrors.name
                    ? "contact-name-error"
                    : undefined
                }
                onChange={
                  clearFieldError
                }
              />

              {fieldErrors.name && (
                <p
                  id="contact-name-error"
                  className="contact-field-error"
                >
                  {fieldErrors.name}
                </p>
              )}
            </StaggerItem>

            <StaggerItem
              className="contact-field"
              distance={16}
            >
              <label htmlFor="contact-email">
                {copy.emailLabel}
              </label>

              <input
                id="contact-email"
                name="email"
                type="email"
                required
                maxLength={254}
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={
                  copy.emailPlaceholder
                }
                disabled={
                  isSubmitting
                }
                aria-invalid={
                  Boolean(
                    fieldErrors.email,
                  )
                }
                aria-describedby={
                  fieldErrors.email
                    ? "contact-email-error"
                    : undefined
                }
                onChange={
                  clearFieldError
                }
              />

              {fieldErrors.email && (
                <p
                  id="contact-email-error"
                  className="contact-field-error"
                >
                  {fieldErrors.email}
                </p>
              )}
            </StaggerItem>

            <StaggerItem
              className="contact-field"
              distance={18}
            >
              <label htmlFor="contact-mobile-number">
                {copy.mobileNumber}
              </label>

              <input
                id="contact-mobile-number"
                name="mobileNumber"
                type="tel"
                required
                maxLength={30}
                inputMode="tel"
                autoComplete="tel"
                placeholder={
                  copy.mobileNumberPlaceholder
                }
                disabled={
                  isSubmitting
                }
                aria-invalid={
                  Boolean(
                    fieldErrors.mobileNumber,
                  )
                }
                aria-describedby={
                  fieldErrors.mobileNumber
                    ? "contact-mobile-number-error"
                    : undefined
                }
                onChange={
                  clearFieldError
                }
              />

              {fieldErrors.mobileNumber && (
                <p
                  id="contact-mobile-number-error"
                  className="contact-field-error"
                >
                  {fieldErrors.mobileNumber}
                </p>
              )}
            </StaggerItem>

            <StaggerItem
              className="contact-field"
              distance={20}
            >
              <label htmlFor="contact-project-type">
                {copy.projectType}
              </label>

              <select
                id="contact-project-type"
                name="projectType"
                required
                defaultValue=""
                disabled={
                  isSubmitting
                }
                aria-invalid={
                  Boolean(
                    fieldErrors
                      .projectType,
                  )
                }
                aria-describedby={
                  fieldErrors
                    .projectType
                    ? "contact-project-type-error"
                    : undefined
                }
                onChange={
                  clearFieldError
                }
              >
                <option
                  value=""
                  disabled
                >
                  {copy.projectPlaceholder}
                </option>

                {PROJECT_OPTIONS[
                  language
                ].map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              {fieldErrors.projectType && (
                <p
                  id="contact-project-type-error"
                  className="contact-field-error"
                >
                  {fieldErrors.projectType}
                </p>
              )}
            </StaggerItem>

            <StaggerItem
              className="contact-field"
              distance={22}
            >
              <label htmlFor="contact-budget">
                {copy.budget}
              </label>

              <select
                id="contact-budget"
                name="budget"
                required
                defaultValue=""
                disabled={
                  isSubmitting
                }
                aria-invalid={
                  Boolean(
                    fieldErrors.budget,
                  )
                }
                aria-describedby={
                  fieldErrors.budget
                    ? "contact-budget-error"
                    : undefined
                }
                onChange={
                  clearFieldError
                }
              >
                <option
                  value=""
                  disabled
                >
                  {copy.budgetPlaceholder}
                </option>

                {BUDGET_OPTIONS[
                  language
                ].map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              {fieldErrors.budget && (
                <p
                  id="contact-budget-error"
                  className="contact-field-error"
                >
                  {fieldErrors.budget}
                </p>
              )}
            </StaggerItem>
          </div>

          <StaggerItem
            className="contact-field contact-field--message"
            distance={24}
          >
            <label htmlFor="contact-message">
              {copy.message}
            </label>

            <textarea
              id="contact-message"
              name="message"
              required
              minLength={20}
              maxLength={3000}
              rows={7}
              placeholder={
                copy.messagePlaceholder
              }
              disabled={
                isSubmitting
              }
              aria-invalid={
                Boolean(
                  fieldErrors.message,
                )
              }
              aria-describedby={
                fieldErrors.message
                  ? "contact-message-error"
                  : undefined
              }
              onChange={
                clearFieldError
              }
            />

            {fieldErrors.message && (
              <p
                id="contact-message-error"
                className="contact-field-error"
              >
                {fieldErrors.message}
              </p>
            )}
          </StaggerItem>

          <StaggerItem distance={26}>
            <m.button
              type="submit"
              className="contact-submit"
              disabled={
                isSubmitting
              }
              whileTap={{
                scale: 0.98,
              }}
              transition={CONTROLLED_SPRING}
            >
              <span
                className={
                  isSubmitting
                    ? "contact-submit-spinner"
                    : undefined
                }
              >
                {!isSubmitting && (
                  <SendIcon />
                )}
              </span>

              {isSubmitting
                ? copy.sending
                : copy.send}
            </m.button>
          </StaggerItem>

          <div
            className="contact-status-region"
            aria-live="polite"
            aria-atomic="true"
          >
            <AnimatePresence
              initial={false}
              mode="wait"
            >
              {submissionStatus &&
                submissionStatus.kind !==
                  "submitting" && (
                  <m.p
                    key={`${submissionStatus.kind}-${submissionStatus.message}`}
                    role="status"
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -4,
                    }}
                    transition={{
                      duration: 0.32,
                      ease: PREMIUM_EASE,
                    }}
                    className={`contact-status contact-status--${submissionStatus.kind}`}
                  >
                    {submissionStatus.kind ===
                      "success" && (
                      <span className="contact-status-icon">
                        <CheckIcon />
                      </span>
                    )}

                    <span>
                      {submissionStatus.message}
                    </span>
                  </m.p>
                )}
            </AnimatePresence>
          </div>
          </form>
        </StaggerGroup>
      </div>
    </section>
  );
}
