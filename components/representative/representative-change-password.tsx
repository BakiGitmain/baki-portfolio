"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  changeRepresentativePassword,
  getCurrentRepresentative,
  type RepresentativeUser,
} from "@/lib/representative-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.5 16.2 19.3 12 21C7.8 19.3 5 15.5 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7.5C8 5.3 9.8 3.5 12 3.5C14.2 3.5 16 5.3 16 7.5V10"
        stroke="currentColor"
        strokeWidth="1.7"
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
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RepresentativeChangePassword() {
  const router =
    useRouter();

  const {
    language,
  } =
    useLanguage();

  const [
    user,
    setUser,
  ] =
    useState<
      RepresentativeUser |
      null
    >(null);

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");

  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    checking,
    setChecking,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     COPY
     ======================================================= */

  const copy =
    language ===
    "am"
      ? {
          eyebrow:
            "ACCOUNT SECURITY",

          firstTitle:
            "Passwordዎን ይፍጠሩ።",

          firstDescription:
            "ከመጀመሪያው login በኋላ የራስዎን password ይፍጠሩ። ቢያንስ 6 characters ብቻ ያስፈልጋል።",

          normalTitle:
            "Password ይቀይሩ።",

          normalDescription:
            "አዲስ password ለaccountዎ ያዘጋጁ።",

          current:
            "Current Password",

          newPassword:
            "New Password",

          confirm:
            "Confirm Password",

          placeholder:
            "ቢያንስ 6 characters",

          confirmPlaceholder:
            "Passwordዎን እንደገና ያስገቡ",

          save:
            "Save Password",

          saving:
            "Saving...",

          minimum:
            "Minimum 6 characters",

          mismatch:
            "Passwords አይመሳሰሉም።",

          short:
            "Password ቢያንስ 6 characters መሆን አለበት።",

          currentRequired:
            "Current passwordዎን ያስገቡ።",
        }
      : {
          eyebrow:
            "ACCOUNT SECURITY",

          firstTitle:
            "Create your password.",

          firstDescription:
            "Set your own password before entering the Partner Portal. It only needs to be at least 6 characters.",

          normalTitle:
            "Change your password.",

          normalDescription:
            "Choose a new password for your representative account.",

          current:
            "Current Password",

          newPassword:
            "New Password",

          confirm:
            "Confirm Password",

          placeholder:
            "At least 6 characters",

          confirmPlaceholder:
            "Enter the password again",

          save:
            "Save Password",

          saving:
            "Saving...",

          minimum:
            "Minimum 6 characters",

          mismatch:
            "The passwords do not match.",

          short:
            "Password must be at least 6 characters.",

          currentRequired:
            "Enter your current password.",
        };

  /* =======================================================
     LOAD SESSION
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      void getCurrentRepresentative()
        .then(
          (
            currentUser,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            if (
              !currentUser
            ) {
              router.replace(
                "/login",
              );

              return;
            }

            setUser(
              currentUser,
            );

            setChecking(
              false,
            );
          },
        )
        .catch(
          () => {
            if (
              cancelled
            ) {
              return;
            }

            router.replace(
              "/login",
            );
          },
        );

      return () => {
        cancelled =
          true;
      };
    },
    [
      router,
    ],
  );

  /* =======================================================
     MODE

     TRUE:
     user logged in using default 1234.
     We do NOT ask for current password again.

     FALSE:
     normal password change from account settings.
     ======================================================= */

  const firstTimeSetup =
    Boolean(
      user?.mustChangePassword,
    );

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    if (
      !firstTimeSetup &&
      !currentPassword
    ) {
      setError(
        copy.currentRequired,
      );

      return;
    }

    if (
      newPassword.length <
      6
    ) {
      setError(
        copy.short,
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        copy.mismatch,
      );

      return;
    }

    setSaving(
      true,
    );

    setError(
      "",
    );

    try {
      await changeRepresentativePassword(
        newPassword,

        firstTimeSetup
          ? undefined
          : currentPassword,
      );

      router.replace(
        "/representative/dashboard",
      );

      router.refresh();
    } catch (
      changeError
    ) {
      setError(
        changeError instanceof
          Error
          ? changeError.message
          : "Unable to change password.",
      );

      setSaving(
        false,
      );
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    checking ||
    !user
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </main>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      className="
        relative

        flex
        min-h-screen
        items-center
        justify-center

        overflow-hidden

        bg-[#f7f8f3]

        px-4
        py-12
      "
    >
      {/* =================================================
          BACKGROUND
          ================================================= */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-330px] h-[680px] w-[950px] -translate-x-1/2 rounded-full bg-[#a4d66e]/15 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(66,108,43,0.17) 0.7px, transparent 0.7px)",

            backgroundSize:
              "27px 27px",

            maskImage:
              "linear-gradient(to bottom, black, transparent 78%)",
          }}
        />
      </div>

      {/* =================================================
          CARD
          ================================================= */}

      <section
        className="
          relative

          w-full
          max-w-[500px]

          rounded-[30px]

          border
          border-black/[0.055]

          bg-white/[0.95]

          p-6

          shadow-[0_35px_100px_rgba(38,52,29,0.1)]

          backdrop-blur-xl

          sm:p-8
        "
      >
        {/* ICON */}

        <span
          className="
            flex
            h-14
            w-14
            items-center
            justify-center

            rounded-[18px]

            border
            border-[#78ad54]/15

            bg-[#edf5e7]

            text-[#426c2b]

            shadow-[0_8px_24px_rgba(66,108,43,0.08)]
          "
        >
          <span className="h-6 w-6">
            <ShieldIcon />
          </span>
        </span>

        {/* HEADER */}

        <span className="mt-6 block text-[7px] font-extrabold uppercase tracking-[0.18em] text-[#659345]">
          {
            copy.eyebrow
          }
        </span>

        <h1 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-[#171b15]">
          {firstTimeSetup
            ? copy.firstTitle
            : copy.normalTitle}
        </h1>

        <p className="mt-3 max-w-[420px] text-[9.5px] leading-6 text-black/42">
          {firstTimeSetup
            ? copy.firstDescription
            : copy.normalDescription}
        </p>

        {/* ACCOUNT */}

        <div className="mt-5 flex items-center justify-between rounded-[15px] border border-black/[0.055] bg-[#fafbf8] px-4 py-3">
          <div>
            <span className="block text-[6px] font-extrabold uppercase tracking-[0.12em] text-black/25">
              Partner
            </span>

            <strong className="mt-1 block text-[9px] font-black text-[#2c3328]">
              {
                user.username
              }
            </strong>
          </div>

          {firstTimeSetup && (
            <span className="rounded-full bg-[#edf5e7] px-3 py-1.5 text-[6px] font-extrabold uppercase tracking-[0.08em] text-[#426c2b]">
              First Login
            </span>
          )}
        </div>

        {/* =================================================
            FORM
            ================================================= */}

        <form
          onSubmit={
            submit
          }
          className="mt-7"
        >
          {/* ===============================================
              CURRENT PASSWORD

              ONLY show this after initial account setup.
              =============================================== */}

          {!firstTimeSetup && (
            <label className="block">
              <span className="mb-2 block text-[8px] font-bold text-black/45">
                {
                  copy.current
                }
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                  <LockIcon />
                </span>

                <input
                  type="password"
                  value={
                    currentPassword
                  }
                  onChange={(
                    event,
                  ) => {
                    setCurrentPassword(
                      event.target.value,
                    );

                    setError(
                      "",
                    );
                  }}
                  autoComplete="current-password"
                  disabled={
                    saving
                  }
                  className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[10px] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
                />
              </div>
            </label>
          )}

          {/* ===============================================
              NEW PASSWORD
              =============================================== */}

          <label
            className={
              firstTimeSetup
                ? "block"
                : "mt-4 block"
            }
          >
            <span className="mb-2 block text-[8px] font-bold text-black/45">
              {
                copy.newPassword
              }
            </span>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                <LockIcon />
              </span>

              <input
                type="password"
                minLength={
                  6
                }
                maxLength={
                  128
                }
                value={
                  newPassword
                }
                onChange={(
                  event,
                ) => {
                  setNewPassword(
                    event.target.value,
                  );

                  setError(
                    "",
                  );
                }}
                placeholder={
                  copy.placeholder
                }
                autoComplete="new-password"
                disabled={
                  saving
                }
                className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[10px] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
              />
            </div>
          </label>

          {/* SIMPLE REQUIREMENT */}

          <div
            className={`
              mt-2.5

              flex
              items-center
              gap-2

              rounded-[10px]

              px-3
              py-2

              text-[7px]
              font-bold

              ${
                newPassword.length >=
                6
                  ? "bg-[#edf5e7] text-[#426c2b]"
                  : "bg-black/[0.025] text-black/30"
              }
            `}
          >
            <span className="h-3.5 w-3.5">
              {newPassword.length >=
              6 ? (
                <CheckIcon />
              ) : (
                <LockIcon />
              )}
            </span>

            {
              copy.minimum
            }
          </div>

          {/* ===============================================
              CONFIRM PASSWORD
              =============================================== */}

          <label className="mt-4 block">
            <span className="mb-2 block text-[8px] font-bold text-black/45">
              {
                copy.confirm
              }
            </span>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                <LockIcon />
              </span>

              <input
                type="password"
                minLength={
                  6
                }
                maxLength={
                  128
                }
                value={
                  confirmPassword
                }
                onChange={(
                  event,
                ) => {
                  setConfirmPassword(
                    event.target.value,
                  );

                  setError(
                    "",
                  );
                }}
                placeholder={
                  copy.confirmPlaceholder
                }
                autoComplete="new-password"
                disabled={
                  saving
                }
                className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[10px] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
              />
            </div>
          </label>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[8.5px] leading-5 text-red-600"
            >
              {
                error
              }
            </div>
          )}

          {/* SAVE */}

          <button
            type="submit"
            disabled={
              saving
            }
            className="
              mt-6

              flex
              h-12
              w-full
              items-center
              justify-center
              gap-2

              rounded-xl

              bg-[#426c2b]

              text-[9.5px]
              font-extrabold
              text-white

              shadow-[0_12px_28px_rgba(66,108,43,0.2)]

              transition

              hover:bg-[#355923]

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />

                {
                  copy.saving
                }
              </>
            ) : (
              <>
                <span className="h-4 w-4">
                  <CheckIcon />
                </span>

                {
                  copy.save
                }
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}