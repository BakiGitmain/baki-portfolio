"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

import OtpInput from "./otp-input";

import {
  RepresentativeEmailChangeError,
  sendCurrentEmailCode,
  sendNewEmailCode,
  verifyCurrentEmailCode,
  verifyNewEmailCode,
} from "@/lib/representative-email-change-api";

type Step =
  | "intro"
  | "current-code"
  | "new-email"
  | "new-code"
  | "success";

function localMask(
  email:
    string,
) {
  const [
    local =
      "",
    domain =
      "",
  ] =
    email.split(
      "@",
    );

  return `${local.charAt(0) || "*"}***@${domain}`;
}

export default function RepresentativeChangeEmail({
  currentEmail,
  language,
  onEmailChanged,
}: {
  currentEmail:
    string;

  language:
    "en" |
    "am";

  onEmailChanged:
    (
      email:
        string,
    ) =>
      void;
}) {
  const copy =
    language ===
    "am"
      ? {
          changeEmail:
            "ኢሜይል ይቀይሩ",
          verifyIdentity:
            "ማንነትዎን ያረጋግጡ",
          currentHelper:
            "ባለአራት አሃዝ የማረጋገጫ ኮድ ወደ አሁኑ ኢሜይልዎ እንልካለን።",
          sendCode:
            "ኮድ ላክ",
          sending:
            "በመላክ ላይ…",
          verificationCode:
            "የማረጋገጫ ኮድ",
          codeSent:
            "ኮድ ተልኳል ወደ",
          codeExpires:
            "ኮዱ በ10 ደቂቃ ውስጥ ጊዜው ያልፋል።",
          verify:
            "አረጋግጥ",
          verifying:
            "በማረጋገጥ ላይ…",
          resendCode:
            "ኮዱን እንደገና ላክ",
          resendIn:
            "እንደገና ላክ በ",
          seconds:
            "ሰ",
          newEmailTitle:
            "አዲሱን ኢሜይልዎን ያስገቡ",
          newEmail:
            "አዲስ ኢሜይል",
          continue:
            "ቀጥል",
          verifyNew:
            "አዲሱን ኢሜይልዎን ያረጋግጡ",
          changed:
            "ኢሜይሉ በተሳካ ሁኔታ ተቀይሯል",
          done:
            "ጨርስ",
          close:
            "ዝጋ",
          invalidEmail:
            "ትክክለኛ ኢሜይል ያስገቡ።",
          incompleteCode:
            "ባለአራት አሃዝ ኮዱን ያስገቡ።",
        }
      : {
          changeEmail:
            "Change email",
          verifyIdentity:
            "Verify your identity",
          currentHelper:
            "We'll send a 4-digit verification code to your current email.",
          sendCode:
            "Send code",
          sending:
            "Sending…",
          verificationCode:
            "Verification code",
          codeSent:
            "We sent a code to",
          codeExpires:
            "This code expires in 10 minutes.",
          verify:
            "Verify code",
          verifying:
            "Verifying…",
          resendCode:
            "Resend code",
          resendIn:
            "Resend in",
          seconds:
            "s",
          newEmailTitle:
            "Enter your new email",
          newEmail:
            "New email",
          continue:
            "Continue",
          verifyNew:
            "Verify your new email",
          changed:
            "Email changed successfully",
          done:
            "Done",
          close:
            "Close",
          invalidEmail:
            "Enter a valid email address.",
          incompleteCode:
            "Enter the complete four-digit code.",
        };

  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    );

  const [
    step,
    setStep,
  ] =
    useState<Step>(
      "intro",
    );

  const [
    code,
    setCode,
  ] =
    useState(
      "",
    );

  const [
    newEmail,
    setNewEmail,
  ] =
    useState(
      "",
    );

  const [
    maskedEmail,
    setMaskedEmail,
  ] =
    useState(
      localMask(
        currentEmail,
      ),
    );

  const [
    busy,
    setBusy,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const [
    resendAt,
    setResendAt,
  ] =
    useState(
      0,
    );

  const [
    now,
    setNow,
  ] =
    useState(
      0,
    );

  useEffect(
    () => {
      if (
        !open ||
        resendAt <=
          Date.now()
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () =>
            setNow(
              Date.now(),
            ),
          1000,
        );

      return () =>
        window.clearInterval(
          timer,
        );
    },
    [
      open,
      resendAt,
    ],
  );

  const resendSeconds =
    Math.max(
      0,
      Math.ceil(
        (
          resendAt -
          now
        ) /
          1000,
      ),
    );

  function close() {
    setOpen(
      false,
    );
    setStep(
      "intro",
    );
    setCode(
      "",
    );
    setNewEmail(
      "",
    );
    setError(
      "",
    );
    setBusy(
      false,
    );
  }

  function handleError(
    caught:
      unknown,
  ) {
    if (
      caught instanceof
      RepresentativeEmailChangeError &&
      caught.retryAfterSeconds
    ) {
      setResendAt(
        Date.now() +
          caught.retryAfterSeconds *
            1000,
      );
    }

    setError(
      caught instanceof
        Error
        ? caught.message
        : language ===
            "am"
          ? "የኢሜይል ለውጡን ማጠናቀቅ አልተቻለም።"
          : "Unable to complete the email change.",
    );
  }

  async function sendCurrent() {
    setBusy(
      true,
    );
    setError(
      "",
    );

    try {
      const result =
        await sendCurrentEmailCode();

      setMaskedEmail(
        result.maskedEmail,
      );
      setResendAt(
        Date.now() +
          result.resendAfterSeconds *
            1000,
      );
      setNow(
        Date.now(),
      );
      setCode(
        "",
      );
      setStep(
        "current-code",
      );
    } catch (
      caught
    ) {
      handleError(
        caught,
      );
    } finally {
      setBusy(
        false,
      );
    }
  }

  async function verifyCurrent() {
    if (
      !/^\d{4}$/.test(
        code,
      )
    ) {
      setError(
        copy.incompleteCode,
      );
      return;
    }

    setBusy(
      true,
    );
    setError(
      "",
    );

    try {
      await verifyCurrentEmailCode(
        code,
      );
      setCode(
        "",
      );
      setStep(
        "new-email",
      );
    } catch (
      caught
    ) {
      handleError(
        caught,
      );
    } finally {
      setBusy(
        false,
      );
    }
  }

  async function sendNew() {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        newEmail,
      )
    ) {
      setError(
        copy.invalidEmail,
      );
      return;
    }

    setBusy(
      true,
    );
    setError(
      "",
    );

    try {
      const result =
        await sendNewEmailCode(
          newEmail,
        );

      setMaskedEmail(
        result.maskedEmail,
      );
      setResendAt(
        Date.now() +
          result.resendAfterSeconds *
            1000,
      );
      setNow(
        Date.now(),
      );
      setCode(
        "",
      );
      setStep(
        "new-code",
      );
    } catch (
      caught
    ) {
      handleError(
        caught,
      );
    } finally {
      setBusy(
        false,
      );
    }
  }

  async function verifyNew() {
    if (
      !/^\d{4}$/.test(
        code,
      )
    ) {
      setError(
        copy.incompleteCode,
      );
      return;
    }

    setBusy(
      true,
    );
    setError(
      "",
    );

    try {
      const result =
        await verifyNewEmailCode(
          code,
        );

      onEmailChanged(
        result.email,
      );
      setNewEmail(
        result.email,
      );
      setStep(
        "success",
      );
    } catch (
      caught
    ) {
      handleError(
        caught,
      );
    } finally {
      setBusy(
        false,
      );
    }
  }

  const inputClass =
    "h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 text-[12px] text-[var(--portal-text)] outline-none transition focus:border-[var(--portal-green)]/35 focus:ring-4 focus:ring-[var(--portal-green)]/10";

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(
            true,
          )
        }
        className="h-11 w-full rounded-[13px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[10px] font-extrabold text-[var(--portal-text)]"
      >
        {copy.changeEmail}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-email-title"
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
        >
          <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-2xl sm:max-w-[480px] sm:rounded-[28px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
                {step ===
                "success" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </span>

              <button
                type="button"
                aria-label={copy.close}
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--portal-border)] text-[var(--portal-muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3
              id="change-email-title"
              className="mt-5 text-[21px] font-black tracking-[-0.045em]"
            >
              {step ===
              "new-email"
                ? copy.newEmailTitle
                : step ===
                    "new-code"
                  ? copy.verifyNew
                  : step ===
                      "success"
                    ? copy.changed
                    : copy.verifyIdentity}
            </h3>

            {step ===
              "intro" && (
              <>
                <p className="mt-3 text-[11px] leading-5 text-[var(--portal-muted)]">
                  {copy.currentHelper}
                </p>
                <div className="mt-4 flex items-center gap-3 rounded-[15px] bg-[var(--portal-surface-2)] px-4 py-3">
                  <Mail className="h-4 w-4 text-[var(--portal-green)]" />
                  <strong className="text-[11px]">
                    {localMask(
                      currentEmail,
                    )}
                  </strong>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void sendCurrent()
                  }
                  className="mt-5 h-12 w-full rounded-[14px] bg-[var(--portal-green)] text-[11px] font-extrabold text-white disabled:opacity-50"
                >
                  {busy
                    ? copy.sending
                    : copy.sendCode}
                </button>
              </>
            )}

            {(
              step ===
                "current-code" ||
              step ===
                "new-code"
            ) && (
              <>
                <p className="mt-3 text-[11px] leading-5 text-[var(--portal-muted)]">
                  {copy.codeSent} <strong>{maskedEmail}</strong>. {copy.codeExpires}
                </p>

                <div className="mt-6">
                  <OtpInput
                    value={code}
                    onChange={(
                      value,
                    ) => {
                      setCode(
                        value,
                      );
                      setError(
                        "",
                      );
                    }}
                    onSubmit={() =>
                      void (
                        step ===
                        "current-code"
                          ? verifyCurrent()
                          : verifyNew()
                      )
                    }
                    label={copy.verificationCode}
                    disabled={busy}
                    invalid={Boolean(
                      error,
                    )}
                  />
                </div>

                <button
                  type="button"
                  disabled={
                    busy ||
                    !/^\d{4}$/.test(
                      code,
                    )
                  }
                  onClick={() =>
                    void (
                      step ===
                      "current-code"
                        ? verifyCurrent()
                        : verifyNew()
                    )
                  }
                  className="mt-6 h-12 w-full rounded-[14px] bg-[var(--portal-green)] text-[11px] font-extrabold text-white disabled:opacity-50"
                >
                  {busy
                    ? copy.verifying
                    : copy.verify}
                </button>

                <button
                  type="button"
                  disabled={
                    busy ||
                    resendSeconds >
                      0
                  }
                  onClick={() =>
                    void (
                      step ===
                      "current-code"
                        ? sendCurrent()
                        : sendNew()
                    )
                  }
                  className="mt-2 h-10 w-full text-[10px] font-extrabold text-[var(--portal-green)] disabled:text-[var(--portal-faint)]"
                >
                  {resendSeconds >
                  0
                    ? `${copy.resendIn} ${resendSeconds}${copy.seconds}`
                    : copy.resendCode}
                </button>
              </>
            )}

            {step ===
              "new-email" && (
              <form
                className="mt-5"
                onSubmit={(
                  event,
                ) => {
                  event.preventDefault();
                  void sendNew();
                }}
              >
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--portal-faint)]">
                    {copy.newEmail}
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    onChange={(
                      event,
                    ) => {
                      setNewEmail(
                        event.target.value,
                      );
                      setError(
                        "",
                      );
                    }}
                    className={inputClass}
                    placeholder="newemail@example.com"
                    autoFocus
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-5 h-12 w-full rounded-[14px] bg-[var(--portal-green)] text-[11px] font-extrabold text-white disabled:opacity-50"
                >
                  {busy
                    ? copy.sending
                    : copy.continue}
                </button>
              </form>
            )}

            {step ===
              "success" && (
              <>
                <p className="mt-3 text-[11px] leading-5 text-[var(--portal-muted)]">
                  {copy.newEmail}
                </p>
                <strong className="mt-2 block break-all text-[13px] text-[var(--portal-green)]">
                  {newEmail}
                </strong>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 h-12 w-full rounded-[14px] bg-[var(--portal-green)] text-[11px] font-extrabold text-white"
                >
                  {copy.done}
                </button>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-[13px] border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-[10px] leading-5 text-red-500"
              >
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
