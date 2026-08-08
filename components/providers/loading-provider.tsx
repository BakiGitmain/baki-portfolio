"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

export type LoadingTaskId =
  | "interface"
  | "fonts"
  | "scene3d"
  | "images"
  | "page";

type LoadingTaskState =
  | "pending"
  | "complete"
  | "failed";

type LoadingState =
  Record<
    LoadingTaskId,
    LoadingTaskState
  >;

type LoadingContextValue = {
  tasks:
    LoadingState;

  actualProgress:
    number;

  currentTask:
    LoadingTaskId | null;

  allTasksResolved:
    boolean;

  failedTasks:
    LoadingTaskId[];

  hasRevealed:
    boolean;

  completeTask: (
    task:
      LoadingTaskId,
  ) => void;

  failTask: (
    task:
      LoadingTaskId,
  ) => void;

  revealExperience:
    () => void;
};

const MAXIMUM_LOADING_TIME =
  15_000;

const taskDefinitions: {
  id:
    LoadingTaskId;

  weight:
    number;
}[] = [
  {
    id:
      "interface",

    weight:
      10,
  },

  {
    id:
      "fonts",

    weight:
      10,
  },

  {
    id:
      "scene3d",

    weight:
      45,
  },

  {
    id:
      "images",

    weight:
      25,
  },

  {
    id:
      "page",

    weight:
      10,
  },
];

const initialState:
  LoadingState = {
    interface:
      "pending",

    fonts:
      "pending",

    scene3d:
      "pending",

    images:
      "pending",

    page:
      "pending",
  };

type LoadingAction = {
  task:
    LoadingTaskId;

  result:
    Exclude<
      LoadingTaskState,
      "pending"
    >;
};

function loadingReducer(
  state:
    LoadingState,

  action:
    LoadingAction,
): LoadingState {
  if (
    state[
      action.task
    ] !==
    "pending"
  ) {
    return state;
  }

  return {
    ...state,

    [action.task]:
      action.result,
  };
}

/* =========================================================
   PRELOAD
   ========================================================= */

async function preloadImageUrl(
  url:
    string,
) {
  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      const image =
        new window.Image();

      image.decoding =
        "async";

      image.onload =
        () =>
          resolve();

      image.onerror =
        () =>
          reject(
            new Error(
              `Failed to preload ${url}`,
            ),
          );

      image.src =
        url;
    },
  );
}

type ApiGalleryImage = {
  url?:
    unknown;
};

type ApiProject = {
  thumbnail?:
    unknown;

  coverImageUrl?:
    unknown;

  gallery?:
    unknown;
};

function getCoverUrl(
  project:
    ApiProject,
) {
  if (
    typeof project.thumbnail ===
      "string" &&
    project.thumbnail
  ) {
    return project.thumbnail;
  }

  if (
    typeof project.coverImageUrl ===
      "string" &&
    project.coverImageUrl
  ) {
    return project.coverImageUrl;
  }

  return null;
}

function getGalleryUrls(
  project:
    ApiProject,
) {
  if (
    !Array.isArray(
      project.gallery,
    )
  ) {
    return [];
  }

  return project.gallery.flatMap(
    (
      image,
    ) => {
      if (
        typeof image !==
          "object" ||
        image ===
          null
      ) {
        return [];
      }

      const candidate =
        image as ApiGalleryImage;

      return typeof candidate.url ===
        "string" &&
        candidate.url
        ? [
            candidate.url,
          ]
        : [];
    },
  );
}

async function getProjectImageUrls(
  pathname:
    string,
) {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return [];
  }

  const base =
    apiUrl.replace(
      /\/$/,
      "",
    );

  /* HOME */

  if (
    pathname === "/"
  ) {
    const response =
      await fetch(
        `${base}/api/projects?featured=true`,
        {
          cache:
            "no-store",
        },
      );

    if (!response.ok) {
      return [];
    }

    const data =
      (await response.json()) as {
        projects?:
          ApiProject[];
      };

    return (
      data.projects ??
      []
    )
      .map(
        getCoverUrl,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(
            value,
          ),
      );
  }

  /* ALL PROJECTS */

  if (
    pathname ===
    "/projects"
  ) {
    const response =
      await fetch(
        `${base}/api/projects`,
        {
          cache:
            "no-store",
        },
      );

    if (!response.ok) {
      return [];
    }

    const data =
      (await response.json()) as {
        projects?:
          ApiProject[];
      };

    return (
      data.projects ??
      []
    )
      .map(
        getCoverUrl,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(
            value,
          ),
      );
  }

  /* PROJECT DETAIL */

  if (
    pathname.startsWith(
      "/projects/",
    )
  ) {
    const slug =
      pathname
        .slice(
          "/projects/".length,
        )
        .split(
          "/",
        )[0];

    if (!slug) {
      return [];
    }

    const response =
      await fetch(
        `${base}/api/projects/${encodeURIComponent(
          slug,
        )}`,
        {
          cache:
            "no-store",
        },
      );

    if (!response.ok) {
      return [];
    }

    const data =
      (await response.json()) as {
        project?:
          ApiProject;
      };

    if (
      !data.project
    ) {
      return [];
    }

    const galleryUrls =
      getGalleryUrls(
        data.project,
      );

    if (
      galleryUrls.length >
      0
    ) {
      return galleryUrls.slice(
        0,
        5,
      );
    }

    const cover =
      getCoverUrl(
        data.project,
      );

    return cover
      ? [
          cover,
        ]
      : [];
  }

  return [];
}

/* =========================================================
   CONTEXT
   ========================================================= */

