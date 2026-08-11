"use client";

import {
  useState,
  type ReactNode,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  acceptRepresentativeApplication,
  type RepresentativeCredentials,
} from "@/lib/representative-onboarding-api";

/* =========================================================
   ICONS
   ========================================================= */

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5L10 17L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8"
        stroke="currentColor"
        strokeWidth="1.6"
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

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8.5"
        cy="12"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M13 12H21M18 12V15M16 12V14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

/* =========================================================
   MODAL SHELL
   ========================================================= */

function ModalShell({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]

        flex
        items-center
        justify-center

        overflow-y-auto

        bg-[#11150f]/45

        px-4
        py-6

        backdrop-blur-[7px]

        sm:px-6
        sm:py-8
      "
    >
      {
        children
      }
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AcceptRepresentativeButton({
  applicationId,
  disabled,
  label,
}: {
  applicationId:
    string;

  disabled?:
    boolean;

  label:
    string;
}) {
  const [
    confirmOpen,
    setConfirmOpen,
  ] =
    useState(false);

  const [
    credentials,
    setCredentials,
  ] =
    useState<
      RepresentativeCredentials |
      null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  /* =======================================================
     ACCEPT
     ======================================================= */

  async function accept() {
    if (
      loading
    ) {
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
        await acceptRepresentativeApplication(
          applicationId,
        );

      setConfirmOpen(
        false,
      );

      setCredentials(
        result.credentials,
      );
    } catch (
      acceptError
    ) {
      setError(
        acceptError instanceof
          Error
          ? acceptError.message
          : "Unable to accept application.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  /* =======================================================
     COPY
     ======================================================= */

  async function copyCredentials() {
    if (
      !credentials
    ) {
      return;
    }

    const text = [
      `Username: ${credentials.username}`,
      `First-login Password: ${credentials.temporaryPassword}`,
      "Login: /login",
    ].join(
      "\n",
    );

    try {
      await navigator
        .clipboard
        .writeText(
          text,
        );

      setCopied(
        true,
      );

      window.setTimeout(
        () => {
          setCopied(
            false,
          );
        },
        1800,
      );
    } catch {
      setCopied(
        false,
      );
    }
  }

  /* =======================================================
     FINISH
     ======================================================= */

  function finish() {
    window.location.reload();
  }

  /* =======================================================
     CONFIRMATION MODAL
     ======================================================= */

  const confirmationModal =
    confirmOpen &&
    !credentials &&
    typeof document !==
      "undefined"
      ? createPortal(
          <ModalShell>
            {/* BACKDROP */}

            <button
              type="button"
              aria-label="Close confirmation"
              onClick={() => {
                if (
                  loading
                ) {
                  return;
                }

                setConfirmOpen(
                  false,
                );

                setError(
                  "",
                );
              }}
              className="absolute inset-0 cursor-default"
            />

            {/* CARD */}

            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="accept-representative-title"
              className="
                relative
                z-10

                my-auto

                w-full
                max-w-[470px]

                overflow-hidden

                rounded-[28px]

                border
                border-black/[0.06]

                bg-white

                shadow-[0_35px_110px_rgba(19,31,14,0.28)]
              "
            >
              <div className="h-1 w-full bg-[linear-gradient(90deg,#a7da77,#5c8f3e,#a7da77)]" />

              <div className="p-6 sm:p-8">
                {/* ICON + CLOSE */}

                <div className="flex items-start justify-between gap-5">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[17px] border border-[#7cad58]/15 bg-[#edf5e7] text-[#426c2b]">
                    <span className="h-5 w-5">
                      <ShieldIcon />
                    </span>
                  </span>

                  <button
                    type="button"
                    aria-label="Close confirmation"
                    disabled={
                      loading
                    }
                    onClick={() => {
                      setConfirmOpen(
                        false,
                      );

                      setError(
                        "",
                      );
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-[#fafbf8] text-black/35 transition hover:bg-[#f4f6f1] hover:text-black/60 disabled:opacity-40"
                  >
                    <span className="h-4 w-4">
                      <CloseIcon />
                    </span>
                  </button>
                </div>

                {/* TITLE */}

                <div className="mt-6">
                  <span className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-[#659246]">
                    REPRESENTATIVE ONBOARDING
                  </span>

                  <h3
                    id="accept-representative-title"
                    className="mt-2 text-[27px] font-black tracking-[-0.05em] text-[#171b15]"
                  >
                    Accept applicant?
                  </h3>

                  <p className="mt-3 text-[9.5px] leading-6 text-black/42">
                    This will approve the application and create their private Partner account.
                  </p>
                </div>

                {/* DETAILS */}

                <div className="mt-6 rounded-[18px] border border-black/[0.055] bg-[#fafbf8] p-4">
                  <span className="text-[7px] font-extrabold uppercase tracking-[0.14em] text-black/28">
                    Account setup
                  </span>

                  <div className="mt-4 space-y-3">
                    {/* USERNAME */}

                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#edf5e7] text-[#426c2b]">
                        <span className="h-3.5 w-3.5">
                          <UserIcon />
                        </span>
                      </span>

                      <div>
                        <strong className="block text-[8.5px] font-extrabold text-[#262b23]">
                          PS-#### username
                        </strong>

                        <span className="mt-0.5 block text-[7px] text-black/30">
                          A unique Partner username will be generated.
                        </span>
                      </div>
                    </div>

                    {/* PASSWORD */}

                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#edf5e7] text-[#426c2b]">
                        <span className="h-3.5 w-3.5">
                          <KeyIcon />
                        </span>
                      </span>

                      <div>
                        <strong className="block text-[8.5px] font-extrabold text-[#262b23]">
                          Default login password: 1234
                        </strong>

                        <span className="mt-0.5 block text-[7px] text-black/30">
                          Used only to enter the account for the first time.
                        </span>
                      </div>
                    </div>

                    {/* FORCE CHANGE */}

                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#edf5e7] text-[#426c2b]">
                        <span className="h-3.5 w-3.5">
                          <ShieldIcon />
                        </span>
                      </span>

                      <div>
                        <strong className="block text-[8.5px] font-extrabold text-[#262b23]">
                          New password required
                        </strong>

                        <span className="mt-0.5 block text-[7px] text-black/30">
                          They must create a 6+ character password before entering the portal.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

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

                {/* ACTIONS */}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={() => {
                      setConfirmOpen(
                        false,
                      );

                      setError(
                        "",
                      );
                    }}
                    className="h-11 rounded-xl border border-black/[0.07] bg-[#fafbf8] text-[8.5px] font-extrabold text-black/45 transition hover:bg-[#f3f5f0] hover:text-black/60 disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={() =>
                      void accept()
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#426c2b] px-4 text-[8.5px] font-extrabold text-white shadow-[0_10px_28px_rgba(66,108,43,0.22)] transition hover:bg-[#355923] disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />

                        Creating...
                      </>
                    ) : (
                      <>
                        <span className="h-4 w-4">
                          <CheckIcon />
                        </span>

                        Accept & Create
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </ModalShell>,

          document.body,
        )
      : null;

  /* =======================================================
     ACCOUNT CREATED MODAL
     ======================================================= */

  const credentialsModal =
    credentials &&
    typeof document !==
      "undefined"
      ? createPortal(
          <ModalShell>
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="representative-created-title"
              className="relative z-10 my-auto w-full max-w-[490px] overflow-hidden rounded-[30px] border border-black/[0.06] bg-white shadow-[0_40px_120px_rgba(19,31,14,0.3)]"
            >
              <div className="h-1 w-full bg-[linear-gradient(90deg,#9ed46b,#426c2b,#9ed46b)]" />

              <div className="p-6 sm:p-8">
                {/* SUCCESS */}

                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#78ad54]/15 bg-[#eaf4e3] text-[#426c2b] shadow-[0_8px_24px_rgba(66,108,43,0.08)]">
                  <span className="h-6 w-6">
                    <CheckIcon />
                  </span>
                </span>

                <div className="mt-5 text-center">
                  <span className="text-[7px] font-extrabold uppercase tracking-[0.19em] text-[#659345]">
                    PARTNER ACCOUNT CREATED
                  </span>

                  <h3
                    id="representative-created-title"
                    className="mt-2 text-[27px] font-black tracking-[-0.05em] text-[#171b15]"
                  >
                    Login is ready.
                  </h3>

                  <p className="mx-auto mt-3 max-w-[380px] text-[9px] leading-5 text-black/40">
                    Give the Partner their username. Their first-login password is 1234.
                  </p>
                </div>

                {/* CREDENTIALS */}

                <div className="mt-6 space-y-3">
                  {/* USERNAME */}

                  <div className="rounded-[17px] border border-black/[0.06] bg-[#fafbf8] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
                        <span className="h-4 w-4">
                          <UserIcon />
                        </span>
                      </span>

                      <div className="min-w-0">
                        <span className="block text-[6.5px] font-bold uppercase tracking-[0.13em] text-black/27">
                          Username
                        </span>

                        <strong className="mt-1 block font-mono text-[15px] font-black tracking-[0.04em] text-[#2e4820]">
                          {
                            credentials.username
                          }
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* DEFAULT PASSWORD */}

                  <div className="rounded-[17px] border border-black/[0.06] bg-[#fafbf8] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5e7] text-[#426c2b]">
                        <span className="h-4 w-4">
                          <KeyIcon />
                        </span>
                      </span>

                      <div>
                        <span className="block text-[6.5px] font-bold uppercase tracking-[0.13em] text-black/27">
                          First-login Password
                        </span>

                        <strong className="mt-1 block font-mono text-[17px] font-black tracking-[0.08em] text-[#2e4820]">
                          {
                            credentials.temporaryPassword
                          }
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOTE */}

                <div className="mt-4 rounded-[15px] border border-[#76a957]/15 bg-[#f1f7ed] px-4 py-3 text-[7.5px] leading-5 text-[#507537]">
                  After logging in with <strong>1234</strong>, the Partner must create their own password before they can access reports, training or other private portal features.
                </div>

                {/* COPY */}

                <button
                  type="button"
                  onClick={() =>
                    void copyCredentials()
                  }
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#6e9a4e]/15 bg-[#f1f7ed] text-[8.5px] font-extrabold text-[#426c2b] transition hover:bg-[#e8f2e2]"
                >
                  <span className="h-4 w-4">
                    {copied ? (
                      <CheckIcon />
                    ) : (
                      <CopyIcon />
                    )}
                  </span>

                  {copied
                    ? "Credentials Copied"
                    : "Copy Credentials"}
                </button>

                {/* DONE */}

                <button
                  type="button"
                  onClick={
                    finish
                  }
                  className="mt-3 h-11 w-full rounded-xl bg-[#426c2b] text-[8.5px] font-extrabold text-white shadow-[0_10px_25px_rgba(66,108,43,0.2)] transition hover:bg-[#355923]"
                >
                  Done
                </button>
              </div>
            </section>
          </ModalShell>,

          document.body,
        )
      : null;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <button
        type="button"
        disabled={
          disabled ||
          loading
        }
        onClick={() => {
          setError(
            "",
          );

          setConfirmOpen(
            true,
          );
        }}
        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#6f9a52]/15 bg-[#edf5e7] px-3 text-[7.5px] font-extrabold text-[#426c2b] transition hover:bg-[#e5f0dd] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="h-3.5 w-3.5">
          <CheckIcon />
        </span>

        {
          loading
            ? "Creating..."
            : label
        }
      </button>

      {
        confirmationModal
      }

      {
        credentialsModal
      }
    </>
  );
}