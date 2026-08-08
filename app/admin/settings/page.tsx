"use client";

import {
  useState,
  type FormEvent,
} from "react";

import AdminShell from "@/components/admin/admin-shell";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  updateAdminAccount,
  type AdminUser,
} from "@/lib/admin-api";

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
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.8 16.5 8.2 14.5 12 14.5C15.8 14.5 18.2 16.5 19 20"
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
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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
        d="M12 3L19 6V11C19 15.5 16.2 19.2 12 21C7.8 19.2 5 15.5 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
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

function AdminSettingsContent({
  admin,
}: {
  admin: AdminUser;
}) {
  const {
    language,
  } = useLanguage();

  const [
    name,
    setName,
  ] =
    useState(
      admin.name,
    );

  const [
    username,
    setUsername,
  ] =
    useState(
      admin.username,
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      admin.email,
    );

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const copy =
    language === "am"
      ? {
          account:
            "ACCOUNT",

          profileTitle:
            "Admin Profile",

          profileDescription:
            "Admin accountዎ ላይ ያሉ name፣ username እና email ይቀይሩ።",

          name:
            "ስም",

          username:
            "Username",

          email:
            "Email",

          security:
            "SECURITY",

          passwordTitle:
            "Password & Security",

          passwordDescription:
            "Accountዎን ለመቀየር current passwordዎ ያስፈልጋል። New password ካልፈለጉ ባዶ ይተዉት።",

          currentPassword:
            "Current Password",

          newPassword:
            "New Password",

          confirmPassword:
            "Confirm New Password",

          currentPlaceholder:
            "Current password ያስገቡ",

          newPlaceholder:
            "New password",

          confirmPlaceholder:
            "New password እንደገና ያስገቡ",

          optional:
            "Optional",

          passwordHelp:
            "New password ቢያንስ 12 characters መሆን አለበት።",

          securityTitle:
            "Protected Account",

          securityText:
            "Settings update የሚፈቀደው authenticated admin ለሆነ እና current password ከተረጋገጠ ብቻ ነው።",

          save:
            "Changes አስቀምጥ",

          saving:
            "በማስቀመጥ ላይ...",

          required:
            "ሁሉንም required fields ይሙሉ።",

          passwordMismatch:
            "New passwords አይመሳሰሉም።",

          shortPassword:
            "New password ቢያንስ 12 characters መሆን አለበት።",

          success:
            "Account settings ተቀይረዋል።",
        }
      : {
          account:
            "ACCOUNT",

          profileTitle:
            "Admin Profile",

          profileDescription:
            "Update the name, username and email associated with your administrator account.",

          name:
            "Name",

          username:
            "Username",

          email:
            "Email",

          security:
            "SECURITY",

          passwordTitle:
            "Password & Security",

          passwordDescription:
            "Your current password is required to update account information. Leave the new password empty if you do not want to change it.",

          currentPassword:
            "Current Password",

          newPassword:
            "New Password",

          confirmPassword:
            "Confirm New Password",

          currentPlaceholder:
            "Enter your current password",

          newPlaceholder:
            "Enter a new password",

          confirmPlaceholder:
            "Enter the new password again",

          optional:
            "Optional",

          passwordHelp:
            "New passwords must contain at least 12 characters.",

          securityTitle:
            "Protected Account",

          securityText:
            "Account changes are only accepted from an authenticated administrator after the current password has been verified.",

          save:
            "Save Changes",

          saving:
            "Saving...",

          required:
            "Complete all required fields.",

          passwordMismatch:
            "The new passwords do not match.",

          shortPassword:
            "The new password must contain at least 12 characters.",

          success:
            "Account settings updated successfully.",
        };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !currentPassword
    ) {
      setError(
        copy.required,
      );

      return;
    }

    if (
      newPassword &&
      newPassword.length <
        12
    ) {
      setError(
        copy.shortPassword,
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        copy.passwordMismatch,
      );

      return;
    }

    setLoading(true);

    try {
      const result =
        await updateAdminAccount(
          {
            name:
              name.trim(),

            username:
              username.trim(),

            email:
              email
                .trim()
                .toLowerCase(),

            currentPassword,

            newPassword:
              newPassword ||
              undefined,
          },
        );

      setName(
        result.user.name,
      );

      setUsername(
        result.user
          .username,
      );

      setEmail(
        result.user.email,
      );

      setCurrentPassword(
        "",
      );

      setNewPassword(
        "",
      );

      setConfirmPassword(
        "",
      );

      setSuccess(
        copy.success,
      );
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to update account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="grid gap-5 xl:grid-cols-[1fr_360px]"
    >
      <div className="space-y-5">
        {/* =============================================
            PROFILE
           ============================================= */}

        <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_35px_rgba(37,50,29,0.035)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5e7] text-[#59853b]">
              <span className="h-5 w-5">
                <UserIcon />
              </span>
            </span>

            <div>
              <span className="text-[7.5px] font-extrabold tracking-[0.16em] text-[#719850]">
                {copy.account}
              </span>

              <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.035em] text-[#1c2119]">
                {
                  copy.profileTitle
                }
              </h2>

              <p className="mt-2 max-w-[600px] text-[9.5px] leading-5 text-black/38">
                {
                  copy.profileDescription
                }
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[8.5px] font-bold text-black/48">
                {copy.name}
              </span>

              <input
                value={name}
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target
                      .value,
                  )
                }
                className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[10px] text-[#20251d] outline-none transition focus:border-[#729e51]/35 focus:bg-white focus:ring-4 focus:ring-[#729e51]/[0.06]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[8.5px] font-bold text-black/48">
                {
                  copy.username
                }
              </span>

              <input
                value={
                  username
                }
                onChange={(
                  event,
                ) =>
                  setUsername(
                    event.target
                      .value,
                  )
                }
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[10px] text-[#20251d] outline-none transition focus:border-[#729e51]/35 focus:bg-white focus:ring-4 focus:ring-[#729e51]/[0.06]"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-[8.5px] font-bold text-black/48">
                {copy.email}
              </span>

              <input
                type="email"
                value={email}
                onChange={(
                  event,
                ) =>
                  setEmail(
                    event.target
                      .value,
                  )
                }
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[10px] text-[#20251d] outline-none transition focus:border-[#729e51]/35 focus:bg-white focus:ring-4 focus:ring-[#729e51]/[0.06]"
              />
            </label>
          </div>
        </section>

        {/* =============================================
            PASSWORD
           ============================================= */}

        <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_10px_35px_rgba(37,50,29,0.035)] sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5e7] text-[#59853b]">
              <span className="h-5 w-5">
                <LockIcon />
              </span>
            </span>

            <div>
              <span className="text-[7.5px] font-extrabold tracking-[0.16em] text-[#719850]">
                {
                  copy.security
                }
              </span>

              <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.035em] text-[#1c2119]">
                {
                  copy.passwordTitle
                }
              </h2>

              <p className="mt-2 max-w-[620px] text-[9.5px] leading-5 text-black/38">
                {
                  copy.passwordDescription
                }
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-[8.5px] font-bold text-black/48">
                {
                  copy.currentPassword
                }{" "}

                <em className="not-italic text-red-500">
                  *
                </em>
              </span>

              <input
                type="password"
                value={
                  currentPassword
                }
                onChange={(
                  event,
                ) =>
                  setCurrentPassword(
                    event.target
                      .value,
                  )
                }
                autoComplete="current-password"
                placeholder={
                  copy.currentPlaceholder
                }
                className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[10px] text-[#20251d] outline-none transition placeholder:text-black/20 focus:border-[#729e51]/35 focus:bg-white focus:ring-4 focus:ring-[#729e51]/[0.06]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center justify-between text-[8.5px] font-bold text-black/48">
                  {
                    copy.newPassword
                  }

                  <small className="font-medium text-black/25">
                    {
                      copy.optional
                    }
                  </small>
                </span>

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewPassword(
                      event.target
                        .value,
                    )
                  }
                  autoComplete="new-password"
                  placeholder={
                    copy.newPlaceholder
                  }
                  className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[10px] text-[#20251d] outline-none transition placeholder:text-black/20 focus:border-[#729e51]/35 focus:bg-white focus:ring-4 focus:ring-[#729e51]/[0.06]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[8.5px] font-bold text-black/48">
                  {
                    copy.confirmPassword
                  }
                </span>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event,
                  ) =>
                    setConfirmPassword(
                      event.target
                        .value,
                    )
                  }
                  autoComplete="new-password"
                  placeholder={
                    copy.confirmPlaceholder
                  }
                  className="h-11 w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] px-4 text-[10px] text-[#20251d] outline-none transition placeholder:text-black/20 focus:border-[#729e51]/35 focus:bg-white focus:ring-4 focus:ring-[#729e51]/[0.06]"
                />
              </label>
            </div>

            <span className="text-[8px] text-black/28">
              {
                copy.passwordHelp
              }
            </span>
          </div>
        </section>

        {/* MESSAGES */}

        {error && (
          <div className="rounded-xl border border-red-500/10 bg-red-50 px-4 py-3 text-[9px] font-medium text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-[#74a650]/15 bg-[#f0f7ea] px-4 py-3 text-[9px] font-medium text-[#4d7832]">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#426c2b] px-6 text-[9.5px] font-bold text-white shadow-[0_10px_25px_rgba(66,108,43,0.18)] transition hover:-translate-y-0.5 hover:bg-[#355923] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? copy.saving
            : copy.save}
        </button>
      </div>

      {/* ===============================================
          SECURITY SIDE CARD
         =============================================== */}

      <aside className="h-fit rounded-[22px] border border-[#709f4d]/15 bg-[#f1f7eb] p-5 sm:p-6 xl:sticky xl:top-[110px]">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#558038] shadow-sm">
          <span className="h-5 w-5">
            <ShieldIcon />
          </span>
        </span>

        <h3 className="mt-5 text-[15px] font-bold text-[#314d25]">
          {
            copy.securityTitle
          }
        </h3>

        <p className="mt-3 text-[9.5px] leading-6 text-[#314d25]/55">
          {
            copy.securityText
          }
        </p>

        <div className="mt-6 border-t border-[#426c2b]/10 pt-5">
          <span className="text-[7px] font-extrabold tracking-[0.14em] text-[#70974f]">
            ADMIN ROLE
          </span>

          <strong className="mt-1 block text-[10px] text-[#314d25]">
            {admin.role}
          </strong>
        </div>
      </aside>
    </form>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      {(admin) => (
        <AdminSettingsContent
          admin={admin}
        />
      )}
    </AdminShell>
  );
}