const LoadingContext =
  createContext<
    LoadingContextValue | null
  >(
    null,
  );

export default function LoadingProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const pathname =
    usePathname();

  const [
    tasks,
    dispatch,
  ] =
    useReducer(
      loadingReducer,
      initialState,
    );

  const [
    hasRevealed,
    setHasRevealed,
  ] = useState(false);

  const completeTask =
    useCallback(
      (
        task:
          LoadingTaskId,
      ) => {
        dispatch({
          task,

          result:
            "complete",
        });
      },
      [],
    );

  const failTask =
    useCallback(
      (
        task:
          LoadingTaskId,
      ) => {
        dispatch({
          task,

          result:
            "failed",
        });
      },
      [],
    );

  const revealExperience =
    useCallback(
      () => {
        setHasRevealed(
          true,
        );
      },
      [],
    );

  /* INTERFACE */

  useEffect(() => {
    const frame =
      window.requestAnimationFrame(
        () => {
          completeTask(
            "interface",
          );
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    completeTask,
  ]);

  /* FONTS */

  useEffect(() => {
    let cancelled =
      false;

    async function loadFonts() {
      try {
        if (
          document.fonts
        ) {
          await document.fonts.ready;
        }

        if (
          !cancelled
        ) {
          completeTask(
            "fonts",
          );
        }
      } catch {
        if (
          !cancelled
        ) {
          failTask(
            "fonts",
          );
        }
      }
    }

    void loadFonts();

    return () => {
      cancelled =
        true;
    };
  }, [
    completeTask,
    failTask,
  ]);

  /* 3D */

  useEffect(() => {
    if (
      pathname === "/"
    ) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          completeTask(
            "scene3d",
          );
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    completeTask,
    pathname,
  ]);

  /* IMAGES */

  useEffect(() => {
    if (
      tasks.scene3d ===
      "pending"
    ) {
      return;
    }

    let cancelled =
      false;

    async function loadImages() {
      try {
        const urls =
          await getProjectImageUrls(
            pathname,
          );

        const results =
          await Promise.allSettled(
            urls.map(
              (
                url,
              ) =>
                preloadImageUrl(
                  url,
                ),
            ),
          );

        if (
          cancelled
        ) {
          return;
        }

        const failed =
          results.some(
            (
              result,
            ) =>
              result.status ===
              "rejected",
          );

        if (
          failed
        ) {
          failTask(
            "images",
          );
        } else {
          completeTask(
            "images",
          );
        }
      } catch {
        if (
          !cancelled
        ) {
          failTask(
            "images",
          );
        }
      }
    }

    void loadImages();

    return () => {
      cancelled =
        true;
    };
  }, [
    completeTask,
    failTask,
    pathname,
    tasks.scene3d,
  ]);

  /* PAGE */

  useEffect(() => {
    if (
      document.readyState ===
      "complete"
    ) {
      const frame =
        window.requestAnimationFrame(
          () => {
            completeTask(
              "page",
            );
          },
        );

      return () => {
        window.cancelAnimationFrame(
          frame,
        );
      };
    }

    function handleLoad() {
      completeTask(
        "page",
      );
    }

    window.addEventListener(
      "load",
      handleLoad,
      {
        once:
          true,
      },
    );

    return () => {
      window.removeEventListener(
        "load",
        handleLoad,
      );
    };
  }, [
    completeTask,
  ]);

  /* FAILSAFE */

  useEffect(() => {
    if (
      hasRevealed
    ) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          taskDefinitions.forEach(
            (
              definition,
            ) => {
              failTask(
                definition.id,
              );
            },
          );
        },
        MAXIMUM_LOADING_TIME,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    failTask,
    hasRevealed,
  ]);

  const actualProgress =
    useMemo(
      () => {
        const completed =
          taskDefinitions.reduce(
            (
              total,
              definition,
            ) =>
              tasks[
                definition.id
              ] ===
              "pending"
                ? total
                : total +
                  definition.weight,
            0,
          );

        return completed;
      },
      [
        tasks,
      ],
    );

  const currentTask =
    useMemo(
      () =>
        taskDefinitions.find(
          (
            definition,
          ) =>
            tasks[
              definition.id
            ] ===
            "pending",
        )?.id ??
        null,
      [
        tasks,
      ],
    );

  const allTasksResolved =
    useMemo(
      () =>
        taskDefinitions.every(
          (
            definition,
          ) =>
            tasks[
              definition.id
            ] !==
            "pending",
        ),
      [
        tasks,
      ],
    );

  const failedTasks =
    useMemo(
      () =>
        taskDefinitions
          .filter(
            (
              definition,
            ) =>
              tasks[
                definition.id
              ] ===
              "failed",
          )
          .map(
            (
              definition,
            ) =>
              definition.id,
          ),
      [
        tasks,
      ],
    );

  const value =
    useMemo<LoadingContextValue>(
      () => ({
        tasks,

        actualProgress,

        currentTask,

        allTasksResolved,

        failedTasks,

        hasRevealed,

        completeTask,

        failTask,

        revealExperience,
      }),
      [
        tasks,
        actualProgress,
        currentTask,
        allTasksResolved,
        failedTasks,
        hasRevealed,
        completeTask,
        failTask,
        revealExperience,
      ],
    );

  return (
    <LoadingContext.Provider
      value={
        value
      }
    >
      {
        children
      }
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context =
    useContext(
      LoadingContext,
    );

  if (!context) {
    throw new Error(
      "useLoading must be used inside LoadingProvider.",
    );
  }

  return context;
}