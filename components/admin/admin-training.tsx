"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import AdminShell from "@/components/admin/admin-shell";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import {
  createTrainingCourse,
  createTrainingLesson,
  createTrainingResource,
  createTrainingSection,
  deleteTrainingCourse,
  deleteTrainingLesson,
  deleteTrainingResource,
  deleteTrainingSection,
  getTrainingCourses,
  updateTrainingCourse,
  updateTrainingLesson,
  updateTrainingResource,
  updateTrainingSection,
  uploadTrainingVideo,

  type TrainingCourse,
  type TrainingCourseInput,
  type TrainingLanguage,
  type TrainingLesson,
  type TrainingLessonInput,
  type TrainingResource,
  type TrainingResourceInput,
  type TrainingSection,
  type TrainingSectionInput,
} from "@/lib/admin-training-api";

const inputClass =
  "w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-[12px] font-medium text-[#20251d] outline-none transition placeholder:text-black/25 focus:border-[#9fd36d] focus:ring-4 focus:ring-[#b9ef84]/15";

const textareaClass =
  `${inputClass} min-h-[110px] resize-y leading-6`;

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#20251d] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#2d3528] disabled:cursor-not-allowed disabled:opacity-50";

const ghostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#31372d] transition hover:border-[#b9ef84] hover:bg-[#f8fff1] disabled:cursor-not-allowed disabled:opacity-50";

function slugify(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function formatDuration(
  seconds: number,
) {
  if (
    !seconds
  ) {
    return "0m";
  }

  const hours =
    Math.floor(
      seconds /
        3600,
    );

  const minutes =
    Math.floor(
      (seconds %
        3600) /
        60,
    );

  const remainingSeconds =
    seconds %
    60;

  if (
    hours >
    0
  ) {
    return `${hours}h ${minutes}m`;
  }

  if (
    minutes >
    0
  ) {
    return remainingSeconds >
      0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  return `${remainingSeconds}s`;
}

function Field({
  label,
  hint,
  children,
  full = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label
      className={
        full
          ? "block lg:col-span-2"
          : "block"
      }
    >
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.13em] text-[#70776c]">
        {label}
      </span>

      {children}

      {hint ? (
        <span className="mt-1.5 block text-[9px] leading-4 text-black/35">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#10130e]/45 p-3 backdrop-blur-sm sm:p-6">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default"
        onClick={
          onClose
        }
      />

      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[24px] border border-white/70 bg-[#fbfcf9] shadow-[0_30px_100px_rgba(12,18,9,0.25)] ${
          wide
            ? "max-w-4xl"
            : "max-w-2xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-black/[0.06] bg-[#fbfcf9]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#20251d]">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-black/45">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/55 transition hover:bg-black/[0.03]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}

function FormError({
  message,
}: {
  message: string;
}) {
  if (
    !message
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[10px] font-semibold leading-5 text-red-700">
      {message}
    </div>
  );
}

function CourseEditor({
  course,
  language,
  onClose,
  onSave,
}: {
  course?:
    TrainingCourse;

  language:
    TrainingLanguage;

  onClose:
    () => void;

  onSave:
    (
      input:
        TrainingCourseInput,
    ) => Promise<void>;
}) {
  const isAm =
    language ===
    "am";

  const [
    form,
    setForm,
  ] =
    useState<TrainingCourseInput>({
      slug:
        course?.slug ??
        "",

      titleEn:
        course?.titleEn ??
        "",

      titleAm:
        course?.titleAm ??
        "",

      descriptionEn:
        course?.descriptionEn ??
        "",

      descriptionAm:
        course?.descriptionAm ??
        "",

      status:
        course?.status ??
        "draft",

      sortOrder:
        course?.sortOrder ??
        0,
    });

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

  async function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setError("");

    const payload = {
      ...form,

      slug:
        form.slug.trim() ||
        slugify(
          form.titleEn,
        ),

      titleEn:
        form.titleEn.trim(),

      titleAm:
        form.titleAm.trim(),
    };

    if (
      !payload.slug ||
      !payload.titleEn ||
      !payload.titleAm
    ) {
      setError(
        isAm
          ? "Slug፣ English title እና Amharic title ያስፈልጋሉ።"
          : "Slug, English title and Amharic title are required.",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      await onSave(
        payload,
      );
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save course.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-5"
    >
      <FormError
        message={
          error
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="English title">
          <input
            className={
              inputClass
            }
            value={
              form.titleEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  titleEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="Representative Sales Fundamentals"
          />
        </Field>

        <Field label="Amharic title">
          <input
            className={
              inputClass
            }
            value={
              form.titleAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  titleAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="የሽያጭ መሰረታዊ ስልጠና"
          />
        </Field>

        <Field
          label="Slug"
          hint={
            isAm
              ? "Public URL / internal identifier. lowercase እና hyphen ብቻ።"
              : "Internal/public identifier. Use lowercase letters, numbers and hyphens."
          }
        >
          <input
            className={
              inputClass
            }
            value={
              form.slug
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  slug:
                    slugify(
                      event
                        .target
                        .value,
                    ),
                }),
              )
            }
            placeholder="sales-fundamentals"
          />
        </Field>

        <Field label="Status">
          <select
            className={
              inputClass
            }
            value={
              form.status
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  status:
                    event
                      .target
                      .value as
                      TrainingCourseInput["status"],
                }),
              )
            }
          >
            <option value="draft">
              Draft
            </option>

            <option value="published">
              Published
            </option>
          </select>
        </Field>

        <Field
          label="English description"
          full
        >
          <textarea
            className={
              textareaClass
            }
            value={
              form.descriptionEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  descriptionEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="What will representatives learn from this course?"
          />
        </Field>

        <Field
          label="Amharic description"
          full
        >
          <textarea
            className={
              textareaClass
            }
            value={
              form.descriptionAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  descriptionAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="ተወካዮች ከዚህ course ምን ይማራሉ?"
          />
        </Field>

        <Field
          label={
            isAm
              ? "Order"
              : "Sort order"
          }
        >
          <input
            type="number"
            min={
              0
            }
            className={
              inputClass
            }
            value={
              form.sortOrder
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  sortOrder:
                    Number(
                      event
                        .target
                        .value,
                    ) ||
                    0,
                }),
              )
            }
          />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] pt-5">
        <button
          type="button"
          onClick={
            onClose
          }
          className={
            ghostButtonClass
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className={
            primaryButtonClass
          }
          disabled={
            saving
          }
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving
            ? "Saving..."
            : isAm
              ? "Course አስቀምጥ"
              : "Save course"}
        </button>
      </div>
    </form>
  );
}

function SectionEditor({
  section,
  language,
  onClose,
  onSave,
}: {
  section?:
    TrainingSection;

  language:
    TrainingLanguage;

  onClose:
    () => void;

  onSave:
    (
      input:
        TrainingSectionInput,
    ) => Promise<void>;
}) {
  const isAm =
    language ===
    "am";

  const [
    form,
    setForm,
  ] =
    useState<TrainingSectionInput>({
      titleEn:
        section?.titleEn ??
        "",

      titleAm:
        section?.titleAm ??
        "",

      descriptionEn:
        section?.descriptionEn ??
        "",

      descriptionAm:
        section?.descriptionAm ??
        "",

      sortOrder:
        section?.sortOrder ??
        0,
    });

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

  async function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setError("");

    if (
      !form.titleEn.trim() ||
      !form.titleAm.trim()
    ) {
      setError(
        isAm
          ? "English እና Amharic section title ያስፈልጋሉ።"
          : "English and Amharic section titles are required.",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      await onSave({
        ...form,

        titleEn:
          form.titleEn.trim(),

        titleAm:
          form.titleAm.trim(),
      });
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save section.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-5"
    >
      <FormError
        message={
          error
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="English section title">
          <input
            className={
              inputClass
            }
            value={
              form.titleEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  titleEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="Section 1: Getting Started"
          />
        </Field>

        <Field label="Amharic section title">
          <input
            className={
              inputClass
            }
            value={
              form.titleAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  titleAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="ክፍል 1፡ መጀመሪያ"
          />
        </Field>

        <Field
          label="English description"
          full
        >
          <textarea
            className={
              textareaClass
            }
            value={
              form.descriptionEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  descriptionEn:
                    event
                      .target
                      .value,
                }),
              )
            }
          />
        </Field>

        <Field
          label="Amharic description"
          full
        >
          <textarea
            className={
              textareaClass
            }
            value={
              form.descriptionAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  descriptionAm:
                    event
                      .target
                      .value,
                }),
              )
            }
          />
        </Field>

        <Field
          label={
            isAm
              ? "Order"
              : "Sort order"
          }
        >
          <input
            type="number"
            min={
              0
            }
            className={
              inputClass
            }
            value={
              form.sortOrder
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  sortOrder:
                    Number(
                      event
                        .target
                        .value,
                    ) ||
                    0,
                }),
              )
            }
          />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] pt-5">
        <button
          type="button"
          onClick={
            onClose
          }
          className={
            ghostButtonClass
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className={
            primaryButtonClass
          }
          disabled={
            saving
          }
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving
            ? "Saving..."
            : isAm
              ? "Section አስቀምጥ"
              : "Save section"}
        </button>
      </div>
    </form>
  );
}

