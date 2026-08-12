"use client";

import {
  useRef,
  useState,
} from "react";

import Image from "next/image";
import {
  useRouter,
} from "next/navigation";

import {
  Camera,
  Languages,
  LockKeyhole,
  LogOut,
  Moon,
  Save,
  Sun,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  deleteRepresentativeAvatar,
  updateRepresentativeProfile,
  uploadRepresentativeAvatar,
  type RepresentativeProfile,
} from "@/lib/representative-profile-api";

import {
  useLanguage,
} from "@/components/providers/language-provider";

export default function RepresentativeProfileSettings({
  profile,
  dark,
  onThemeChange,
  onProfileChange,
  onLanguageChange,
  onLogout,
}: {
  profile: RepresentativeProfile;
  dark: boolean;
  onThemeChange: (theme: "light" | "dark") => void;
  onProfileChange: (profile: RepresentativeProfile) => void;
  onLanguageChange: (language: "en" | "am") => void;
  onLogout: () => void | Promise<void>;
}) {
  const router = useRouter();
  const {
    language,
  } = useLanguage();
  const copy = language === "am"
    ? {
        profileSaved: "የመገለጫ ምርጫዎችዎ ተቀምጠዋል።",
        saveError: "መገለጫዎን ማስቀመጥ አልተቻለም።",
        pictureUpdated: "የመገለጫ ምስሉ ተቀይሯል።",
        uploadError: "የመገለጫ ምስሉን መስቀል አልተቻለም።",
        pictureRemoved: "የመገለጫ ምስሉ ተወግዷል።",
        removeError: "የመገለጫ ምስሉን ማስወገድ አልተቻለም።",
        profilePicture: "የመገለጫ ምስል",
        uploadPicture: "የመገለጫ ምስል ይስቀሉ",
        salesPartner: "የሽያጭ አጋር",
        uploading: "በመስቀል ላይ…",
        replacePicture: "ምስሉን ይቀይሩ",
        addPicture: "ምስል ያክሉ",
        remove: "ያስወግዱ",
        legalName: "ሕጋዊ ስም",
        emailAddress: "ኢሜይል አድራሻ",
        phone: "ስልክ",
        city: "ከተማ",
        publicProfile: "የሕዝብ መገለጫ",
        legalHelper: "የሕጋዊ መለያዎ መረጃ የተጠበቀ ሲሆን ማስተካከል አይቻልም።",
        displayName: "የሚታይ ስም",
        displayHelper: "ባዶ ካስቀሩት የተረጋገጠው ሕጋዊ ስምዎ ይጠቀማል። ይህ ስም በአጋሮች ውይይትና በፖርታሉ ይታያል።",
        languagePreference: "የቋንቋ ምርጫ",
        languageHelper: "ይህ ምርጫ በሁሉም መሣሪያዎች ላይ መለያዎን ይከተላል። የአሳሹ ማከማቻ እንደ ፈጣን ምትኬ ይጠቅማል።",
        english: "English",
        amharic: "አማርኛ",
        saving: "በማስቀመጥ ላይ…",
        saveProfile: "መገለጫውን ያስቀምጡ",
        accountSecurity: "የመለያ ደህንነት",
        securityHelper: "የይለፍ ቃልዎን በሚስጥር ይያዙ፤ ሌላ ሰው እንደሚያውቀው ካሰቡ ወዲያውኑ ይቀይሩት።",
        changePassword: "የይለፍ ቃል ይቀይሩ",
        portalTheme: "የፖርታሉ ገጽታ",
        light: "ብርሃን",
        dark: "ጨለማ",
        logout: "ውጣ",
      }
    : {
        profileSaved: "Profile preferences saved.",
        saveError: "Unable to save your profile.",
        pictureUpdated: "Profile picture updated.",
        uploadError: "Unable to upload your profile picture.",
        pictureRemoved: "Profile picture removed.",
        removeError: "Unable to remove your profile picture.",
        profilePicture: "profile picture",
        uploadPicture: "Upload profile picture",
        salesPartner: "Sales Partner",
        uploading: "Uploading…",
        replacePicture: "Replace picture",
        addPicture: "Add picture",
        remove: "Remove",
        legalName: "Legal name",
        emailAddress: "Email address",
        phone: "Phone",
        city: "City",
        publicProfile: "Public profile",
        legalHelper: "Your legal account information stays protected and read-only.",
        displayName: "Display name",
        displayHelper: "Leave blank to use your verified legal name. This name appears in Partner Chat and the portal.",
        languagePreference: "Language preference",
        languageHelper: "This preference follows your account on every device. Local storage remains a fast fallback.",
        english: "English",
        amharic: "አማርኛ",
        saving: "Saving…",
        saveProfile: "Save profile",
        accountSecurity: "Account security",
        securityHelper: "Keep your password private and change it immediately if you think someone else knows it.",
        changePassword: "Change password",
        portalTheme: "Portal theme",
        light: "Light",
        dark: "Dark",
        logout: "Log out",
      };
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [preferredLanguage, setPreferredLanguage] = useState(profile.preferredLanguage);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initials = profile.effectiveName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateRepresentativeProfile({
        displayName,
        preferredLanguage,
      });
      onProfileChange(updated);
      onLanguageChange(updated.preferredLanguage);
      setDisplayName(updated.displayName);
      setSuccess(updated.preferredLanguage === "am"
        ? "የመገለጫ ምርጫዎችዎ ተቀምጠዋል።"
        : "Profile preferences saved.");
    } catch (saveError) {
      setError(
        language === "en" && saveError instanceof Error
          ? saveError.message
          : copy.saveError,
      );
    } finally {
      setSaving(false);
    }
  }

  async function selectAvatar(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const updated = await uploadRepresentativeAvatar(file);
      onProfileChange(updated);
      setSuccess(copy.pictureUpdated);
    } catch (uploadError) {
      setError(
        language === "en" && uploadError instanceof Error
          ? uploadError.message
          : copy.uploadError,
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeAvatar() {
    if (!profile.avatarUrl) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const updated = await deleteRepresentativeAvatar();
      onProfileChange(updated);
      setSuccess(copy.pictureRemoved);
    } catch (deleteError) {
      setError(
        language === "en" && deleteError instanceof Error
          ? deleteError.message
          : copy.removeError,
      );
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-[14px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 text-[12px] text-[var(--portal-text)] outline-none transition focus:border-[var(--portal-green)]/35 focus:ring-4 focus:ring-[var(--portal-green)]/10";
  const labelClass =
    "mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-[var(--portal-faint)]";

  return (
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[26px] border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-[0_15px_50px_var(--portal-shadow)]">
          <div className="relative overflow-hidden border-b border-[var(--portal-border)] bg-[var(--portal-green-soft)] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={`${profile.effectiveName} ${copy.profilePicture}`}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-[24px] object-cover shadow-[0_12px_30px_var(--portal-shadow)]"
                  />
                ) : (
                  <span className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-[var(--portal-surface)] text-[24px] font-black text-[var(--portal-green)] shadow-[0_12px_30px_var(--portal-shadow)]">
                    {initials || "BD"}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={copy.uploadPicture}
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface)] text-[var(--portal-green)] shadow-md disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void selectAvatar(event.target.files?.[0] ?? null)}
                />
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--portal-green)]">
                  {copy.salesPartner}
                </span>
                <h2 className="mt-2 truncate text-[25px] font-black tracking-[-0.05em]">
                  {profile.effectiveName}
                </h2>
                <p className="mt-1 text-[11px] font-bold text-[var(--portal-muted)]">
                  {profile.partnerId}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                    className="h-9 rounded-xl bg-[var(--portal-surface)] px-3 text-[10px] font-extrabold text-[var(--portal-green)] disabled:opacity-50"
                  >
                    {uploading ? copy.uploading : profile.avatarUrl ? copy.replacePicture : copy.addPicture}
                  </button>
                  {profile.avatarUrl && (
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void removeAvatar()}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3 text-[10px] font-bold text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {copy.remove}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {[
              [copy.legalName, profile.legalName],
              [copy.emailAddress, profile.email],
              [copy.phone, profile.phone],
              [copy.city, profile.city],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[16px] border border-[var(--portal-border)] bg-[var(--portal-surface-2)] px-4 py-4"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--portal-faint)]">
                  {label}
                </span>
                <strong className="mt-2 block break-words text-[12px]">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[17px] font-black tracking-[-0.04em]">
                {copy.publicProfile}
              </h2>
              <p className="mt-1 text-[10px] text-[var(--portal-muted)]">
                {copy.legalHelper}
              </p>
            </div>
          </div>

          <label className="mt-5 block">
            <span className={labelClass}>{copy.displayName}</span>
            <input
              value={displayName}
              maxLength={160}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={profile.legalName}
              className={inputClass}
            />
            <span className="mt-2 block text-[10px] leading-5 text-[var(--portal-muted)]">
              {copy.displayHelper}
            </span>
          </label>
        </section>
      </div>

      <div className="space-y-5">
        {error && (
          <div className="rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-[16px] border border-[var(--portal-green)]/20 bg-[var(--portal-green-soft)] px-4 py-3 text-[11px] text-[var(--portal-green)]">
            {success}
          </div>
        )}

        <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
            <Languages className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-[17px] font-black tracking-[-0.04em]">
            {copy.languagePreference}
          </h2>
          <p className="mt-2 text-[10px] leading-5 text-[var(--portal-muted)]">
            {copy.languageHelper}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["en", "am"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreferredLanguage(value)}
                className={`h-12 rounded-[14px] border text-[10px] font-extrabold transition ${
                  preferredLanguage === value
                    ? "border-[var(--portal-green)] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
                    : "border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"
                }`}
              >
                {value === "en" ? copy.english : copy.amharic}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveProfile()}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-[var(--portal-green)] text-[10px] font-extrabold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? copy.saving : copy.saveProfile}
          </button>
        </section>

        <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--portal-green-soft)] text-[var(--portal-green)]">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-[17px] font-black tracking-[-0.04em]">
            {copy.accountSecurity}
          </h2>
          <p className="mt-2 text-[10px] leading-5 text-[var(--portal-muted)]">
            {copy.securityHelper}
          </p>
          <button
            type="button"
            onClick={() => router.push("/representative/change-password")}
            className="mt-5 h-11 w-full rounded-[13px] bg-[var(--portal-green-soft)] text-[10px] font-extrabold text-[var(--portal-green)]"
          >
            {copy.changePassword}
          </button>
        </section>

        <section className="rounded-[24px] border border-[var(--portal-border)] bg-[var(--portal-surface)] p-5 shadow-[0_12px_40px_var(--portal-shadow)] sm:p-6">
          <h2 className="text-[15px] font-black">{copy.portalTheme}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onThemeChange("light")}
              className={`flex h-12 items-center justify-center gap-2 rounded-[14px] border text-[10px] font-extrabold ${
                !dark
                  ? "border-[var(--portal-green)] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
                  : "border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"
              }`}
            >
              <Sun className="h-4 w-4" />
              {copy.light}
            </button>
            <button
              type="button"
              onClick={() => onThemeChange("dark")}
              className={`flex h-12 items-center justify-center gap-2 rounded-[14px] border text-[10px] font-extrabold ${
                dark
                  ? "border-[var(--portal-green)] bg-[var(--portal-green-soft)] text-[var(--portal-green)]"
                  : "border-[var(--portal-border)] bg-[var(--portal-surface-2)] text-[var(--portal-muted)]"
              }`}
            >
              <Moon className="h-4 w-4" />
              {copy.dark}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[13px] border border-red-400/20 bg-red-500/10 text-[10px] font-extrabold text-red-400"
          >
            <LogOut className="h-4 w-4" />
            {copy.logout}
          </button>
        </section>
      </div>
    </div>
  );
}
