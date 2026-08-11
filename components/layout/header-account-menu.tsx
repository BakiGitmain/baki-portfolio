"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getCurrentAdmin,
  logoutAdmin,
  type AdminUser,
} from "@/lib/admin-api";

import {
  getCurrentRepresentative,
  logoutRepresentative,
  type RepresentativeUser,
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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 8L10 12L14 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="3.5"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="13.5"
        y="3.5"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3.5"
        y="13.5"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="13.5"
        y="13.5"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PartnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 12.5L10.2 15.7C11.2 16.7 12.8 16.7 13.8 15.7L19 10.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M3.5 9L7.5 5L11 8.5M20.5 9L16.5 5L13 8.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 12L11 9.5C11.8 8.7 13.2 8.7 14 9.5L15.5 11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 5H19V19H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M10 8L14 12L10 16M4 12H14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 5H5V19H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M14 8L18 12L14 16M8 12H18"
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

/* =========================================================
   COMPONENT
   ========================================================= */

export default function HeaderAccountMenu() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    language,
  } =
    useLanguage();

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    admin,
    setAdmin,
  ] =
    useState<AdminUser | null>(
      null,
    );

  const [
    partner,
    setPartner,
  ] =
    useState<RepresentativeUser | null>(
      null,
    );

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    checking,
    setChecking,
  ] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
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
    language === "am"
      ? {
          account:
            "Account",

          login:
            "ግባ",

          loginTitle:
            "ወደ account ይግቡ",

          loginDescription:
            "Login ካደረጉ በኋላ Admin ወይም Partner መሆንዎን systemው ራሱ ያውቃል።",

          continueLogin:
            "Login",

          accountTypes:
            "Admin እና Partner accounts",

          admin:
            "Admin",

          adminDashboard:
            "Admin Dashboard",

          partner:
            "Partner",

          partnerPortal:
            "Partner Portal",

          finishSetup:
            "Account Setup ጨርስ",

          signedIn:
            "Logged in",

          logout:
            "Logout",

          loggingOut:
            "Logging out...",

          secure:
            "Secure account access",
        }
      : {
          account:
            "Account",

          login:
            "Login",

          loginTitle:
            "Sign in to your account",

          loginDescription:
            "Enter your credentials once. We'll automatically open the correct workspace.",

          continueLogin:
            "Continue to Login",

          accountTypes:
            "Admin & Partner accounts",

          admin:
            "Admin",

          adminDashboard:
            "Admin Dashboard",

          partner:
            "Partner",

          partnerPortal:
            "Partner Portal",

          finishSetup:
            "Finish Account Setup",

          signedIn:
            "Signed in",

          logout:
            "Log out",

          loggingOut:
            "Logging out...",

          secure:
            "Secure account access",
        };

  /* =======================================================
     CHECK CURRENT SESSION

     We check both cookies because admin and representative
     authentication are still securely separated.

     The unified /login endpoint decides which role the
     supplied credentials belong to.
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

          const nextAdmin =
            adminResult.status ===
            "fulfilled"
              ? adminResult.value
              : null;

          const nextPartner =
            partnerResult.status ===
            "fulfilled"
              ? partnerResult.value
              : null;

          setAdmin(
            nextAdmin,
          );

          setPartner(
            nextPartner,
          );

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
      pathname,
    ],
  );

  /* =======================================================
     CLICK OUTSIDE + ESCAPE
     ======================================================= */

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      function handlePointerDown(
        event:
          PointerEvent,
      ) {
        const wrapper =
          wrapperRef.current;

        if (
          !wrapper
        ) {
          return;
        }

        const target =
          event.target;

        if (
          target instanceof
            Node &&
          !wrapper.contains(
            target,
          )
        ) {
          setOpen(
            false,
          );
        }
      }

      function handleKeyDown(
        event:
          KeyboardEvent,
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setOpen(
            false,
          );
        }
      }

      document.addEventListener(
        "pointerdown",
        handlePointerDown,
      );

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown,
        );

        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      open,
    ],
  );

  /* =======================================================
     DERIVED ACCOUNT INFORMATION
     ======================================================= */

  const hasAdmin =
    Boolean(
      admin,
    );

  const hasPartner =
    Boolean(
      partner,
    );

  const hasSession =
    hasAdmin ||
    hasPartner;

  const primaryName =
    admin?.name ??
    partner?.name ??
    "";

  const primaryEmail =
    admin?.email ??
    partner?.email ??
    "";

  const initial =
    primaryName
      .trim()
      .charAt(0)
      .toUpperCase();

  let triggerLabel =
    copy.login;

  if (
    hasAdmin &&
    hasPartner
  ) {
    triggerLabel =
      copy.account;
  } else if (
    hasAdmin
  ) {
    triggerLabel =
      copy.admin;
  } else if (
    hasPartner
  ) {
    triggerLabel =
      copy.partner;
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function goTo(
    path:
      string,
  ) {
    setOpen(
      false,
    );

    router.push(
      path,
    );
  }

  /* =======================================================
     ADMIN LOGOUT
     ======================================================= */

  async function handleAdminLogout() {
    if (
      actionLoading
    ) {
      return;
    }

    setActionLoading(
      true,
    );

    setError(
      "",
    );

    try {
      await logoutAdmin();

      setAdmin(
        null,
      );

      if (
        !partner
      ) {
        setOpen(
          false,
        );
      }

      router.refresh();
    } catch (
      logoutError
    ) {
      setError(
        logoutError instanceof
          Error
          ? logoutError.message
          : "Unable to log out.",
      );
    } finally {
      setActionLoading(
        false,
      );
    }
  }

  /* =======================================================
     PARTNER LOGOUT
     ======================================================= */

  async function handlePartnerLogout() {
    if (
      actionLoading
    ) {
      return;
    }

    setActionLoading(
      true,
    );

    setError(
      "",
    );

    try {
      await logoutRepresentative();

      setPartner(
        null,
      );

      if (
        !admin
      ) {
        setOpen(
          false,
        );
      }

      router.refresh();
    } catch (
      logoutError
    ) {
      setError(
        logoutError instanceof
          Error
          ? logoutError.message
          : "Unable to log out.",
      );
    } finally {
      setActionLoading(
        false,
      );
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      ref={
        wrapperRef
      }
      className="relative z-[30] shrink-0"
    >
      {/* =================================================
          ACCOUNT BUTTON
          ================================================= */}

      <button
        type="button"
        aria-label={
          hasSession
            ? copy.account
            : copy.login
        }
        aria-haspopup="menu"
        aria-expanded={
          open
        }
        onClick={() => {
          setError("");

          setOpen(
            (
              current,
            ) =>
              !current,
          );
        }}
        className="
          group
          flex
          h-10
          shrink-0
          items-center
          gap-1.5
          rounded-[14px]
          border
          border-black/[0.08]
          bg-white/85
          p-1
          shadow-[0_8px_26px_rgba(31,48,22,0.07)]
          backdrop-blur-xl
          transition-all
          duration-300
          hover:border-[#79b84a]/30
          hover:bg-white
          hover:shadow-[0_12px_32px_rgba(67,106,40,0.11)]
          xl:h-12
          xl:gap-2
          xl:rounded-2xl
          xl:pr-3
        "
      >
        {/* AVATAR */}

        <span
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-[10px]
            border
            border-[#86bd59]/20
            bg-[linear-gradient(135deg,#eff9e5,#f8fff0)]
            font-bold
            text-[#47752d]
            shadow-[0_5px_15px_rgba(82,128,48,0.09)]
            xl:h-9
            xl:w-9
            xl:rounded-xl
          "
        >
          {checking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#47752d]/15 border-t-[#47752d]" />
          ) : initial ? (
            <span className="text-[12px] font-black uppercase">
              {
                initial
              }
            </span>
          ) : (
            <span className="h-[17px] w-[17px]">
              <UserIcon />
            </span>
          )}
        </span>

        {/* LABEL */}

        <span
          className="
            hidden
            max-w-[76px]
            truncate
            text-[11px]
            font-bold
            text-[#20251d]
            min-[390px]:inline
            xl:max-w-[100px]
            xl:text-[12px]
          "
        >
          {checking
            ? "..."
            : triggerLabel}
        </span>

        {/* CHEVRON */}

        <span
          className={`
            hidden
            h-4
            w-4
            shrink-0
            text-black/35
            transition-transform
            duration-300
            min-[390px]:block
            ${
              open
                ? "rotate-180 text-[#47752d]"
                : ""
            }
          `}
        >
          <ChevronIcon />
        </span>
      </button>

      {/* =================================================
          DROPDOWN
          ================================================= */}

      <div
        role="menu"
        aria-hidden={
          !open
        }
        className={`
          absolute
          right-[-48px]
          top-[calc(100%+10px)]

          w-[min(310px,calc(100vw-24px))]

          origin-top-right
          overflow-hidden

          rounded-[22px]

          border
          border-black/[0.07]

          bg-white/[0.98]

          p-2

          shadow-[0_25px_70px_rgba(31,48,22,0.16)]

          backdrop-blur-2xl

          transition-all
          duration-200

          xl:right-0
          xl:w-[320px]

          ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-[0.97] opacity-0"
          }
        `}
      >
        {/* =================================================
            CHECKING SESSION
            ================================================= */}

        {checking && (
          <div className="flex min-h-[130px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-[#426c2b]" />
          </div>
        )}

        {/* =================================================
            GUEST
            ================================================= */}

        {!checking &&
          !hasSession && (
            <>
              {/* HEADER */}

              <div className="px-3 pb-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#edf5e7] text-[#426c2b]">
                    <span className="h-[18px] w-[18px]">
                      <UserIcon />
                    </span>
                  </span>

                  <div className="min-w-0">
                    <strong className="block text-[11px] font-black tracking-[-0.02em] text-[#1d211b]">
                      {
                        copy.loginTitle
                      }
                    </strong>

                    <p className="mt-0.5 text-[7.5px] leading-4 text-black/35">
                      {
                        copy.loginDescription
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-black/[0.055]" />

              {/* ONE UNIFIED LOGIN */}

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  goTo(
                    "/login",
                  )
                }
                className="
                  group
                  mt-2
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-[15px]
                  px-3
                  py-3.5
                  text-left
                  transition
                  duration-200
                  hover:bg-[#f1f7ed]
                "
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#eaf4e3] text-[#426c2b]">
                  <span className="h-[17px] w-[17px]">
                    <LoginIcon />
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <strong className="block text-[9.5px] font-extrabold text-[#242922]">
                    {
                      copy.continueLogin
                    }
                  </strong>

                  <span className="mt-0.5 block text-[7px] text-black/30">
                    {
                      copy.accountTypes
                    }
                  </span>
                </span>

                <span className="text-[13px] text-black/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#426c2b]">
                  →
                </span>
              </button>

              {/* SECURITY */}

              <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#fafbf8] px-3 py-2.5 text-[7px] font-medium text-black/28">
                <span className="h-3.5 w-3.5 text-[#659047]">
                  <LockIcon />
                </span>

                {
                  copy.secure
                }
              </div>
            </>
          )}

        {/* =================================================
            AUTHENTICATED
            ================================================= */}

        {!checking &&
          hasSession && (
            <>
              {/* USER INFORMATION */}

              <div className="px-3 pb-3 pt-2">
                <span className="text-[6.5px] font-extrabold uppercase tracking-[0.14em] text-[#679249]">
                  {
                    copy.signedIn
                  }
                </span>

                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-[14px]
                      border
                      border-[#83ba57]/20
                      bg-[#edf6e7]
                      text-[14px]
                      font-black
                      text-[#426c2b]
                    "
                  >
                    {
                      initial ||
                      "U"
                    }
                  </span>

                  <div className="min-w-0">
                    <strong className="block truncate text-[11px] font-black text-[#1c2119]">
                      {
                        primaryName
                      }
                    </strong>

                    <span className="mt-0.5 block truncate text-[7.5px] text-black/35">
                      {
                        primaryEmail
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-black/[0.055]" />

              {/* ===========================================
                  ADMIN WORKSPACE
                  =========================================== */}

              {admin && (
                <div className="mt-2">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      goTo(
                        "/admin/dashboard",
                      )
                    }
                    className="
                      group
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-[15px]
                      px-3
                      py-3
                      text-left
                      transition
                      hover:bg-[#f1f7ed]
                    "
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf4e3] text-[#426c2b]">
                      <span className="h-4 w-4">
                        <DashboardIcon />
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <strong className="text-[9px] font-extrabold text-[#242922]">
                          {
                            copy.adminDashboard
                          }
                        </strong>

                        <span className="rounded-full bg-[#eaf4e3] px-2 py-0.5 text-[5.5px] font-extrabold uppercase tracking-[0.08em] text-[#4d7833]">
                          {
                            copy.admin
                          }
                        </span>
                      </span>

                      <span className="mt-0.5 block truncate text-[7px] text-black/30">
                        {
                          admin.username
                        }
                      </span>
                    </span>

                    <span className="text-black/20 transition-transform group-hover:translate-x-1 group-hover:text-[#426c2b]">
                      →
                    </span>
                  </button>
                </div>
              )}

              {/* ===========================================
                  PARTNER WORKSPACE
                  =========================================== */}

              {partner && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    goTo(
                      partner.mustChangePassword
                        ? "/representative/change-password"
                        : "/representative/dashboard",
                    )
                  }
                  className="
                    group
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-[15px]
                    px-3
                    py-3
                    text-left
                    transition
                    hover:bg-[#f1f7ed]
                  "
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff4eb] text-[#557440]">
                    <span className="h-4 w-4">
                      <PartnerIcon />
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <strong className="text-[9px] font-extrabold text-[#242922]">
                        {partner.mustChangePassword
                          ? copy.finishSetup
                          : copy.partnerPortal}
                      </strong>

                      <span className="rounded-full bg-[#eff4eb] px-2 py-0.5 text-[5.5px] font-extrabold uppercase tracking-[0.08em] text-[#56763f]">
                        {
                          copy.partner
                        }
                      </span>
                    </span>

                    <span className="mt-0.5 block truncate text-[7px] font-bold text-[#5d8742]">
                      {
                        partner.username
                      }
                    </span>
                  </span>

                  <span className="text-black/20 transition-transform group-hover:translate-x-1 group-hover:text-[#426c2b]">
                    →
                  </span>
                </button>
              )}

              {/* ===========================================
                  ERROR
                  =========================================== */}

              {error && (
                <div
                  role="alert"
                  className="mx-2 mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[7.5px] leading-4 text-red-600"
                >
                  {
                    error
                  }
                </div>
              )}

              {/* ===========================================
                  LOGOUT
                  =========================================== */}

              <div className="mt-2 border-t border-black/[0.055] pt-2">
                {admin && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      void handleAdminLogout()
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-[8px]
                      font-bold
                      text-red-500
                      transition
                      hover:bg-red-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <span className="h-4 w-4">
                      <LogoutIcon />
                    </span>

                    <span className="flex-1">
                      {actionLoading
                        ? copy.loggingOut
                        : hasPartner
                          ? `${copy.logout} Admin`
                          : copy.logout}
                    </span>
                  </button>
                )}

                {partner && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={
                      actionLoading
                    }
                    onClick={() =>
                      void handlePartnerLogout()
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-[8px]
                      font-bold
                      text-red-500
                      transition
                      hover:bg-red-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <span className="h-4 w-4">
                      <LogoutIcon />
                    </span>

                    <span className="flex-1">
                      {actionLoading
                        ? copy.loggingOut
                        : hasAdmin
                          ? `${copy.logout} Partner`
                          : copy.logout}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
}