"use client";

import {
  useRouter,
} from "next/navigation";

import {
  useLanguage,
} from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

function ShieldCheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.4 16.3 19.2 12 21C7.7 19.2 5 15.4 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8.8 12.1L10.8 14.1L15.4 9.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 8L12 13L18.5 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
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
        d="M8 12L10.7 14.7L16 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
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
        d="M12 10.5V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="7.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function HireApplicationSuccess({
  email,
  emailSent = true,
}: {
  email:
    string;

  emailSent?:
    boolean;
}) {
  const router =
    useRouter();

  const {
    language,
  } =
    useLanguage();

  const copy =
    language === "am"
      ? {
          eyebrow:
            "ማመልከቻው ተልኳል",

          title:
            "ማመልከቻዎ ደርሷል።",

          description:
            "የSales Partner ማመልከቻዎ በተሳካ ሁኔታ ተቀምጧል። የApplication IDዎን እና የማረጋገጫ መረጃ ወደ emailዎ ልከናል።",

          emailTitle:
            "EMAILዎን ይመልከቱ",

          emailDescription:
            "Application IDዎ እና ቀጣይ መረጃ ወደዚህ email ተልኳል።",

          saved:
            "Application saved",

          sent:
            "Confirmation email sent",

          failed:
            "Email delivery pending",

          wait:
            "አሁን ሌላ application መላክ አያስፈልግዎትም። Applicationዎን እንመረምራለን እና status ሲቀየር email እንልክልዎታለን።",

          missing:
            "Email አላዩም?",

          spam:
            "Spam ወይም Promotions folderዎን ይመልከቱ።",

          button:
            "ወደ Portfolio ተመለስ",
        }
      : {
          eyebrow:
            "APPLICATION SUBMITTED",

          title:
            "Application received.",

          description:
            "Your Sales Partner application was submitted successfully. We sent your application ID and confirmation details to your email.",

          emailTitle:
            "CHECK YOUR EMAIL",

          emailDescription:
            "Your application ID and next steps were sent to this email address.",

          saved:
            "Application saved",

          sent:
            "Confirmation email sent",

          failed:
            "Email delivery pending",

          wait:
            "You don't need to submit another application. We'll review your information and email you when your application status changes.",

          missing:
            "Didn't see the email?",

          spam:
            "Check your Spam or Promotions folder.",

          button:
            "Return to Portfolio",
        };

  return (
    <main
      className="
        relative
        flex
        min-h-[calc(100vh-70px)]
        items-center
        justify-center
        overflow-hidden
        bg-[#f7f8f3]
        px-4
        py-12
        sm:px-6
        lg:py-16
      "
    >
      {/* =================================================
          BACKGROUND DECORATION
          ================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="
            absolute
            left-1/2
            top-[-340px]
            h-[680px]
            w-[900px]
            -translate-x-1/2
            rounded-full
            bg-[#9ed46c]/[0.11]
            blur-[140px]
          "
        />

        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(68,105,45,0.18) 0.75px, transparent 0.75px)",

            backgroundSize:
              "28px 28px",

            maskImage:
              "linear-gradient(to bottom, black, transparent 76%)",
          }}
        />

        <div
          className="
            absolute
            left-[-180px]
            top-[40%]
            h-[420px]
            w-[420px]
            rounded-full
            border
            border-[#5f873f]/[0.08]
          "
        />

        <div
          className="
            absolute
            right-[-240px]
            top-[22%]
            h-[520px]
            w-[520px]
            rounded-full
            border
            border-[#5f873f]/[0.07]
          "
        />
      </div>

      {/* =================================================
          CARD
          ================================================= */}

      <section
        className="
          relative
          z-10
          w-full
          max-w-[650px]
          overflow-hidden
          rounded-[30px]
          border
          border-black/[0.055]
          bg-white/[0.96]
          shadow-[0_35px_100px_rgba(36,54,27,0.10)]
          backdrop-blur-xl
        "
      >
        {/* TOP ACCENT */}

        <div
          className="
            h-[4px]
            w-full
            bg-[linear-gradient(90deg,transparent,#7fb64f,#426c2b,#7fb64f,transparent)]
          "
        />

        <div
          className="
            px-5
            py-8
            sm:px-9
            sm:py-10
            lg:px-12
            lg:py-12
          "
        >
          {/* =================================================
              SUCCESS ICON
              ================================================= */}

          <div className="flex justify-center">
            <span
              className="
                relative
                flex
                h-[76px]
                w-[76px]
                items-center
                justify-center
                rounded-[24px]
                border
                border-[#7ab34e]/15
                bg-[#edf6e6]
                text-[#4b7c2f]
                shadow-[0_12px_28px_rgba(68,108,42,0.10)]
              "
            >
              <span
                aria-hidden="true"
                className="
                  absolute
                  inset-[-8px]
                  rounded-[29px]
                  border
                  border-[#8abb62]/10
                "
              />

              <span className="h-8 w-8">
                <ShieldCheckIcon />
              </span>
            </span>
          </div>

          {/* =================================================
              TITLE
              ================================================= */}

          <div className="mt-7 text-center">
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-[#f3f8ef]
                px-3
                py-1.5
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#79bb49]
                  shadow-[0_0_8px_rgba(121,187,73,0.7)]
                "
              />

              <span
                className="
                  text-[7px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[#5f8d41]
                "
              >
                {
                  copy.eyebrow
                }
              </span>
            </div>

            <h1
              className="
                mt-5
                text-[34px]
                font-black
                tracking-[-0.055em]
                text-[#171b15]
                sm:text-[42px]
              "
            >
              {
                copy.title
              }
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-[510px]
                text-[10px]
                leading-6
                text-black/42
                sm:text-[11px]
              "
            >
              {
                copy.description
              }
            </p>
          </div>

          {/* =================================================
              EMAIL CARD
              ================================================= */}

          <div
            className="
              relative
              mt-8
              overflow-hidden
              rounded-[22px]
              border
              border-[#7fa55e]/15
              bg-[linear-gradient(145deg,#f7faf4,#f1f6ed)]
              px-5
              py-6
              sm:px-7
            "
          >
            {/* BACKGROUND GLOW */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                right-[-45px]
                top-[-55px]
                h-[150px]
                w-[150px]
                rounded-full
                bg-[#9bd26b]/15
                blur-[45px]
              "
            />

            <div className="relative flex flex-col items-center text-center">
              {/* MAIL ICON */}

              <span
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-[14px]
                  border
                  border-[#6f9a50]/15
                  bg-white
                  text-[#426c2b]
                  shadow-[0_8px_20px_rgba(54,84,37,0.07)]
                "
              >
                <span className="h-[19px] w-[19px]">
                  <MailIcon />
                </span>
              </span>

              <span
                className="
                  mt-4
                  text-[7px]
                  font-black
                  uppercase
                  tracking-[0.17em]
                  text-black/30
                "
              >
                {
                  copy.emailTitle
                }
              </span>

              {/* EMAIL */}

              <strong
                className="
                  mt-2
                  max-w-full
                  break-all
                  text-[14px]
                  font-black
                  tracking-[-0.02em]
                  text-[#315520]
                  sm:text-[16px]
                "
              >
                {
                  email ||
                  "—"
                }
              </strong>

              <p
                className="
                  mt-3
                  max-w-[420px]
                  text-[8px]
                  leading-5
                  text-black/34
                  sm:text-[8.5px]
                "
              >
                {
                  copy.emailDescription
                }
              </p>
            </div>
          </div>

          {/* =================================================
              STATUS ROW
              ================================================= */}

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-2.5
              sm:grid-cols-2
            "
          >
            {/* APPLICATION SAVED */}

            <div
              className="
                flex
                items-center
                gap-3
                rounded-[14px]
                border
                border-black/[0.045]
                bg-[#fafbf8]
                px-4
                py-3
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-[10px]
                  bg-[#edf6e7]
                  text-[#4c7b31]
                "
              >
                <span className="h-4 w-4">
                  <CheckIcon />
                </span>
              </span>

              <span
                className="
                  text-[8px]
                  font-extrabold
                  text-[#343a30]
                "
              >
                {
                  copy.saved
                }
              </span>
            </div>

            {/* EMAIL STATUS */}

            <div
              className="
                flex
                items-center
                gap-3
                rounded-[14px]
                border
                border-black/[0.045]
                bg-[#fafbf8]
                px-4
                py-3
              "
            >
              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-[10px]

                  ${
                    emailSent
                      ? "bg-[#edf6e7] text-[#4c7b31]"
                      : "bg-[#fff7e9] text-[#a47925]"
                  }
                `}
              >
                <span className="h-4 w-4">
                  {emailSent ? (
                    <CheckIcon />
                  ) : (
                    <InfoIcon />
                  )}
                </span>
              </span>

              <span
                className="
                  text-[8px]
                  font-extrabold
                  text-[#343a30]
                "
              >
                {emailSent
                  ? copy.sent
                  : copy.failed}
              </span>
            </div>
          </div>

          {/* =================================================
              WAIT MESSAGE
              ================================================= */}

          <div
            className="
              mt-5
              flex
              items-start
              gap-3
              rounded-[15px]
              bg-black/[0.018]
              px-4
              py-4
            "
          >
            <span
              className="
                mt-0.5
                h-4
                w-4
                shrink-0
                text-[#69934b]
              "
            >
              <InfoIcon />
            </span>

            <p
              className="
                text-[8px]
                leading-5
                text-black/38
              "
            >
              {
                copy.wait
              }
            </p>
          </div>

          {/* =================================================
              SPAM NOTE
              ================================================= */}

          {emailSent && (
            <div
              className="
                mt-5
                text-center
              "
            >
              <strong
                className="
                  text-[8px]
                  font-extrabold
                  text-black/45
                "
              >
                {
                  copy.missing
                }
              </strong>

              <span
                className="
                  ml-1
                  text-[8px]
                  text-black/30
                "
              >
                {
                  copy.spam
                }
              </span>
            </div>
          )}

          {/* =================================================
              BUTTON
              ================================================= */}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/",
                )
              }
              className="
                group
                inline-flex
                h-12
                items-center
                justify-center
                gap-2.5
                rounded-[13px]
                bg-[#426c2b]
                px-6
                text-[9px]
                font-extrabold
                text-white
                shadow-[0_12px_28px_rgba(66,108,43,0.22)]
                transition
                duration-300
                hover:-translate-y-0.5
                hover:bg-[#355923]
                hover:shadow-[0_16px_32px_rgba(66,108,43,0.25)]
              "
            >
              {
                copy.button
              }

              <span
                className="
                  h-4
                  w-4
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              >
                <ArrowIcon />
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}