function LessonEditor({
  lesson,
  language,
  onClose,
  onSave,
}: {
  lesson?:
    TrainingLesson;

  language:
    TrainingLanguage;

  onClose:
    () => void;

  onSave:
    (
      input:
        TrainingLessonInput,
    ) => Promise<void>;
}) {
  const isAm =
    language ===
    "am";

  const initialVideoUrl =
    lesson?.videoUrl ??
    "";

  const initialVideoPublicId =
    lesson?.videoPublicId ??
    "";

  const [
    form,
    setForm,
  ] =
    useState({
      titleEn:
        lesson?.titleEn ??
        "",

      titleAm:
        lesson?.titleAm ??
        "",

      summaryEn:
        lesson?.summaryEn ??
        "",

      summaryAm:
        lesson?.summaryAm ??
        "",

      notesEn:
        lesson?.notesEn ??
        "",

      notesAm:
        lesson?.notesAm ??
        "",

      videoUrl:
        initialVideoUrl,

      durationSeconds:
        lesson?.durationSeconds ??
        0,

      sortOrder:
        lesson?.sortOrder ??
        0,

      isPreview:
        lesson?.isPreview ??
        false,
    });

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setError("");

    if (
      !form.titleEn.trim() ||
      !form.titleAm.trim()
    ) {
      setError(
        isAm
          ? "English እና Amharic lesson title ያስፈልጋሉ።"
          : "English and Amharic lesson titles are required.",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      let videoUrl =
        form.videoUrl.trim();

      let videoPublicId =
        initialVideoPublicId;

      let durationSeconds =
        form.durationSeconds;

      if (
        selectedFile
      ) {
        setUploading(
          true,
        );

        const uploaded =
          await uploadTrainingVideo(
            selectedFile,
            language,
          );

        videoUrl =
          uploaded.secureUrl;

        videoPublicId =
          uploaded.publicId;

        durationSeconds =
          uploaded.durationSeconds ||
          durationSeconds;

        setUploading(
          false,
        );
      } else if (
        initialVideoPublicId &&
        videoUrl !==
          initialVideoUrl
      ) {
        videoPublicId =
          "";
      }

      await onSave({
        titleEn:
          form.titleEn.trim(),

        titleAm:
          form.titleAm.trim(),

        summaryEn:
          form.summaryEn.trim(),

        summaryAm:
          form.summaryAm.trim(),

        notesEn:
          form.notesEn.trim(),

        notesAm:
          form.notesAm.trim(),

        videoUrl,

        videoPublicId,

        durationSeconds,

        sortOrder:
          form.sortOrder,

        isPreview:
          form.isPreview,
      });
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save lesson.",
      );
    } finally {
      setUploading(
        false,
      );

      setSaving(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-6"
    >
      <FormError
        message={
          error
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="English lesson title">
          <input
            className={
              inputClass
            }
            value={
              form.titleEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  titleEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="Introduction"
          />
        </Field>

        <Field label="Amharic lesson title">
          <input
            className={
              inputClass
            }
            value={
              form.titleAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  titleAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="መግቢያ"
          />
        </Field>

        <Field
          label="English short overview"
          full
        >
          <textarea
            className={
              textareaClass
            }
            value={
              form.summaryEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  summaryEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="A short overview shown beside/below the lesson video."
          />
        </Field>

        <Field
          label="Amharic short overview"
          full
        >
          <textarea
            className={
              textareaClass
            }
            value={
              form.summaryAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  summaryAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="ከvideo ጋር የሚታይ አጭር ማብራሪያ።"
          />
        </Field>

        <Field
          label="English notes"
          full
        >
          <textarea
            className={`${textareaClass} min-h-[160px]`}
            value={
              form.notesEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  notesEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="Key points, steps, reminders, examples..."
          />
        </Field>

        <Field
          label="Amharic notes"
          full
        >
          <textarea
            className={`${textareaClass} min-h-[160px]`}
            value={
              form.notesAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  notesAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="ዋና ነጥቦች፣ steps፣ reminders..."
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-[#dcebd0] bg-[#f9fff4] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#b9ef84]/35 text-[#4c712f]">
            <Video className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-[12px] font-black text-[#20251d]">
              Lesson video
            </h3>

            <p className="mt-1 text-[9px] leading-5 text-black/40">
              {isAm
                ? "Video file upload ያድርጉ ወይም YouTube/Vimeo/direct video URL ያስገቡ።"
                : "Upload a video file, or paste a YouTube/Vimeo/direct video URL."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field
            label="Video URL"
            hint={
              initialVideoPublicId
                ? isAm
                  ? "URL ካስተካከሉ old uploaded video ይተካል/ይወገዳል።"
                  : "Editing this URL detaches the currently uploaded video."
                : undefined
            }
          >
            <input
              className={
                inputClass
              }
              value={
                form.videoUrl
              }
              onChange={(
                event,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    videoUrl:
                      event
                        .target
                        .value,
                  }),
                )
              }
              placeholder="https://..."
            />
          </Field>

          <Field
            label="Upload video file"
            hint="MP4 / WEBM / MOV / M4V — Phase 1 max 100 MB"
          >
            <label className="flex min-h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#a8c98c] bg-white px-3.5 py-2.5 transition hover:bg-[#fbfff7]">
              <Upload className="h-4 w-4 text-[#638d44]" />

              <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-[#394233]">
                {selectedFile?.name ??
                  (isAm
                    ? "Video ምረጥ"
                    : "Choose video")}
              </span>

              <input
                type="file"
                className="hidden"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                onChange={(
                  event,
                ) =>
                  setSelectedFile(
                    event
                      .target
                      .files?.[0] ??
                      null,
                  )
                }
              />
            </label>
          </Field>

          <Field
            label="Duration (seconds)"
            hint={
              isAm
                ? "Uploaded video ላይ duration auto-detect ይደረጋል።"
                : "Uploaded videos replace this with the detected duration."
            }
          >
            <input
              type="number"
              min={
                0
              }
              className={
                inputClass
              }
              value={
                form.durationSeconds
              }
              onChange={(
                event,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    durationSeconds:
                      Number(
                        event
                          .target
                          .value,
                      ) ||
                      0,
                  }),
                )
              }
            />
          </Field>

          <Field
            label={
              isAm
                ? "Order"
                : "Sort order"
            }
          >
            <input
              type="number"
              min={
                0
              }
              className={
                inputClass
              }
              value={
                form.sortOrder
              }
              onChange={(
                event,
              ) =>
                setForm(
                  (
                    current,
                  ) => ({
                    ...current,

                    sortOrder:
                      Number(
                        event
                          .target
                          .value,
                      ) ||
                      0,
                  }),
                )
              }
            />
          </Field>
        </div>

      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] pt-5">
        <button
          type="button"
          onClick={
            onClose
          }
          className={
            ghostButtonClass
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className={
            primaryButtonClass
          }
          disabled={
            saving
          }
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {uploading
            ? isAm
              ? "Video uploading..."
              : "Uploading video..."
            : saving
              ? "Saving..."
              : isAm
                ? "Lesson አስቀምጥ"
                : "Save lesson"}
        </button>
      </div>
    </form>
  );
}

function ResourceEditor({
  resource,
  language,
  onClose,
  onSave,
}: {
  resource?:
    TrainingResource;

  language:
    TrainingLanguage;

  onClose:
    () => void;

  onSave:
    (
      input:
        TrainingResourceInput,
    ) => Promise<void>;
}) {
  const isAm =
    language ===
    "am";

  const [
    form,
    setForm,
  ] =
    useState<TrainingResourceInput>({
      labelEn:
        resource?.labelEn ??
        "",

      labelAm:
        resource?.labelAm ??
        "",

      url:
        resource?.url ??
        "",

      sortOrder:
        resource?.sortOrder ??
        0,
    });

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

  async function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    setError("");

    if (
      !form.labelEn.trim() ||
      !form.labelAm.trim() ||
      !form.url.trim()
    ) {
      setError(
        isAm
          ? "Resource label እና URL ያስፈልጋሉ።"
          : "Resource labels and URL are required.",
      );

      return;
    }

    try {
      setSaving(
        true,
      );

      await onSave({
        ...form,

        labelEn:
          form.labelEn.trim(),

        labelAm:
          form.labelAm.trim(),

        url:
          form.url.trim(),
      });
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save resource.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-5"
    >
      <FormError
        message={
          error
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="English label">
          <input
            className={
              inputClass
            }
            value={
              form.labelEn
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  labelEn:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="Sales script PDF"
          />
        </Field>

        <Field label="Amharic label">
          <input
            className={
              inputClass
            }
            value={
              form.labelAm
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  labelAm:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="የሽያጭ script PDF"
          />
        </Field>

        <Field
          label="Resource URL"
          full
        >
          <input
            className={
              inputClass
            }
            value={
              form.url
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  url:
                    event
                      .target
                      .value,
                }),
              )
            }
            placeholder="https://..."
          />
        </Field>

        <Field
          label={
            isAm
              ? "Order"
              : "Sort order"
          }
        >
          <input
            type="number"
            min={
              0
            }
            className={
              inputClass
            }
            value={
              form.sortOrder
            }
            onChange={(
              event,
            ) =>
              setForm(
                (
                  current,
                ) => ({
                  ...current,

                  sortOrder:
                    Number(
                      event
                        .target
                        .value,
                    ) ||
                    0,
                }),
              )
            }
          />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] pt-5">
        <button
          type="button"
          onClick={
            onClose
          }
          className={
            ghostButtonClass
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>

        <button
          type="submit"
          className={
            primaryButtonClass
          }
          disabled={
            saving
          }
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving
            ? "Saving..."
            : isAm
              ? "Resource አስቀምጥ"
              : "Save resource"}
        </button>
      </div>
    </form>
  );
}

type EditorState =
  | {
      kind:
        "course";

      mode:
        "create";
    }
  | {
      kind:
        "course";

      mode:
        "edit";

      course:
        TrainingCourse;
    }
  | {
      kind:
        "section";

      mode:
        "create";

      courseId:
        string;
    }
  | {
      kind:
        "section";

      mode:
        "edit";

      courseId:
        string;

      section:
        TrainingSection;
    }
  | {
      kind:
        "lesson";

      mode:
        "create";

      courseId:
        string;

      sectionId:
        string;
    }
  | {
      kind:
        "lesson";

      mode:
        "edit";

      courseId:
        string;

      sectionId:
        string;

      lesson:
        TrainingLesson;
    }
  | {
      kind:
        "resource";

      mode:
        "create";

      courseId:
        string;

      lessonId:
        string;
    }
  | {
      kind:
        "resource";

      mode:
        "edit";

      courseId:
        string;

      lessonId:
        string;

      resource:
        TrainingResource;
    }
  | null;

export default function AdminTraining() {
  const {
    language,
  } =
    useLanguage();

  const apiLanguage:
    TrainingLanguage =
      language ===
      "am"
        ? "am"
        : "en";

  const isAm =
    apiLanguage ===
    "am";

  const [
    courses,
    setCourses,
  ] =
    useState<
      TrainingCourse[]
    >([]);

  const [
    selectedCourseId,
    setSelectedCourseId,
  ] =
    useState<
      string | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    editor,
    setEditor,
  ] =
    useState<EditorState>(
      null,
    );

  const [
    collapsedSections,
    setCollapsedSections,
  ] =
    useState<
      Set<string>
    >(
      new Set(),
    );

  /* =======================================================
     MANUAL REFRESH

     This is only called from button/form actions.

     It is NOT called from useEffect.
     ======================================================= */

  async function refreshCourses(
    preferredCourseId?:
      | string
      | null,
  ) {
    try {
      setRefreshing(
        true,
      );

      setError("");

      const nextCourses =
        await getTrainingCourses(
          apiLanguage,
        );

      setCourses(
        nextCourses,
      );

      setSelectedCourseId(
        (
          current,
        ) => {
          if (
            preferredCourseId &&
            nextCourses.some(
              (
                course,
              ) =>
                course.id ===
                preferredCourseId,
            )
          ) {
            return preferredCourseId;
          }

          if (
            current &&
            nextCourses.some(
              (
                course,
              ) =>
                course.id ===
                current,
            )
          ) {
            return current;
          }

          return (
            nextCourses[0]
              ?.id ??
            null
          );
        },
      );
    } catch (
      loadError
    ) {
      setError(
        loadError instanceof
          Error
          ? loadError.message
          : "Unable to load training courses.",
      );
    } finally {
      setRefreshing(
        false,
      );
    }
  }

  /* =======================================================
     INITIAL LOAD

     No synchronous setState call is made when this
     effect begins.

     State changes only happen from Promise callbacks.
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      getTrainingCourses(
        apiLanguage,
      )
        .then(
          (
            nextCourses,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            setCourses(
              nextCourses,
            );

            setSelectedCourseId(
              (
                current,
              ) => {
                if (
                  current &&
                  nextCourses.some(
                    (
                      course,
                    ) =>
                      course.id ===
                      current,
                  )
                ) {
                  return current;
                }

                return (
                  nextCourses[0]
                    ?.id ??
                  null
                );
              },
            );

            setError("");
          },
        )
        .catch(
          (
            loadError:
              unknown,
          ) => {
            if (
              cancelled
            ) {
              return;
            }

            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load training courses.",
            );
          },
        )
        .finally(
          () => {
            if (
              !cancelled
            ) {
              setLoading(
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
      apiLanguage,
    ],
  );

  const selectedCourse =
    useMemo(
      () =>
        courses.find(
          (
            course,
          ) =>
            course.id ===
            selectedCourseId,
        ) ??
        null,

      [
        courses,
        selectedCourseId,
      ],
    );

  const filteredCourses =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return courses;
        }

        return courses.filter(
          (
            course,
          ) =>
            [
              course.titleEn,
              course.titleAm,
              course.slug,
            ].some(
              (
                value,
              ) =>
                value
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            ),
        );
      },

      [
        courses,
        search,
      ],
    );

  const stats =
    useMemo(
      () => {
        let sections =
          0;

        let lessons =
          0;

        let resources =
          0;

        for (
          const course of
          courses
        ) {
          sections +=
            course
              .sections
              .length;

          for (
            const section of
            course.sections
          ) {
            lessons +=
              section
                .lessons
                .length;

            for (
              const lesson of
              section.lessons
            ) {
              resources +=
                lesson
                  .resources
                  .length;
            }
          }
        }

        return {
          courses:
            courses.length,

          sections,

          lessons,

          resources,
        };
      },

      [
        courses,
      ],
    );

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function saveCourse(
    input:
      TrainingCourseInput,
  ) {
    if (
      !editor ||
      editor.kind !==
        "course"
    ) {
      return;
    }

    if (
      editor.mode ===
      "create"
    ) {
      await createTrainingCourse(
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Course ተፈጥሯል።"
          : "Course created successfully.",
      );

      setEditor(
        null,
      );

      await refreshCourses();

      return;
    }

    await updateTrainingCourse(
      editor.course.id,
      input,
      apiLanguage,
    );

    setSuccess(
      isAm
        ? "Course ተቀይሯል።"
        : "Course updated successfully.",
    );

    setEditor(
      null,
    );

    await refreshCourses(
      editor.course.id,
    );
  }

  async function saveSection(
    input:
      TrainingSectionInput,
  ) {
    if (
      !editor ||
      editor.kind !==
        "section"
    ) {
      return;
    }

    if (
      editor.mode ===
      "create"
    ) {
      await createTrainingSection(
        editor.courseId,
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Section ተፈጥሯል።"
          : "Section created successfully.",
      );
    } else {
      await updateTrainingSection(
        editor.section.id,
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Section ተቀይሯል።"
          : "Section updated successfully.",
      );
    }

    const courseId =
      editor.courseId;

    setEditor(
      null,
    );

    await refreshCourses(
      courseId,
    );
  }

  async function saveLesson(
    input:
      TrainingLessonInput,
  ) {
    if (
      !editor ||
      editor.kind !==
        "lesson"
    ) {
      return;
    }

    if (
      editor.mode ===
      "create"
    ) {
      await createTrainingLesson(
        editor.sectionId,
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Lesson ተፈጥሯል።"
          : "Lesson created successfully.",
      );
    } else {
      await updateTrainingLesson(
        editor.lesson.id,
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Lesson ተቀይሯል።"
          : "Lesson updated successfully.",
      );
    }

    const courseId =
      editor.courseId;

    setEditor(
      null,
    );

    await refreshCourses(
      courseId,
    );
  }

  async function saveResource(
    input:
      TrainingResourceInput,
  ) {
    if (
      !editor ||
      editor.kind !==
        "resource"
    ) {
      return;
    }

    if (
      editor.mode ===
      "create"
    ) {
      await createTrainingResource(
        editor.lessonId,
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Resource ተጨምሯል።"
          : "Resource added successfully.",
      );
    } else {
      await updateTrainingResource(
        editor.resource.id,
        input,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Resource ተቀይሯል።"
          : "Resource updated successfully.",
      );
    }

    const courseId =
      editor.courseId;

    setEditor(
      null,
    );

    await refreshCourses(
      courseId,
    );
  }

  async function removeCourse(
    course:
      TrainingCourse,
  ) {
    if (
      !window.confirm(
        isAm
          ? `“${course.titleAm}” course እና ውስጡ ያሉ sections/lessons በሙሉ ይሰረዛሉ። ቀጥል?`
          : `Delete “${course.titleEn}” and every section, lesson and resource inside it?`,
      )
    ) {
      return;
    }

    try {
      clearMessages();

      await deleteTrainingCourse(
        course.id,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Course ተሰርዟል።"
          : "Course deleted successfully.",
      );

      await refreshCourses();
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete course.",
      );
    }
  }

  async function removeSection(
    courseId:
      string,

    section:
      TrainingSection,
  ) {
    if (
      !window.confirm(
        isAm
          ? `“${section.titleAm}” section እና ውስጡ ያሉ lessons ይሰረዛሉ። ቀጥል?`
          : `Delete “${section.titleEn}” and all lessons inside it?`,
      )
    ) {
      return;
    }

    try {
      clearMessages();

      await deleteTrainingSection(
        section.id,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Section ተሰርዟል።"
          : "Section deleted successfully.",
      );

      await refreshCourses(
        courseId,
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete section.",
      );
    }
  }

  async function removeLesson(
    courseId:
      string,

    lesson:
      TrainingLesson,
  ) {
    if (
      !window.confirm(
        isAm
          ? `“${lesson.titleAm}” lesson ይሰረዝ?`
          : `Delete “${lesson.titleEn}”?`,
      )
    ) {
      return;
    }

    try {
      clearMessages();

      await deleteTrainingLesson(
        lesson.id,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Lesson ተሰርዟል።"
          : "Lesson deleted successfully.",
      );

      await refreshCourses(
        courseId,
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete lesson.",
      );
    }
  }

  async function removeResource(
    courseId:
      string,

    resource:
      TrainingResource,
  ) {
    if (
      !window.confirm(
        isAm
          ? `“${resource.labelAm}” resource ይሰረዝ?`
          : `Delete resource “${resource.labelEn}”?`,
      )
    ) {
      return;
    }

    try {
      clearMessages();

      await deleteTrainingResource(
        resource.id,
        apiLanguage,
      );

      setSuccess(
        isAm
          ? "Resource ተሰርዟል።"
          : "Resource deleted successfully.",
      );

      await refreshCourses(
        courseId,
      );
    } catch (
      deleteError
    ) {
      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete resource.",
      );
    }
  }

  function toggleSection(
    sectionId:
      string,
  ) {
    setCollapsedSections(
      (
        current,
      ) => {
        const next =
          new Set(
            current,
          );

        if (
          next.has(
            sectionId,
          )
        ) {
          next.delete(
            sectionId,
          );
        } else {
          next.add(
            sectionId,
          );
        }

        return next;
      },
    );
  }

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-5 lg:px-7 lg:py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dcebd0] bg-[#f7fff0] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] text-[#618b42]">
              <GraduationCap className="h-3.5 w-3.5" />

              TRAINING BUILDER
            </div>

            <h1 className="mt-3 text-[25px] font-black tracking-[-0.05em] text-[#20251d] sm:text-[30px]">
              {isAm
                ? "Courses እና Lessons"
                : "Courses & lessons"}
            </h1>

            <p className="mt-2 max-w-2xl text-[10px] leading-5 text-black/42 sm:text-[11px]">
              {isAm
                ? "Representative training ለመገንባት courses፣ sections፣ video lessons፣ notes እና resource links ከዚህ manage ያድርጉ።"
                : "Build representative training with courses, sections, video lessons, notes and resource links."}
            </p>
          </div>

          <button
            type="button"
            className={`${primaryButtonClass} min-h-11`}
            onClick={
              () => {
                clearMessages();

                setEditor({
                  kind:
                    "course",

                  mode:
                    "create",
                });
              }
            }
          >
            <Plus className="h-4 w-4" />

            {isAm
              ? "Course ጨምር"
              : "Add course"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            [
              "Courses",
              stats.courses,
              BookOpen,
            ],

            [
              "Sections",
              stats.sections,
              FileText,
            ],

            [
              "Lessons",
              stats.lessons,
              Video,
            ],

            [
              "Resources",
              stats.resources,
              Link2,
            ],
          ].map(
            ([
              label,
              value,
              Icon,
            ]) => {
              const StatIcon =
                Icon as
                  typeof BookOpen;

              return (
                <div
                  key={
                    String(
                      label,
                    )
                  }
                  className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_8px_30px_rgba(31,45,24,0.025)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-black/35">
                      {String(
                        label,
                      )}
                    </span>

                    <StatIcon className="h-4 w-4 text-[#79a956]" />
                  </div>

                  <div className="mt-3 text-[23px] font-black tracking-[-0.05em] text-[#20251d]">
                    {Number(
                      value,
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-xl border border-[#cfe7bb] bg-[#f5ffed] px-4 py-3 text-[10px] font-semibold text-[#537638]">
            {success}
          </div>
        ) : null}

        <div className="mt-5 grid min-h-[620px] gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
          <aside className="rounded-[22px] border border-black/[0.06] bg-white p-3 shadow-[0_8px_30px_rgba(31,45,24,0.025)] sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/30" />

              <input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event
                      .target
                      .value,
                  )
                }
                className="w-full rounded-xl border border-black/[0.07] bg-[#fafbf8] py-2.5 pl-9 pr-3 text-[10px] font-semibold outline-none focus:border-[#acd782]"
                placeholder={
                  isAm
                    ? "Courses ፈልግ..."
                    : "Search courses..."
                }
              />
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="flex min-h-44 items-center justify-center text-black/35">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredCourses.length ===
                0 ? (
                <div className="rounded-2xl border border-dashed border-black/[0.1] px-4 py-10 text-center">
                  <BookOpen className="mx-auto h-5 w-5 text-black/25" />

                  <p className="mt-3 text-[10px] font-bold text-black/45">
                    {isAm
                      ? "Course አልተገኘም።"
                      : "No courses found."}
                  </p>
                </div>
              ) : (
                filteredCourses.map(
                  (
                    course,
                  ) => {
                    const lessonCount =
                      course.sections.reduce(
                        (
                          total,
                          section,
                        ) =>
                          total +
                          section
                            .lessons
                            .length,

                        0,
                      );

                    const active =
                      selectedCourseId ===
                      course.id;

                    return (
                      <button
                        key={
                          course.id
                        }
                        type="button"
                        onClick={
                          () =>
                            setSelectedCourseId(
                              course.id,
                            )
                        }
                        className={`w-full rounded-2xl border p-3.5 text-left transition ${
                          active
                            ? "border-[#b8df96] bg-[#f7ffef] shadow-[0_5px_20px_rgba(84,126,49,0.08)]"
                            : "border-black/[0.055] bg-white hover:border-[#d3e7c1] hover:bg-[#fbfef8]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-black text-[#292f26]">
                              {isAm
                                ? course.titleAm
                                : course.titleEn}
                            </p>

                            <p className="mt-1 truncate text-[8px] font-semibold text-black/30">
                              /
                              {
                                course.slug
                              }
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[0.1em] ${
                              course.status ===
                              "published"
                                ? "bg-[#dff6cd] text-[#527b35]"
                                : "bg-black/[0.05] text-black/40"
                            }`}
                          >
                            {
                              course.status
                            }
                          </span>
                        </div>

                        <div className="mt-3 flex gap-3 text-[8px] font-bold text-black/35">
                          <span>
                            {
                              course
                                .sections
                                .length
                            }{" "}
                            sections
                          </span>

                          <span>
                            {
                              lessonCount
                            }{" "}
                            lessons
                          </span>
                        </div>
                      </button>
                    );
                  },
                )
              )}
            </div>
          </aside>

          <main className="min-w-0 rounded-[22px] border border-black/[0.06] bg-[#fbfcf9] shadow-[0_8px_30px_rgba(31,45,24,0.025)]">
            {selectedCourse ? (
              <>
                <div className="border-b border-black/[0.06] p-4 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] ${
                            selectedCourse.status ===
                            "published"
                              ? "bg-[#dff6cd] text-[#527b35]"
                              : "bg-black/[0.05] text-black/40"
                          }`}
                        >
                          {
                            selectedCourse.status
                          }
                        </span>

                        <span className="text-[8px] font-bold text-black/30">
                          Order{" "}
                          {
                            selectedCourse.sortOrder
                          }
                        </span>

                        {refreshing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-black/30" />
                        ) : null}
                      </div>

                      <h2 className="mt-3 text-[20px] font-black tracking-[-0.045em] text-[#20251d] sm:text-[24px]">
                        {isAm
                          ? selectedCourse.titleAm
                          : selectedCourse.titleEn}
                      </h2>

                      <p className="mt-2 max-w-3xl text-[10px] leading-5 text-black/42">
                        {(isAm
                          ? selectedCourse.descriptionAm
                          : selectedCourse.descriptionEn) ||
                          (isAm
                            ? "Description የለም።"
                            : "No course description yet.")}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        className={
                          ghostButtonClass
                        }
                        onClick={
                          () =>
                            setEditor({
                              kind:
                                "course",

                              mode:
                                "edit",

                              course:
                                selectedCourse,
                            })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />

                        Edit
                      </button>

                      <button
                        type="button"
                        className={`${ghostButtonClass} text-red-600 hover:border-red-200 hover:bg-red-50`}
                        onClick={
                          () =>
                            void removeCourse(
                              selectedCourse,
                            )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />

                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[14px] font-black tracking-[-0.035em] text-[#20251d]">
                        Course content
                      </h3>

                      <p className="mt-1 text-[9px] text-black/35">
                        {isAm
                          ? "Udemy-style sections እና lessons ከዚህ build ያድርጉ።"
                          : "Build the section and lesson structure that will power the learner view."}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={
                        ghostButtonClass
                      }
                      onClick={
                        () =>
                          setEditor({
                            kind:
                              "section",

                            mode:
                              "create",

                            courseId:
                              selectedCourse.id,
                          })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />

                      {isAm
                        ? "Section ጨምር"
                        : "Add section"}
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {selectedCourse.sections.length ===
                    0 ? (
                      <div className="rounded-2xl border border-dashed border-black/[0.1] bg-white px-5 py-12 text-center">
                        <FileText className="mx-auto h-6 w-6 text-black/20" />

                        <h4 className="mt-3 text-[11px] font-black text-[#343b30]">
                          {isAm
                            ? "እስካሁን section የለም"
                            : "No sections yet"}
                        </h4>

                        <p className="mx-auto mt-1 max-w-md text-[9px] leading-5 text-black/35">
                          {isAm
                            ? "Course content ለመጀመር first section ይፍጠሩ።"
                            : "Create the first section, then add video lessons and resources inside it."}
                        </p>
                      </div>
                    ) : (
                      selectedCourse.sections.map(
                        (
                          section,
                          sectionIndex,
                        ) => {
                          const collapsed =
                            collapsedSections.has(
                              section.id,
                            );

                          return (
                            <section
                              key={
                                section.id
                              }
                              className="overflow-hidden rounded-2xl border border-black/[0.065] bg-white"
                            >
                              <div className="flex flex-col gap-3 bg-[#f8faf6] p-4 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                  type="button"
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                  onClick={
                                    () =>
                                      toggleSection(
                                        section.id,
                                      )
                                  }
                                >
                                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e8f6dc] text-[10px] font-black text-[#5a813c]">
                                    {sectionIndex +
                                      1}
                                  </span>

                                  <span className="min-w-0">
                                    <span className="block truncate text-[11px] font-black text-[#282e25]">
                                      {isAm
                                        ? section.titleAm
                                        : section.titleEn}
                                    </span>

                                    <span className="mt-1 block text-[8px] font-semibold text-black/32">
                                      {
                                        section
                                          .lessons
                                          .length
                                      }{" "}
                                      lessons
                                    </span>
                                  </span>

                                  {collapsed ? (
                                    <ChevronDown className="ml-auto h-4 w-4 text-black/30" />
                                  ) : (
                                    <ChevronUp className="ml-auto h-4 w-4 text-black/30" />
                                  )}
                                </button>

                                <div className="flex flex-wrap gap-1.5 sm:pl-3">
                                  <button
                                    type="button"
                                    className={
                                      ghostButtonClass
                                    }
                                    onClick={
                                      () =>
                                        setEditor({
                                          kind:
                                            "section",

                                          mode:
                                            "edit",

                                          courseId:
                                            selectedCourse.id,

                                          section,
                                        })
                                    }
                                  >
                                    <Pencil className="h-3 w-3" />

                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className={
                                      ghostButtonClass
                                    }
                                    onClick={
                                      () =>
                                        setEditor({
                                          kind:
                                            "lesson",

                                          mode:
                                            "create",

                                          courseId:
                                            selectedCourse.id,

                                          sectionId:
                                            section.id,
                                        })
                                    }
                                  >
                                    <Plus className="h-3 w-3" />

                                    Lesson
                                  </button>

                                  <button
                                    type="button"
                                    className={`${ghostButtonClass} text-red-600 hover:border-red-200 hover:bg-red-50`}
                                    onClick={
                                      () =>
                                        void removeSection(
                                          selectedCourse.id,
                                          section,
                                        )
                                    }
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {!collapsed ? (
                                <div className="border-t border-black/[0.05] p-3 sm:p-4">
                                  {(isAm
                                    ? section.descriptionAm
                                    : section.descriptionEn) ? (
                                    <p className="mb-3 text-[9px] leading-5 text-black/38">
                                      {isAm
                                        ? section.descriptionAm
                                        : section.descriptionEn}
                                    </p>
                                  ) : null}

                                  {section.lessons.length ===
                                  0 ? (
                                    <button
                                      type="button"
                                      className="w-full rounded-xl border border-dashed border-black/[0.09] px-4 py-7 text-[9px] font-bold text-black/35 transition hover:border-[#bddca3] hover:bg-[#fbfff8]"
                                      onClick={
                                        () =>
                                          setEditor({
                                            kind:
                                              "lesson",

                                            mode:
                                              "create",

                                            courseId:
                                              selectedCourse.id,

                                            sectionId:
                                              section.id,
                                          })
                                      }
                                    >
                                      +{" "}
                                      {isAm
                                        ? "First lesson ጨምር"
                                        : "Add the first lesson"}
                                    </button>
                                  ) : (
                                    <div className="space-y-2.5">
                                      {section.lessons.map(
                                        (
                                          lesson,
                                          lessonIndex,
                                        ) => (
                                          <article
                                            key={
                                              lesson.id
                                            }
                                            className="rounded-xl border border-black/[0.055] bg-white p-3.5 sm:p-4"
                                          >
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                              <div className="flex min-w-0 gap-3">
                                                <div
                                                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                                                    lesson.videoUrl
                                                      ? "bg-[#e7f7d9] text-[#5b843b]"
                                                      : "bg-black/[0.04] text-black/35"
                                                  }`}
                                                >
                                                  {lesson.videoUrl ? (
                                                    <Video className="h-4 w-4" />
                                                  ) : (
                                                    <FileText className="h-4 w-4" />
                                                  )}
                                                </div>

                                                <div className="min-w-0">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-[10px] font-black text-[#2c3228]">
                                                      {lessonIndex +
                                                        1}
                                                      .{" "}
                                                      {isAm
                                                        ? lesson.titleAm
                                                        : lesson.titleEn}
                                                    </h4>
                                                  </div>

                                                  <div className="mt-1.5 flex flex-wrap gap-3 text-[8px] font-bold text-black/32">
                                                    <span className="inline-flex items-center gap-1">
                                                      <Clock className="h-3 w-3" />

                                                      {formatDuration(
                                                        lesson.durationSeconds,
                                                      )}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1">
                                                      <Link2 className="h-3 w-3" />

                                                      {
                                                        lesson
                                                          .resources
                                                          .length
                                                      }{" "}
                                                      resources
                                                    </span>

                                                    <span>
                                                      Order{" "}
                                                      {
                                                        lesson.sortOrder
                                                      }
                                                    </span>
                                                  </div>

                                                  {(isAm
                                                    ? lesson.summaryAm
                                                    : lesson.summaryEn) ? (
                                                    <p className="mt-2 line-clamp-2 max-w-3xl text-[9px] leading-5 text-black/38">
                                                      {isAm
                                                        ? lesson.summaryAm
                                                        : lesson.summaryEn}
                                                    </p>
                                                  ) : null}
                                                </div>
                                              </div>

                                              <div className="flex shrink-0 flex-wrap gap-1.5">
                                                <button
                                                  type="button"
                                                  className={
                                                    ghostButtonClass
                                                  }
                                                  onClick={
                                                    () =>
                                                      setEditor({
                                                        kind:
                                                          "lesson",

                                                        mode:
                                                          "edit",

                                                        courseId:
                                                          selectedCourse.id,

                                                        sectionId:
                                                          section.id,

                                                        lesson,
                                                      })
                                                  }
                                                >
                                                  <Pencil className="h-3 w-3" />

                                                  Edit
                                                </button>

                                                <button
                                                  type="button"
                                                  className={
                                                    ghostButtonClass
                                                  }
                                                  onClick={
                                                    () =>
                                                      setEditor({
                                                        kind:
                                                          "resource",

                                                        mode:
                                                          "create",

                                                        courseId:
                                                          selectedCourse.id,

                                                        lessonId:
                                                          lesson.id,
                                                      })
                                                  }
                                                >
                                                  <Plus className="h-3 w-3" />

                                                  Resource
                                                </button>

                                                <button
                                                  type="button"
                                                  className={`${ghostButtonClass} text-red-600 hover:border-red-200 hover:bg-red-50`}
                                                  onClick={
                                                    () =>
                                                      void removeLesson(
                                                        selectedCourse.id,
                                                        lesson,
                                                      )
                                                  }
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>
                                            </div>

                                            {lesson.resources.length >
                                            0 ? (
                                              <div className="mt-3 border-t border-black/[0.05] pt-3">
                                                <div className="flex flex-wrap gap-2">
                                                  {lesson.resources.map(
                                                    (
                                                      resource,
                                                    ) => (
                                                      <div
                                                        key={
                                                          resource.id
                                                        }
                                                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-black/[0.06] bg-[#fafbf8] px-2.5 py-2"
                                                      >
                                                        <Link2 className="h-3 w-3 shrink-0 text-[#6d984d]" />

                                                        <a
                                                          href={
                                                            resource.url
                                                          }
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="max-w-[220px] truncate text-[8px] font-bold text-[#46533d] hover:underline"
                                                        >
                                                          {isAm
                                                            ? resource.labelAm
                                                            : resource.labelEn}
                                                        </a>

                                                        <button
                                                          type="button"
                                                          onClick={
                                                            () =>
                                                              setEditor({
                                                                kind:
                                                                  "resource",

                                                                mode:
                                                                  "edit",

                                                                courseId:
                                                                  selectedCourse.id,

                                                                lessonId:
                                                                  lesson.id,

                                                                resource,
                                                              })
                                                          }
                                                          className="text-black/35 transition hover:text-black"
                                                        >
                                                          <Pencil className="h-3 w-3" />
                                                        </button>

                                                        <button
                                                          type="button"
                                                          onClick={
                                                            () =>
                                                              void removeResource(
                                                                selectedCourse.id,
                                                                resource,
                                                              )
                                                          }
                                                          className="text-black/30 transition hover:text-red-600"
                                                        >
                                                          <X className="h-3 w-3" />
                                                        </button>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            ) : null}
                                          </article>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </section>
                          );
                        },
                      )
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[620px] items-center justify-center p-8 text-center">
                <div>
                  <BookOpen className="mx-auto h-8 w-8 text-black/20" />

                  <h2 className="mt-4 text-[14px] font-black text-[#30372c]">
                    {loading
                      ? "Loading..."
                      : isAm
                        ? "Course ይፍጠሩ"
                        : "Create your first course"}
                  </h2>

                  {!loading ? (
                    <p className="mt-2 max-w-sm text-[9px] leading-5 text-black/35">
                      {isAm
                        ? "Course ከፈጠሩ በኋላ sections፣ video lessons፣ notes እና resources መጨመር ይችላሉ።"
                        : "Once a course exists, you can add sections, video lessons, notes and resources."}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {editor?.kind ===
      "course" ? (
        <Modal
          title={
            editor.mode ===
            "create"
              ? isAm
                ? "አዲስ Course"
                : "Add course"
              : isAm
                ? "Course አስተካክል"
                : "Edit course"
          }
          description={
            isAm
              ? "Course basic information፣ language content፣ status እና order ያዘጋጁ።"
              : "Configure the course basics, bilingual content, status and order."
          }
          onClose={
            () =>
              setEditor(
                null,
              )
          }
        >
          <CourseEditor
            key={
              editor.mode ===
              "edit"
                ? editor
                    .course
                    .id
                : "new-course"
            }
            course={
              editor.mode ===
              "edit"
                ? editor.course
                : undefined
            }
            language={
              apiLanguage
            }
            onClose={
              () =>
                setEditor(
                  null,
                )
            }
            onSave={
              saveCourse
            }
          />
        </Modal>
      ) : null}

      {editor?.kind ===
      "section" ? (
        <Modal
          title={
            editor.mode ===
            "create"
              ? isAm
                ? "Section ጨምር"
                : "Add section"
              : isAm
                ? "Section አስተካክል"
                : "Edit section"
          }
          description={
            isAm
              ? "Lessons የሚደራጁበት course section ያዘጋጁ።"
              : "Create a course section that will contain an ordered group of lessons."
          }
          onClose={
            () =>
              setEditor(
                null,
              )
          }
        >
          <SectionEditor
            key={
              editor.mode ===
              "edit"
                ? editor
                    .section
                    .id
                : `new-section-${editor.courseId}`
            }
            section={
              editor.mode ===
              "edit"
                ? editor.section
                : undefined
            }
            language={
              apiLanguage
            }
            onClose={
              () =>
                setEditor(
                  null,
                )
            }
            onSave={
              saveSection
            }
          />
        </Modal>
      ) : null}

      {editor?.kind ===
      "lesson" ? (
        <Modal
          wide
          title={
            editor.mode ===
            "create"
              ? isAm
                ? "Lesson ጨምር"
                : "Add lesson"
              : isAm
                ? "Lesson አስተካክል"
                : "Edit lesson"
          }
          description={
            isAm
              ? "Video፣ short overview፣ detailed notes እና lesson settings ያዘጋጁ። Resources ከlesson save በኋላ ይጨምሩ።"
              : "Configure the video, short overview, detailed notes and lesson settings. Resources are managed after the lesson is saved."
          }
          onClose={
            () =>
              setEditor(
                null,
              )
          }
        >
          <LessonEditor
            key={
              editor.mode ===
              "edit"
                ? editor
                    .lesson
                    .id
                : `new-lesson-${editor.sectionId}`
            }
            lesson={
              editor.mode ===
              "edit"
                ? editor.lesson
                : undefined
            }
            language={
              apiLanguage
            }
            onClose={
              () =>
                setEditor(
                  null,
                )
            }
            onSave={
              saveLesson
            }
          />
        </Modal>
      ) : null}

      {editor?.kind ===
      "resource" ? (
        <Modal
          title={
            editor.mode ===
            "create"
              ? isAm
                ? "Resource ጨምር"
                : "Add resource"
              : isAm
                ? "Resource አስተካክል"
                : "Edit resource"
          }
          description={
            isAm
              ? "Lesson ጋር የሚታይ external link/resource ያስገቡ።"
              : "Attach an external link or downloadable resource to this lesson."
          }
          onClose={
            () =>
              setEditor(
                null,
              )
          }
        >
          <ResourceEditor
            key={
              editor.mode ===
              "edit"
                ? editor
                    .resource
                    .id
                : `new-resource-${editor.lessonId}`
            }
            resource={
              editor.mode ===
              "edit"
                ? editor.resource
                : undefined
            }
            language={
              apiLanguage
            }
            onClose={
              () =>
                setEditor(
                  null,
                )
            }
            onSave={
              saveResource
            }
          />
        </Modal>
      ) : null}
    </AdminShell>
  );
}