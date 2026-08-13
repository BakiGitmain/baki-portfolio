"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  Menu,
  Play,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useLanguage,
} from "@/components/providers/language-provider";

import TrainingVideoPlayer from "@/components/representative/training-video-player";

import {
  getCurrentRepresentative,
  logoutRepresentative,
  RepresentativeApiError,
} from "@/lib/representative-api";

import RepresentativeSuspendedScreen, {
  type RepresentativeSuspension,
} from "@/components/representative/representative-suspended-screen";

import {
  getRepresentativeTrainingCourses,
  saveRepresentativeLessonProgress,

  type RepresentativeTrainingCourse,
  type RepresentativeTrainingLesson,
  type RepresentativeTrainingProgress,
} from "@/lib/representative-training-api";

/* =========================================================
   VIDEO URL HELPERS
   ========================================================= */

function getYouTubeVideoId(
  value:
    string | null,
) {
  if (
    !value
  ) {
    return null;
  }

  try {
    const url =
      new URL(
        value,
      );

    if (
      url.hostname ===
      "youtu.be"
    ) {
      return (
        url.pathname
          .replace(
            "/",
            "",
          )
          .trim() ||
        null
      );
    }

    if (
      url.hostname.includes(
        "youtube.com",
      )
    ) {
      if (
        url.pathname.startsWith(
          "/embed/",
        )
      ) {
        return (
          url.pathname
            .split(
              "/embed/",
            )[1]
            ?.split(
              "/",
            )[0] ||
          null
        );
      }

      return url.searchParams.get(
        "v",
      );
    }
  } catch {
    //
  }

  return null;
}

function getVimeoEmbedUrl(
  value:
    string | null,
) {
  if (
    !value
  ) {
    return null;
  }

  try {
    const url =
      new URL(
        value,
      );

    if (
      !url.hostname.includes(
        "vimeo.com",
      )
    ) {
      return null;
    }

    const id =
      url.pathname
        .split(
          "/",
        )
        .filter(
          Boolean,
        )[0];

    if (
      !id ||
      !/^\d+$/.test(
        id,
      )
    ) {
      return null;
    }

    return `https://player.vimeo.com/video/${id}`;
  } catch {
    return null;
  }
}

function formatDuration(
  seconds:
    number,
  videoLabel =
    "Video",
) {
  if (
    seconds <=
    0
  ) {
    return videoLabel;
  }

  const minutes =
    Math.floor(
      seconds /
        60,
    );

  const remainingSeconds =
    seconds %
    60;

  if (
    minutes >=
    60
  ) {
    const hours =
      Math.floor(
        minutes /
          60,
      );

    const remainingMinutes =
      minutes %
      60;

    return `${hours}h ${remainingMinutes}m`;
  }

  if (
    remainingSeconds >
    0
  ) {
    return `${minutes}:${String(
      remainingSeconds,
    ).padStart(
      2,
      "0",
    )}`;
  }

  return `${minutes}m`;
}

function localizedTrainingText(
  language: "en" | "am",
  english: string,
  amharic: string,
) {
  return language === "am"
    ? amharic.trim() || english
    : english.trim() || amharic;
}

