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
  getCurrentRepresentative,
  loginRepresentative,
  RepresentativeApiError,
} from "@/lib/representative-api";

import RepresentativeSuspendedScreen, {
  type RepresentativeSuspension,
} from "@/components/representative/representative-suspended-screen";

import {
  useLanguage,
} from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

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

/* =========================================================
   LOGIN
   ========================================================= */

export default function RepresentativeLogin() {
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

  const [suspension, setSuspension] = useState<RepresentativeSuspension | null>(null);

  const copy =
    language ===
    "am"
      ? {
          eyebrow:
            "REPRESENTATIVE PORTAL",

          title:
            "እንኳን ደህና መጡ።",

          description:
            "የSales Representative username እና passwordዎን በመጠቀም ይግቡ።",

          username:
            "Representative Username",

          usernamePlaceholder:
            "PS-1001",

          password:
            "Password",

          passwordPlaceholder:
            "Passwordዎን ያስገቡ",

          login:
            "ወደ Portal ግባ",

          loading:
            "በመግባት ላይ...",

          security:
            "Secure representative access",
        }
      : {
          eyebrow:
            "REPRESENTATIVE PORTAL",

          title:
            "Welcome back.",

          description:
            "Sign in with your Sales Representative credentials to access your private workspace.",

          username:
            "Representative Username",

          usernamePlaceholder:
            "PS-1001",

          password:
            "Password",

          passwordPlaceholder:
            "Enter your password",

          login:
            "Continue to Portal",

          loading:
            "Signing in...",

          security:
            "Secure representative access",
        };

  /* =======================================================
     EXISTING SESSION
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      void getCurrentRepresentative()
        .then(
          (
            user,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            if (
              user
            ) {
              router.replace(
                user
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
        )
        .catch(
          (sessionError) => {
            if (
              !cancelled
            ) {
              if (
                sessionError instanceof RepresentativeApiError &&
                sessionError.code === "ACCOUNT_SUSPENDED" &&
                sessionError.suspension
              ) {
                setSuspension(sessionError.suspension);
              }

              setChecking(
                false,
              );
            }
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

    if (
      !username.trim() ||
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
        await loginRepresentative(
          username.trim(),

          password,
        );

      router.replace(
        result.redirectTo,
      );

      router.refresh();
    } catch (
      loginError
    ) {
      if (
        loginError instanceof RepresentativeApiError &&
        loginError.code === "ACCOUNT_SUSPENDED" &&
        loginError.suspension
      ) {
        setSuspension(loginError.suspension);
        setLoading(false);
        return;
      }

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

  if (
    checking
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f3]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </main>
    );
  }

  if (suspension) {
    return (
      <RepresentativeSuspendedScreen
        suspension={suspension}
        language={language}
        onLogout={() => {
          setSuspension(null);
          setPassword("");
        }}
      />
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8f3] px-4 py-12">
      {/* BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-300px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-[#a6d66d]/15 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(66,108,43,0.18) 0.7px, transparent 0.7px)",

            backgroundSize:
              "27px 27px",

            maskImage:
              "linear-gradient(to bottom, black, transparent 80%)",
          }}
        />
      </div>

      <section className="relative w-full max-w-[450px]">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/",
            )
          }
          className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-[14px] font-black text-[#426c2b] shadow-[0_10px_30px_rgba(48,73,34,0.07)]"
        >
          &lt;/&gt;
        </button>

        <div className="rounded-[30px] border border-black/[0.055] bg-white/92 p-6 shadow-[0_30px_90px_rgba(38,52,29,0.09)] backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6e7] px-3 py-1.5 text-[7.5px] font-extrabold tracking-[0.16em] text-[#618c42]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9bdd4c]" />

              {
                copy.eyebrow
              }
            </div>

            <h1 className="mt-5 text-[34px] font-black tracking-[-0.055em] text-[#171b15]">
              {
                copy.title
              }
            </h1>

            <p className="mx-auto mt-3 max-w-[340px] text-[10px] leading-6 text-black/42">
              {
                copy.description
              }
            </p>
          </div>

          <form
            onSubmit={
              submit
            }
            className="mt-8"
          >
            <label className="block">
              <span className="mb-2 block text-[8.5px] font-bold text-black/45">
                {
                  copy.username
                }
              </span>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/25">
                  <UserIcon />
                </span>

                <input
                  value={
                    username
                  }
                  onChange={(
                    event,
                  ) => {
                    setUsername(
                      event.target
                        .value,
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
                  className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[11px] font-semibold uppercase text-[#1d211b] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
                />
              </div>
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[8.5px] font-bold text-black/45">
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
                      event.target
                        .value,
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
                  className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] pl-11 pr-4 text-[11px] text-[#1d211b] outline-none transition focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
                />
              </div>
            </label>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[9px] font-medium leading-5 text-red-600"
              >
                {
                  error
                }
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading
              }
              className="group mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#426c2b] text-[10px] font-extrabold text-white shadow-[0_12px_28px_rgba(66,108,43,0.2)] transition hover:-translate-y-0.5 hover:bg-[#355923] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? copy.loading
                : copy.login}

              {!loading && (
                <span className="h-4 w-4 transition-transform group-hover:translate-x-1">
                  <ArrowIcon />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-black/[0.05] pt-5 text-[8px] font-medium text-black/30">
            <span className="h-4 w-4 text-[#648c48]">
              <LockIcon />
            </span>

            {
              copy.security
            }
          </div>
        </div>
      </section>
    </main>
  );
}
