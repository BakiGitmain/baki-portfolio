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
  loginAccount,
} from "@/lib/account-auth-api";

import {
  getCurrentAdmin,
} from "@/lib/admin-api";

import {
  getCurrentRepresentative,
} from "@/lib/representative-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.8 16.7 8.3 15 12 15C15.7 15 18.2 16.7 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
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

export default function AccountLogin() {
  const router =
    useRouter();

  const {
    language,
  } =
    useLanguage();

  const [
    username,
    setUsername,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    checking,
    setChecking,
  ] =
    useState(true);

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
            "SECURE ACCOUNT",

          title:
            "እንኳን ደህና መጡ።",

          description:
            "Accountዎን በመጠቀም ይግቡ። Systemው Admin ወይም Partner መሆንዎን ራሱ ያውቃል።",

          username:
            "Username",

          usernamePlaceholder:
            "Username ያስገቡ",

          password:
            "Password",

          passwordPlaceholder:
            "Password ያስገቡ",

          login:
            "Login",

          loggingIn:
            "በመግባት ላይ...",

          secure:
            "Protected account access",

          admin:
            "Admin Dashboard",

          partner:
            "Partner Portal",

          automatic:
            "Automatic role detection",
        }
      : {
          eyebrow:
            "SECURE ACCOUNT",

          title:
            "Welcome back.",

          description:
            "Enter your account credentials. We'll automatically send you to the correct workspace.",

          username:
            "Username",

          usernamePlaceholder:
            "Enter your username",

          password:
            "Password",

          passwordPlaceholder:
            "Enter your password",

          login:
            "Continue",

          loggingIn:
            "Signing in...",

          secure:
            "Protected account access",

          admin:
            "Admin Dashboard",

          partner:
            "Partner Portal",

          automatic:
            "Automatic role detection",
        };

  /* =======================================================
     EXISTING SESSION

     No synchronous state update in the Effect.
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      void Promise.allSettled([
        getCurrentAdmin(),
        getCurrentRepresentative(),
      ]).then(
        (
          results,
        ) => {
          if (
            cancelled
          ) {
            return;
          }

          const [
            adminResult,
            partnerResult,
          ] =
            results;

          const admin =
            adminResult.status ===
              "fulfilled"
              ? adminResult.value
              : null;

          const partner =
            partnerResult.status ===
              "fulfilled"
              ? partnerResult.value
              : null;

          if (
            admin
          ) {
            router.replace(
              "/admin/dashboard",
            );

            return;
          }

          if (
            partner
          ) {
            router.replace(
              partner
                .mustChangePassword
                ? "/representative/change-password"
                : "/representative/dashboard",
            );

            return;
          }

          setChecking(
            false,
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
     LOGIN
     ======================================================= */

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      loading
    ) {
      return;
    }

    const cleanUsername =
      username.trim();

    if (
      !cleanUsername ||
      !password
    ) {
      setError(
        language ===
          "am"
          ? "Username እና password ያስገቡ።"
          : "Enter your username and password.",
      );

      return;
    }

    setLoading(
      true,
    );

    setError(
      "",
    );

    try {
      const result =
        await loginAccount(
          cleanUsername,

          password,
        );

      router.replace(
        result.redirectTo,
      );

      router.refresh();
    } catch (
      loginError
    ) {
      setError(
        loginError instanceof
          Error
          ? loginError.message
          : "Unable to sign in.",
      );

      setLoading(
        false,
      );
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    checking
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </main>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8f3] px-4 py-12">
      {/* BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-320px] h-[650px] w-[920px] -translate-x-1/2 rounded-full bg-[#a5d56e]/15 blur-[135px]" />

        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(66,108,43,0.18) 0.7px, transparent 0.7px)",

            backgroundSize:
              "27px 27px",

            maskImage:
              "linear-gradient(to bottom, black, transparent 78%)",
          }}
        />
      </div>

      {/* CARD */}

      <section className="relative w-full max-w-[460px]">
        {/* LOGO */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/",
            )
          }
          aria-label="Return to homepage"
          className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-[18px] border border-black/[0.06] bg-white text-[14px] font-black text-[#426c2b] shadow-[0_12px_35px_rgba(48,73,34,0.08)] transition hover:-translate-y-1"
        >
          &lt;/&gt;
        </button>

        <div className="rounded-[30px] border border-black/[0.055] bg-white/[0.94] p-6 shadow-[0_35px_100px_rgba(31,47,23,0.1)] backdrop-blur-xl sm:p-8">
          {/* HEADER */}

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#83ba57]/15 bg-[#eef6e8] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#83cc4b] shadow-[0_0_10px_rgba(131,204,75,0.65)]" />

              <span className="text-[7px] font-extrabold uppercase tracking-[0.17em] text-[#608c42]">
                {
                  copy.eyebrow
                }
              </span>
            </div>

            <h1 className="mt-5 text-[34px] font-black tracking-[-0.055em] text-[#171b15]">
              {
                copy.title
              }
            </h1>

            <p className="mx-auto mt-3 max-w-[350px] text-[10px] leading-6 text-black/42">
              {
                copy.description
              }
            </p>
          </div>

          {/* ROLE INFO */}

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] border border-black/[0.05] bg-[#fafbf8] px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf4e3] text-[#426c2b]">
                  <span className="h-3.5 w-3.5">
                    <ShieldIcon />
                  </span>
                </span>

                <strong className="text-[8px] font-extrabold text-[#262b23]">
                  {
                    copy.admin
                  }
                </strong>
              </div>
            </div>

            <div className="rounded-[14px] border border-black/[0.05] bg-[#fafbf8] px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef5e9] text-[#55783e]">
                  <span className="h-3.5 w-3.5">
                    <UserIcon />
                  </span>
                </span>

                <strong className="text-[8px] font-extrabold text-[#262b23]">
                  {
                    copy.partner
                  }
                </strong>
              </div>
            </div>
          </div>

          {/* FORM */}

          <form
            onSubmit={
              submit
            }
            className="mt-6"
          >
            {/* USERNAME */}

            <label className="block">
              <span className="mb-2 block text-[8px] font-bold text-black/45">
                {
                  copy.username
                }
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                  <UserIcon />
                </span>

                <input
                  type="text"
                  value={
                    username
                  }
                  onChange={(
                    event,
                  ) => {
                    setUsername(
                      event.target.value,
                    );

                    setError(
                      "",
                    );
                  }}
                  placeholder={
                    copy.usernamePlaceholder
                  }
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={
                    false
                  }
                  disabled={
                    loading
                  }
                  className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[10px] font-semibold text-[#1d211b] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
                />
              </div>
            </label>

            {/* PASSWORD */}

            <label className="mt-4 block">
              <span className="mb-2 block text-[8px] font-bold text-black/45">
                {
                  copy.password
                }
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                  <LockIcon />
                </span>

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) => {
                    setPassword(
                      event.target.value,
                    );

                    setError(
                      "",
                    );
                  }}
                  placeholder={
                    copy.passwordPlaceholder
                  }
                  autoComplete="current-password"
                  disabled={
                    loading
                  }
                  className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[10px] text-[#1d211b] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
                />
              </div>
            </label>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[8.5px] font-medium leading-5 text-red-600"
              >
                {
                  error
                }
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="group mt-6 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#426c2b] text-[9px] font-extrabold text-white shadow-[0_12px_30px_rgba(66,108,43,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#355923] hover:shadow-[0_16px_35px_rgba(66,108,43,0.25)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {loading
                ? copy.loggingIn
                : copy.login}

              {!loading && (
                <span className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowIcon />
                </span>
              )}
            </button>
          </form>

          {/* SECURITY FOOTER */}

          <div className="mt-6 border-t border-black/[0.055] pt-5">
            <div className="flex items-center justify-center gap-2 text-[7px] font-medium text-black/30">
              <span className="h-3.5 w-3.5 text-[#619047]">
                <CheckIcon />
              </span>

              {
                copy.automatic
              }

              <span className="mx-1 h-1 w-1 rounded-full bg-black/15" />

              <span className="h-3.5 w-3.5 text-[#619047]">
                <LockIcon />
              </span>

              {
                copy.secure
              }
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}