const REPRESENTATIVE_TRAINING_COPY = {
  en: {
    loadError: "Unable to load training.",
    completeError: "Unable to complete lesson.",
    loading: "Loading training",
    emptyTitle: "Training is being prepared",
    emptyBody: "There are no published training courses available yet.",
    backToHub: "Back to Sales Hub",
    trainingTitle: "Baki Digital Training",
    learningCenter: "Partner learning center",
    courseProgress: "Course progress",
    lessons: "lessons",
    notesLesson: "Notes lesson",
    notesLessonBody: "This lesson does not contain a video. Read the material below and complete it when you are ready.",
    lesson: "Lesson",
    lessonComplete: "Lesson complete",
    nextLesson: "Next lesson",
    courseCompleted: "Course completed 🎉",
    completeLesson: "Complete lesson",
    yourProgress: "Your progress",
    progressHelper: "Lessons automatically complete when you reach the final 4 seconds.",
    overview: "Overview",
    notes: "Notes",
    noOverview: "No overview has been added for this lesson yet.",
    lessonResources: "Lesson resources",
    lessonNotes: "Lesson notes",
    noNotes: "No notes have been added for this lesson yet.",
    closeContents: "Close course contents",
    courseContent: "Course content",
    completed: "completed",
    section: "Section",
    video: "Video",
  },
  am: {
    loadError: "ሥልጠናውን መጫን አልተቻለም።",
    completeError: "ትምህርቱን ማጠናቀቅ አልተቻለም።",
    loading: "ሥልጠናውን በመጫን ላይ",
    emptyTitle: "ሥልጠናው በዝግጅት ላይ ነው",
    emptyBody: "በአሁኑ ጊዜ የታተመ የሥልጠና ኮርስ የለም።",
    backToHub: "ወደ ሽያጭ ማዕከሉ ተመለስ",
    trainingTitle: "የBaki Digital ሥልጠና",
    learningCenter: "የአጋሮች መማሪያ ማዕከል",
    courseProgress: "የኮርስ እድገት",
    lessons: "ትምህርቶች",
    notesLesson: "የንባብ ትምህርት",
    notesLessonBody: "ይህ ትምህርት ቪዲዮ የለውም። ከታች ያለውን ይዘት ያንብቡና ሲዘጋጁ እንደተጠናቀቀ ያስቀምጡት።",
    lesson: "ትምህርት",
    lessonComplete: "ትምህርቱ ተጠናቋል",
    nextLesson: "ቀጣይ ትምህርት",
    courseCompleted: "ኮርሱ ተጠናቋል 🎉",
    completeLesson: "ትምህርቱን አጠናቅ",
    yourProgress: "እድገትዎ",
    progressHelper: "ትምህርቶች የመጨረሻዎቹ 4 ሰከንዶች ላይ ሲደርሱ በራስ-ሰር ይጠናቀቃሉ።",
    overview: "አጠቃላይ እይታ",
    notes: "ማስታወሻዎች",
    noOverview: "ለዚህ ትምህርት እስካሁን አጠቃላይ መግለጫ አልተጨመረም።",
    lessonResources: "የትምህርቱ ማጣቀሻዎች",
    lessonNotes: "የትምህርቱ ማስታወሻዎች",
    noNotes: "ለዚህ ትምህርት እስካሁን ማስታወሻ አልተጨመረም።",
    closeContents: "የኮርሱን ይዘት ዝጋ",
    courseContent: "የኮርስ ይዘት",
    completed: "ተጠናቋል",
    section: "ክፍል",
    video: "ቪዲዮ",
  },
} as const;

/* =========================================================
   YOUTUBE
   ========================================================= */

type YouTubePlayer = {
  destroy:
    () => void;

  getCurrentTime:
    () => number;

  getDuration:
    () => number;

  seekTo:
    (
      seconds:
        number,

      allowSeekAhead:
        boolean,
    ) => void;
};

type YouTubeNamespace = {
  PlayerState: {
    PLAYING:
      number;
  };

  Player:
    new (
      element:
        HTMLElement,

      options: {
        videoId:
          string;

        playerVars?: {
          rel?:
            number;

          modestbranding?:
            number;
        };

        events: {
          onReady:
            (
              event: {
                target:
                  YouTubePlayer;
              },
            ) => void;

          onStateChange:
            (
              event: {
                data:
                  number;

                target:
                  YouTubePlayer;
              },
            ) => void;
        };
      },
    ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?:
      YouTubeNamespace;

    onYouTubeIframeAPIReady?:
      () => void;
  }
}

let youtubeApiPromise:
  | Promise<YouTubeNamespace>
  | null =
  null;

function loadYouTubeApi() {
  if (
    typeof window ===
    "undefined"
  ) {
    return Promise.reject(
      new Error(
        "YouTube player is only available in the browser.",
      ),
    );
  }

  if (
    window.YT
      ?.Player
  ) {
    return Promise.resolve(
      window.YT,
    );
  }

  if (
    youtubeApiPromise
  ) {
    return youtubeApiPromise;
  }

  youtubeApiPromise =
    new Promise<YouTubeNamespace>(
      (
        resolve,
        reject,
      ) => {
        const existingCallback =
          window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady =
          () => {
            existingCallback?.();

            if (
              window.YT
                ?.Player
            ) {
              resolve(
                window.YT,
              );

              return;
            }

            reject(
              new Error(
                "YouTube API failed to initialize.",
              ),
            );
          };

        const existingScript =
          document.querySelector(
            'script[src="https://www.youtube.com/iframe_api"]',
          );

        if (
          existingScript
        ) {
          return;
        }

        const script =
          document.createElement(
            "script",
          );

        script.src =
          "https://www.youtube.com/iframe_api";

        script.async =
          true;

        script.onerror =
          () => {
            reject(
              new Error(
                "Unable to load YouTube player.",
              ),
            );
          };

        document.head.appendChild(
          script,
        );
      },
    );

  return youtubeApiPromise;
}

