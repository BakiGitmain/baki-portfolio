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
  getCurrentAdmin,
  loginAdmin,
} from "@/lib/admin-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

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
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="15"
        r="1.2"
        fill="currentColor"
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

export default function AdminLogin() {
  const router =
    useRouter();

  const {
    language,
  } = useLanguage();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checking,
    setChecking,
  ] = useState(true);

  const copy =
    language === "am"
      ? {
          eyebrow:
            "የአስተዳዳሪ መግቢያ",

          title:
            "እንኳን ደህና መጡ።",

          description:
            "የአስተዳዳሪ መለያዎን በመጠቀም ወደ dashboard ይግቡ።",

          username:
            "የተጠቃሚ ስም",

          usernamePlaceholder:
            "Username",

          password:
            "የይለፍ ቃል",

          passwordPlaceholder:
            "Password",

          login:
            "ወደ Dashboard ግባ",

          loggingIn:
            "በመግባት ላይ...",

          secure:
            "የተጠበቀ የአስተዳዳሪ ክፍል",

          defaultError:
            "መግባት አልተቻለም።",
        }
      : {
          eyebrow:
            "ADMIN ACCESS",

          title:
            "Welcome back.",

          description:
            "Sign in with your administrator account to access the dashboard.",

          username:
            "Username",

          usernamePlaceholder:
            "Enter your username",

          password:
            "Password",

          passwordPlaceholder:
            "Enter your password",

          login:
            "Continue to Dashboard",

          loggingIn:
            "Signing in...",

          secure:
            "Secure administrator area",

          defaultError:
            "Unable to sign in.",
        };

  useEffect(
    () => {
      let cancelled =
        false;

      async function checkExistingSession() {
        const admin =
          await getCurrentAdmin();

        if (cancelled) {
          return;
        }

        if (admin) {
          router.replace(
            "/admin/dashboard",
          );

          return;
        }

        setChecking(false);
      }

      void checkExistingSession();

      return () => {
        cancelled = true;
      };
    },
    [router],
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (
      !username.trim() ||
      !password
    ) {
      setError(
        language === "am"
          ? "Username እና password ያስገቡ።"
          : "Enter your username and password.",
      );

      return;
    }

    setLoading(true);

    try {
      const result =
        await loginAdmin(
          username.trim(),
          password,
        );

      router.replace(
        result.redirectTo ||
          "/admin/dashboard",
      );
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : copy.defaultError,
      );

      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f4]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f8f4] px-4 py-12">
      {/* BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#a7d86f]/15 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(66,108,43,0.18) 0.7px, transparent 0.7px)",

            backgroundSize:
              "26px 26px",

            maskImage:
              "linear-gradient(to bottom, black, transparent 75%)",
          }}
        />
      </div>

      {/* CARD */}

      <section className="relative w-full max-w-[430px]">
        {/* LOGO */}

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-[14px] font-black text-[#426c2b] shadow-[0_10px_30px_rgba(48,73,34,0.07)] transition-transform duration-300 hover:-translate-y-1"
        >
          &lt;/&gt;
        </button>

        <div className="rounded-[28px] border border-black/[0.06] bg-white/90 p-6 shadow-[0_25px_70px_rgba(38,52,29,0.08)] backdrop-blur-xl sm:p-8">
          {/* HEADER */}

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef6e7] px-3 py-1.5 text-[8px] font-extrabold tracking-[0.16em] text-[#618c42]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9bdd4c]" />

              {copy.eyebrow}
            </div>

            <h1 className="mt-5 text-[34px] font-black tracking-[-0.055em] text-[#171b15]">
              {copy.title}
            </h1>

            <p className="mx-auto mt-3 max-w-[330px] text-[10.5px] leading-6 text-black/45">
              {
                copy.description
              }
            </p>
          </div>

          {/* FORM */}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8"
          >
            <label className="block">
              <span className="mb-2 block text-[9px] font-bold text-black/50">
                {copy.username}
              </span>

              <input
                type="text"
                value={username}
                onChange={(
                  event,
                ) =>
                  setUsername(
                    event.target
                      .value,
                  )
                }
                placeholder={
                  copy.usernamePlaceholder
                }
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[11px] text-[#1d211b] outline-none transition-all duration-200 placeholder:text-black/25 focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[9px] font-bold text-black/50">
                {copy.password}
              </span>

              <input
                type="password"
                value={password}
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                placeholder={
                  copy.passwordPlaceholder
                }
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[11px] text-[#1d211b] outline-none transition-all duration-200 placeholder:text-black/25 focus:border-[#75a652]/40 focus:bg-white focus:ring-4 focus:ring-[#75a652]/[0.07]"
              />
            </label>

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/10 bg-red-50 px-4 py-3 text-[9.5px] font-medium leading-5 text-red-600">
                {error}
              </div>
            )}

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="group mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#426c2b] px-5 text-[10.5px] font-bold text-white shadow-[0_12px_28px_rgba(66,108,43,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#355923] disabled:cursor-not-allowed disabled:opacity-60"
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

          {/* SECURITY */}

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-black/[0.05] pt-5 text-[8.5px] font-medium text-black/30">
            <span className="h-4 w-4 text-[#648c48]">
              <LockIcon />
            </span>

            {copy.secure}
          </div>
        </div>
      </section>
    </main>
  );
}