function YouTubeTrackedPlayer({
  videoId,
  resumeSeconds,
  completed,
  onProgress,
}: {
  videoId:
    string;

  resumeSeconds:
    number;

  completed:
    boolean;

  onProgress:
    (
      currentTime:
        number,

      duration:
        number,

      force?:
        boolean,
    ) => void;
}) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const progressHandlerRef =
    useRef(
      onProgress,
    );

  useEffect(
    () => {
      progressHandlerRef.current =
        onProgress;
    },
    [
      onProgress,
    ],
  );

  useEffect(
    () => {
      let disposed =
        false;

      let player:
        YouTubePlayer |
        null =
        null;

      let timer:
        ReturnType<
          typeof setInterval
        > |
        null =
        null;

      function stopTimer() {
        if (
          timer
        ) {
          clearInterval(
            timer,
          );

          timer =
            null;
        }
      }

      function reportProgress(
        force =
          false,
      ) {
        if (
          !player
        ) {
          return;
        }

        const currentTime =
          Number(
            player.getCurrentTime(),
          ) ||
          0;

        const duration =
          Number(
            player.getDuration(),
          ) ||
          0;

        progressHandlerRef.current(
          currentTime,
          duration,
          force,
        );
      }

      void loadYouTubeApi()
        .then(
          (
            YT,
          ) => {
            if (
              disposed ||
              !containerRef.current
            ) {
              return;
            }

            player =
              new YT.Player(
                containerRef.current,

                {
                  videoId,

                  playerVars: {
                    rel:
                      0,

                    modestbranding:
                      1,
                  },

                  events: {
                    onReady:
                      (
                        event,
                      ) => {
                        if (
                          !completed &&
                          resumeSeconds >
                            1
                        ) {
                          const duration =
                            Number(
                              event.target.getDuration(),
                            ) ||
                            0;

                          if (
                            duration >
                              0 &&
                            resumeSeconds <
                              duration -
                                4
                          ) {
                            event.target.seekTo(
                              resumeSeconds,

                              true,
                            );
                          }
                        }
                      },

                    onStateChange:
                      (
                        event,
                      ) => {
                        if (
                          event.data ===
                          YT.PlayerState.PLAYING
                        ) {
                          stopTimer();

                          timer =
                            setInterval(
                              () =>
                                reportProgress(
                                  false,
                                ),

                              1000,
                            );

                          return;
                        }

                        reportProgress(
                          true,
                        );

                        stopTimer();
                      },
                  },
                },
              );
          },
        )
        .catch(
          (
            error,
          ) => {
            console.error(
              "Unable to initialize YouTube training player:",
              error,
            );
          },
        );

      return () => {
        disposed =
          true;

        stopTimer();

        player?.destroy();
      };
    },
    [
      videoId,
      resumeSeconds,
      completed,
    ],
  );

  return (
    <div
      ref={
        containerRef
      }
      className="h-full w-full"
    />
  );
}

/* =========================================================
   COURSE HELPERS
   ========================================================= */

function getFlatLessons(
  course:
    RepresentativeTrainingCourse,
) {
  return course.sections.flatMap(
    (
      section,
    ) =>
      section.lessons,
  );
}

function getFirstLesson(
  course:
    RepresentativeTrainingCourse,
) {
  const lessons =
    getFlatLessons(
      course,
    );

  return (
    lessons.find(
      (
        lesson,
      ) =>
        !lesson
          .progress
          .completed,
    ) ??
    lessons[0] ??
    null
  );
}

function calculateCourseProgress(
  course:
    RepresentativeTrainingCourse,
) {
  const lessons =
    getFlatLessons(
      course,
    );

  const completed =
    lessons.filter(
      (
        lesson,
      ) =>
        lesson
          .progress
          .completed,
    ).length;

  return {
    total:
      lessons.length,

    completed,

    percent:
      lessons.length >
      0
        ? Math.round(
            (
              completed /
              lessons.length
            ) *
              100,
          )
        : 0,
  };
}

/* =========================================================
   MAIN
   ========================================================= */

export default function RepresentativeTrainingPlayer() {
  const router =
    useRouter();

  const {
    language,
  } = useLanguage();

  const text =
    REPRESENTATIVE_TRAINING_COPY[
      language
    ];

  const [
    courses,
    setCourses,
  ] =
    useState<
      RepresentativeTrainingCourse[]
    >([]);

  const [
    selectedCourseId,
    setSelectedCourseId,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedLessonId,
    setSelectedLessonId,
  ] =
    useState<
      string | null
    >(null);

  const [
    expandedSections,
    setExpandedSections,
  ] =
    useState<
      Set<string>
    >(
      new Set(),
    );

  const [
    infoTab,
    setInfoTab,
  ] =
    useState<
      "overview" |
      "notes"
    >(
      "overview",
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  const [suspension, setSuspension] = useState<RepresentativeSuspension | null>(null);

  const [
    mobileContentsOpen,
    setMobileContentsOpen,
  ] =
    useState(
      false,
    );

  const lastSavedSecondsRef =
    useRef<
      Map<
        string,
        number
      >
    >(
      new Map(),
    );

  const completionRequestRef =
    useRef<
      Set<string>
    >(
      new Set(),
    );

  /* =======================================================
     LOAD
     ======================================================= */

  useEffect(
    () => {
      let cancelled =
        false;

      void getCurrentRepresentative()
        .then(
          async (
            user,
          ) => {
            if (
              cancelled
            ) {
              return null;
            }

            if (
              !user
            ) {
              router.replace(
                "/representative/login",
              );

              return null;
            }

            if (
              user.mustChangePassword
            ) {
              router.replace(
                "/representative/change-password",
              );

              return null;
            }

            return getRepresentativeTrainingCourses();
          },
        )
        .then(
          (
            result,
          ) => {
            if (
              cancelled ||
              !result
            ) {
              return;
            }

            setCourses(
              result.courses,
            );

            const firstCourse =
              result.courses[0] ??
              null;

            if (
              !firstCourse
            ) {
              return;
            }

            setSelectedCourseId(
              firstCourse.id,
            );

            const firstLesson =
              getFirstLesson(
                firstCourse,
              );

            setSelectedLessonId(
              firstLesson?.id ??
                null,
            );

            setExpandedSections(
              new Set(
                firstCourse.sections.map(
                  (
                    section,
                  ) =>
                    section.id,
                ),
              ),
            );
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

            if (
              loadError instanceof RepresentativeApiError &&
              loadError.code === "ACCOUNT_SUSPENDED" &&
              loadError.suspension
            ) {
              setSuspension(loadError.suspension);
              return;
            }

            setError(
              language === "en" &&
              loadError instanceof
                Error
                ? loadError.message
                : text.loadError,
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
      language,
      router,
      text.loadError,
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

  const flatLessons =
    useMemo(
      () =>
        selectedCourse
          ? getFlatLessons(
              selectedCourse,
            )
          : [],
      [
        selectedCourse,
      ],
    );

  const selectedLesson =
    useMemo(
      () =>
        flatLessons.find(
          (
            lesson,
          ) =>
            lesson.id ===
            selectedLessonId,
        ) ??
        flatLessons[0] ??
        null,
      [
        flatLessons,
        selectedLessonId,
      ],
    );

  const currentLessonIndex =
    selectedLesson
      ? flatLessons.findIndex(
          (
            lesson,
          ) =>
            lesson.id ===
            selectedLesson.id,
        )
      : -1;

  const nextLesson =
    currentLessonIndex >=
      0 &&
    currentLessonIndex <
      flatLessons.length -
        1
      ? flatLessons[
          currentLessonIndex +
            1
        ]
      : null;

  const courseProgress =
    selectedCourse
      ? calculateCourseProgress(
          selectedCourse,
        )
      : {
          total:
            0,

          completed:
            0,

          percent:
            0,
        };

  const youtubeVideoId =
    getYouTubeVideoId(
      selectedLesson
        ?.videoUrl ??
        null,
    );

  const vimeoEmbedUrl =
    !youtubeVideoId
      ? getVimeoEmbedUrl(
          selectedLesson
            ?.videoUrl ??
            null,
        )
      : null;

  /* =======================================================
     UPDATE PROGRESS STATE
     ======================================================= */

  function updateLessonProgress(
    lessonId:
      string,

    progress:
      RepresentativeTrainingProgress,
  ) {
    setCourses(
      (
        current,
      ) =>
        current.map(
          (
            course,
          ) => ({
            ...course,

            sections:
              course.sections.map(
                (
                  section,
                ) => ({
                  ...section,

                  lessons:
                    section.lessons.map(
                      (
                        lesson,
                      ) =>
                        lesson.id ===
                        lessonId
                          ? {
                              ...lesson,

                              progress,
                            }
                          : lesson,
                    ),
                }),
              ),
          }),
        ),
    );
  }

  async function persistProgress(
    lessonId:
      string,

    currentTime:
      number,

    duration:
      number,

    force:
      boolean,
  ) {
    const roundedTime =
      Math.max(
        0,

        Math.floor(
          currentTime,
        ),
      );

    const lastSaved =
      lastSavedSecondsRef.current.get(
        lessonId,
      ) ??
      0;

    if (
      !force &&
      roundedTime -
        lastSaved <
        5
    ) {
      return;
    }

    lastSavedSecondsRef.current.set(
      lessonId,

      roundedTime,
    );

    try {
      const progress =
        await saveRepresentativeLessonProgress(
          lessonId,

          roundedTime,

          Math.max(
            0,

            Math.floor(
              duration,
            ),
          ),
        );

      updateLessonProgress(
        lessonId,

        progress,
      );

      if (
        !progress.completed
      ) {
        completionRequestRef.current.delete(
          lessonId,
        );
      }
    } catch (
      progressError
    ) {
      completionRequestRef.current.delete(
        lessonId,
      );

      console.error(
        "Unable to save training progress:",
        progressError,
      );
    }
  }

  function handlePlaybackProgress(
    currentTime:
      number,

    duration:
      number,

    force =
      false,
  ) {
    if (
      !selectedLesson ||
      !Number.isFinite(
        currentTime,
      ) ||
      !Number.isFinite(
        duration,
      ) ||
      duration <=
        0
    ) {
      return;
    }

    const remaining =
      duration -
      currentTime;

    /*
      Complete automatically at the
      final four seconds.
    */
    if (
      !selectedLesson
        .progress
        .completed &&
      remaining <=
        4
    ) {
      if (
        completionRequestRef.current.has(
          selectedLesson.id,
        )
      ) {
        return;
      }

      completionRequestRef.current.add(
        selectedLesson.id,
      );

      void persistProgress(
        selectedLesson.id,

        currentTime,

        duration,

        true,
      );

      return;
    }

    void persistProgress(
      selectedLesson.id,

      currentTime,

      duration,

      force,
    );
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  function chooseCourse(
    courseId:
      string,
  ) {
    const course =
      courses.find(
        (
          item,
        ) =>
          item.id ===
          courseId,
      );

    if (
      !course
    ) {
      return;
    }

    const firstLesson =
      getFirstLesson(
        course,
      );

    setSelectedCourseId(
      course.id,
    );

    setSelectedLessonId(
      firstLesson?.id ??
        null,
    );

    setExpandedSections(
      new Set(
        course.sections.map(
          (
            section,
          ) =>
            section.id,
        ),
      ),
    );

    setInfoTab(
      "overview",
    );
  }

  function chooseLesson(
    lesson:
      RepresentativeTrainingLesson,
  ) {
    setSelectedLessonId(
      lesson.id,
    );

    setInfoTab(
      "overview",
    );

    setMobileContentsOpen(
      false,
    );

    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }

  function toggleSection(
    sectionId:
      string,
  ) {
    setExpandedSections(
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

  async function completeNoVideoLesson() {
    if (
      !selectedLesson ||
      selectedLesson
        .progress
        .completed
    ) {
      return;
    }

    try {
      completionRequestRef.current.add(
        selectedLesson.id,
      );

      const progress =
        await saveRepresentativeLessonProgress(
          selectedLesson.id,

          1,

          1,
        );

      updateLessonProgress(
        selectedLesson.id,

        progress,
      );
    } catch (
      completeError
    ) {
      completionRequestRef.current.delete(
        selectedLesson.id,
      );

      setError(
        language === "en" &&
        completeError instanceof
          Error
          ? completeError.message
          : text.completeError,
      );
    }
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="representative-training-portal flex min-h-screen items-center justify-center bg-[#f6f8f3]">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-black/[0.06] bg-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-[#629144]" />
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-black/35">
            {text.loading}
          </p>
        </div>
      </main>
    );
  }

  if (suspension) {
    return (
      <RepresentativeSuspendedScreen
        suspension={suspension}
        language={language}
        onLogout={() => {
          void logoutRepresentative().finally(() => {
            router.replace("/representative/login");
            router.refresh();
          });
        }}
      />
    );
  }

  /* =======================================================
     EMPTY
     ======================================================= */

  if (
    courses.length ===
    0
  ) {
    return (
      <main className="representative-training-portal min-h-screen bg-[#f6f8f3] p-5">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-black/[0.06] bg-white p-10 text-center shadow-sm">
          <GraduationCap className="mx-auto h-8 w-8 text-[#659348]" />

          <h1 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#20251d]">
            {text.emptyTitle}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-black/45">
            {text.emptyBody}
          </p>

          <button
            type="button"
            onClick={
              () =>
                router.push(
                  "/representative/dashboard",
                )
            }
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#20251d] px-5 text-xs font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" />

            {text.backToHub}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="representative-training-portal min-h-screen bg-[#f5f7f2] text-[#20251d]">
      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-white/95 backdrop-blur-xl">
        <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={
              () =>
                router.push(
                  "/representative/dashboard",
                )
            }
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/55 transition hover:bg-black/[0.03]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[12px] font-black tracking-[-0.02em]">
              {text.trainingTitle}
            </p>

            <p className="mt-0.5 truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-black/35">
              {text.learningCenter}
            </p>
          </div>

          <div className="mx-auto hidden w-full max-w-xl lg:block">
            <div className="flex items-center justify-between text-[9px] font-bold text-black/40">
              <span>
                {text.courseProgress}
              </span>

              <span>
                {
                  courseProgress.completed
                }
                /
                {
                  courseProgress.total
                }{" "}
                {text.lessons} ·{" "}
                {
                  courseProgress.percent
                }
                %
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8ece4]">
              <div
                className="h-full rounded-full bg-[#76a955] transition-[width] duration-500"
                style={{
                  width:
                    `${courseProgress.percent}%`,
                }}
              />
            </div>
          </div>

          {courses.length >
          1 ? (
            <select
              value={
                selectedCourseId ??
                ""
              }
              onChange={(
                event,
              ) =>
                chooseCourse(
                  event.target.value,
                )
              }
              className="ml-auto max-w-[220px] rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-[10px] font-bold outline-none"
            >
              {courses.map(
                (
                  course,
                ) => (
                  <option
                    key={
                      course.id
                    }
                    value={
                      course.id
                    }
                  >
                    {
                      localizedTrainingText(
                        language,
                        course.titleEn,
                        course.titleAm,
                      )
                    }
                  </option>
                ),
              )}
            </select>
          ) : (
            <div className="ml-auto" />
          )}

          <button
            type="button"
            onClick={
              () =>
                setMobileContentsOpen(
                  true,
                )
            }
            className="grid h-10 w-10 place-items-center rounded-xl border border-black/[0.08] bg-white xl:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-center text-[10px] font-semibold text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-[calc(100vh-73px)] xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* =================================================
            MAIN LESSON
            ================================================= */}

        <div className="min-w-0">
          <div className="bg-[#151714]">
            <div className="mx-auto w-full max-w-[1150px]">
              {selectedLesson?.videoUrl ? (
                youtubeVideoId ? (
                  <div
                    key={
                      selectedLesson.id
                    }
                    className="aspect-video w-full"
                  >
                    <YouTubeTrackedPlayer
                      videoId={
                        youtubeVideoId
                      }
                      resumeSeconds={
                        selectedLesson
                          .progress
                          .watchedSeconds
                      }
                      completed={
                        selectedLesson
                          .progress
                          .completed
                      }
                      onProgress={
                        handlePlaybackProgress
                      }
                    />
                  </div>
                ) : vimeoEmbedUrl ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={
                        vimeoEmbedUrl
                      }
                      title={
                        localizedTrainingText(
                          language,
                          selectedLesson.titleEn,
                          selectedLesson.titleAm,
                        )
                      }
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <TrainingVideoPlayer
                    key={
                      selectedLesson.id
                    }
                    src={
                      selectedLesson.videoUrl
                    }
                    title={
                      localizedTrainingText(
                        language,
                        selectedLesson.titleEn,
                        selectedLesson.titleAm,
                      )
                    }
                    resumeSeconds={
                      selectedLesson
                        .progress
                        .watchedSeconds
                    }
                    completed={
                      selectedLesson
                        .progress
                        .completed
                    }
                    onProgress={
                      handlePlaybackProgress
                    }
                  />
                )
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#253120_0%,#171a16_55%,#121411_100%)] px-6 text-center text-white">
                  <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-white/10 bg-white/[0.06]">
                    <FileText className="h-8 w-8 text-[#a8d28d]" />
                  </div>

                  <h2 className="mt-6 text-xl font-black tracking-[-0.04em]">
                    {text.notesLesson}
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-white/45">
                    {text.notesLessonBody}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ===============================================
              LESSON INFO
              =============================================== */}

          <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-7 lg:py-8">
            <div className="flex flex-col gap-5 border-b border-black/[0.07] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#edf6e7] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#5e8b40]">
                    {text.lesson}{" "}
                    {currentLessonIndex +
                      1}
                  </span>

                  {selectedLesson ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-black/35">
                      <Clock3 className="h-3 w-3" />

                      {formatDuration(
                        selectedLesson.durationSeconds,
                        text.video,
                      )}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-3 text-[24px] font-black tracking-[-0.05em] sm:text-[30px]">
                  {
                    selectedLesson
                      ? localizedTrainingText(
                          language,
                          selectedLesson.titleEn,
                          selectedLesson.titleAm,
                        )
                      : ""
                  }
                </h1>

                <p className="mt-2 text-[11px] font-semibold text-black/35">
                  {
                    selectedCourse
                      ? localizedTrainingText(
                          language,
                          selectedCourse.titleEn,
                          selectedCourse.titleAm,
                        )
                      : ""
                  }
                </p>
              </div>

              {selectedLesson
                ?.progress
                .completed ? (
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-[#eaf5e3] px-4 py-3 text-[10px] font-black text-[#507938]">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#67954a] text-white">
                      <Check className="h-3 w-3" />
                    </span>

                    {text.lessonComplete}
                  </div>

                  {nextLesson ? (
                    <button
                      type="button"
                      onClick={
                        () =>
                          chooseLesson(
                            nextLesson,
                          )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#20251d] px-5 text-[10px] font-black text-white transition hover:bg-[#30382b]"
                    >
                      {text.nextLesson}

                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="rounded-xl border border-[#cfe4bf] bg-[#f7fff1] px-4 py-3 text-center text-[9px] font-black text-[#5e853f]">
                      {text.courseCompleted}
                    </div>
                  )}
                </div>
              ) : !selectedLesson
                  ?.videoUrl ? (
                <button
                  type="button"
                  onClick={
                    () =>
                      void completeNoVideoLesson()
                  }
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#20251d] px-5 text-[10px] font-black text-white"
                >
                  <Check className="h-4 w-4" />

                  {text.completeLesson}
                </button>
              ) : null}
            </div>

            {/* =============================================
                COURSE PROGRESS
                ============================================= */}

            <div className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_8px_30px_rgba(31,45,24,0.025)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#608b43]">
                    {text.yourProgress}
                  </p>

                  <p className="mt-1 text-[10px] text-black/40">
                    {text.progressHelper}
                  </p>
                </div>

                <strong className="text-lg font-black tracking-[-0.04em]">
                  {
                    courseProgress.percent
                  }
                  %
                </strong>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e9eee5]">
                <div
                  className="h-full rounded-full bg-[#76a955] transition-[width] duration-500"
                  style={{
                    width:
                      `${courseProgress.percent}%`,
                  }}
                />
              </div>
            </div>

            {/* =============================================
                OVERVIEW / NOTES
                ============================================= */}

            <div className="mt-7">
              <div className="flex gap-6 border-b border-black/[0.08]">
                <button
                  type="button"
                  onClick={
                    () =>
                      setInfoTab(
                        "overview",
                      )
                  }
                  className={`relative pb-3 text-[11px] font-black ${
                    infoTab ===
                    "overview"
                      ? "text-[#20251d]"
                      : "text-black/35"
                  }`}
                >
                  {text.overview}

                  {infoTab ===
                  "overview" ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#78a958]" />
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={
                    () =>
                      setInfoTab(
                        "notes",
                      )
                  }
                  className={`relative pb-3 text-[11px] font-black ${
                    infoTab ===
                    "notes"
                      ? "text-[#20251d]"
                      : "text-black/35"
                  }`}
                >
                  {text.notes}

                  {infoTab ===
                  "notes" ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#78a958]" />
                  ) : null}
                </button>
              </div>

              {infoTab ===
              "overview" ? (
                <div className="py-6">
                  <p className="whitespace-pre-wrap text-[12px] leading-7 text-black/60">
                    {selectedLesson
                      ? localizedTrainingText(
                          language,
                          selectedLesson.summaryEn,
                          selectedLesson.summaryAm,
                        ) || text.noOverview
                      : text.noOverview}
                  </p>

                  {selectedLesson &&
                  selectedLesson
                    .resources
                    .length >
                    0 ? (
                    <div className="mt-8">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-[#639145]" />

                        <h3 className="text-[12px] font-black">
                          {text.lessonResources}
                        </h3>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {selectedLesson.resources.map(
                          (
                            resource,
                          ) => (
                            <a
                              key={
                                resource.id
                              }
                              href={
                                resource.url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center justify-between gap-4 rounded-xl border border-black/[0.07] bg-white p-4 transition hover:border-[#b9dba1] hover:bg-[#fbfff8]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf6e7] text-[#618d42]">
                                  <Link2 className="h-4 w-4" />
                                </span>

                                <span className="truncate text-[10px] font-black">
                                  {
                                    localizedTrainingText(
                                      language,
                                      resource.labelEn,
                                      resource.labelAm,
                                    )
                                  }
                                </span>
                              </div>

                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-black/25 transition group-hover:text-[#638e46]" />
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="py-6">
                  <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#639145]" />

                      <h3 className="text-[12px] font-black">
                        {text.lessonNotes}
                      </h3>
                    </div>

                    <p className="mt-5 whitespace-pre-wrap text-[12px] leading-7 text-black/60">
                      {selectedLesson
                        ? localizedTrainingText(
                            language,
                            selectedLesson.notesEn,
                            selectedLesson.notesAm,
                          ) || text.noNotes
                        : text.noNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            DESKTOP COURSE CONTENT
            ================================================= */}

        <aside className="hidden border-l border-black/[0.07] bg-white xl:block">
          <div className="sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
            <CourseContents
              course={
                selectedCourse
              }
              selectedLessonId={
                selectedLesson
                  ?.id ??
                null
              }
              expandedSections={
                expandedSections
              }
              onToggleSection={
                toggleSection
              }
              onChooseLesson={
                chooseLesson
              }
              language={
                language
              }
            />
          </div>
        </aside>
      </div>

      {/* ===================================================
          MOBILE COURSE CONTENT
          =================================================== */}

      {mobileContentsOpen ? (
        <div className="fixed inset-0 z-[100] xl:hidden">
          <button
            type="button"
            aria-label={text.closeContents}
            onClick={
              () =>
                setMobileContentsOpen(
                  false,
                )
            }
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 right-0 w-[min(92vw,390px)] overflow-y-auto bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.07] bg-white px-4 py-4">
              <strong className="text-sm font-black">
                {text.courseContent}
              </strong>

              <button
                type="button"
                onClick={
                  () =>
                    setMobileContentsOpen(
                      false,
                    )
                }
                className="grid h-9 w-9 place-items-center rounded-xl border border-black/[0.08]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <CourseContents
              course={
                selectedCourse
              }
              selectedLessonId={
                selectedLesson
                  ?.id ??
                null
              }
              expandedSections={
                expandedSections
              }
              onToggleSection={
                toggleSection
              }
              onChooseLesson={
                chooseLesson
              }
              language={
                language
              }
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
}

/* =========================================================
   COURSE CONTENT SIDEBAR
   ========================================================= */

function CourseContents({
  course,
  selectedLessonId,
  expandedSections,
  onToggleSection,
  onChooseLesson,
  language,
}: {
  course:
    RepresentativeTrainingCourse |
    null;

  selectedLessonId:
    string | null;

  expandedSections:
    Set<string>;

  onToggleSection:
    (
      sectionId:
        string,
    ) => void;

  onChooseLesson:
    (
      lesson:
        RepresentativeTrainingLesson,
    ) => void;

  language:
    | "en"
    | "am";
}) {
  if (
    !course
  ) {
    return null;
  }

  const progress =
    calculateCourseProgress(
      course,
    );

  const text =
    REPRESENTATIVE_TRAINING_COPY[
      language
    ];

  return (
    <div>
      <div className="border-b border-black/[0.07] p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#669447]" />

          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#648f46]">
            {text.courseContent}
          </span>
        </div>

        <h2 className="mt-3 text-[16px] font-black leading-6 tracking-[-0.035em]">
          {
            localizedTrainingText(
              language,
              course.titleEn,
              course.titleAm,
            )
          }
        </h2>

        <div className="mt-4 flex items-center justify-between text-[8px] font-bold text-black/38">
          <span>
            {
              progress.completed
            }
            /
            {
              progress.total
            }{" "}
            {text.completed}
          </span>

          <span>
            {
              progress.percent
            }
            %
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9eee5]">
          <div
            className="h-full rounded-full bg-[#78a958] transition-[width] duration-500"
            style={{
              width:
                `${progress.percent}%`,
            }}
          />
        </div>
      </div>

      <div>
        {course.sections.map(
          (
            section,
            sectionIndex,
          ) => {
            const open =
              expandedSections.has(
                section.id,
              );

            const completedLessons =
              section.lessons.filter(
                (
                  lesson,
                ) =>
                  lesson
                    .progress
                    .completed,
              ).length;

            return (
              <section
                key={
                  section.id
                }
                className="border-b border-black/[0.07]"
              >
                <button
                  type="button"
                  onClick={
                    () =>
                      onToggleSection(
                        section.id,
                      )
                  }
                  className="flex w-full items-center gap-3 bg-[#f7f8f5] px-5 py-4 text-left transition hover:bg-[#f2f5ef]"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[10px] font-black leading-5">
                      {text.section}{" "}
                      {sectionIndex +
                        1}
                      :{" "}
                      {
                        localizedTrainingText(
                          language,
                          section.titleEn,
                          section.titleAm,
                        )
                      }
                    </h3>

                    <p className="mt-1 text-[8px] font-semibold text-black/38">
                      {
                        completedLessons
                      }
                      /
                      {
                        section.lessons.length
                      }{" "}
                      {text.lessons}
                    </p>
                  </div>

                  {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-black/35" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-black/35" />
                  )}
                </button>

                {open ? (
                  <div>
                    {section.lessons.map(
                      (
                        lesson,
                        lessonIndex,
                      ) => {
                        const selected =
                          selectedLessonId ===
                          lesson.id;

                        const completed =
                          lesson
                            .progress
                            .completed;

                        return (
                          <button
                            key={
                              lesson.id
                            }
                            type="button"
                            onClick={
                              () =>
                                onChooseLesson(
                                  lesson,
                                )
                            }
                            className={`flex w-full gap-3 border-t border-black/[0.045] px-5 py-4 text-left transition ${
                              selected
                                ? "bg-[#edf6e7]"
                                : "bg-white hover:bg-[#fafbf8]"
                            }`}
                          >
                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                                completed
                                  ? "border-[#69964b] bg-[#69964b] text-white"
                                  : selected
                                    ? "border-[#82ad65] bg-white text-[#669447]"
                                    : "border-black/15 bg-white text-transparent"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span
                                className={`block text-[9px] font-bold leading-5 ${
                                  selected
                                    ? "text-[#477032]"
                                    : "text-[#343a31]"
                                }`}
                              >
                                {lessonIndex +
                                  1}
                                .{" "}
                                {
                                  localizedTrainingText(
                                    language,
                                    lesson.titleEn,
                                    lesson.titleAm,
                                  )
                                }
                              </span>

                              <span className="mt-1 flex items-center gap-1.5 text-[8px] text-black/35">
                                {lesson.videoUrl ? (
                                  <Play className="h-3 w-3" />
                                ) : (
                                  <FileText className="h-3 w-3" />
                                )}

                                {formatDuration(
                                  lesson.durationSeconds,
                                  text.video,
                                )}
                              </span>
                            </span>

                            {selected ? (
                              <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#68974b]" />
                            ) : null}
                          </button>
                        );
                      },
                    )}
                  </div>
                ) : null}
              </section>
            );
          },
        )}
      </div>
    </div>
  );
}
