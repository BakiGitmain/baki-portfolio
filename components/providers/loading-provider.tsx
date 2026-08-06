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

export type LoadingTaskId =
  | "interface"
  | "fonts"
  | "images"
  | "scene3d"
  | "page";

type LoadingTaskState = "pending" | "complete" | "failed";

type LoadingState = Record<LoadingTaskId, LoadingTaskState>;

type LoadingContextValue = {
  tasks: LoadingState;
  actualProgress: number;
  currentTask: LoadingTaskId | null;
  allTasksResolved: boolean;
  failedTasks: LoadingTaskId[];
  hasRevealed: boolean;
  completeTask: (task: LoadingTaskId) => void;
  failTask: (task: LoadingTaskId) => void;
  revealExperience: () => void;
};

const taskDefinitions: {
  id: LoadingTaskId;
  weight: number;
}[] = [
  {
    id: "interface",
    weight: 12,
  },
  {
    id: "fonts",
    weight: 8,
  },
  {
    id: "images",
    weight: 20,
  },
  {
    id: "scene3d",
    weight: 50,
  },
  {
    id: "page",
    weight: 10,
  },
];

const initialState: LoadingState = {
  interface: "pending",
  fonts: "pending",
  images: "pending",
  scene3d: "pending",
  page: "pending",
};

type LoadingAction = {
  task: LoadingTaskId;
  result: Exclude<LoadingTaskState, "pending">;
};

function loadingReducer(
  state: LoadingState,
  action: LoadingAction,
): LoadingState {
  if (state[action.task] !== "pending") {
    return state;
  }

  return {
    ...state,
    [action.task]: action.result,
  };
}

async function waitForImage(image: HTMLImageElement) {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      function handleLoad() {
        cleanup();
        resolve();
      }

      function handleError() {
        cleanup();
        reject(new Error(`Failed to load image: ${image.currentSrc}`));
      }

      function cleanup() {
        image.removeEventListener("load", handleLoad);
        image.removeEventListener("error", handleError);
      }

      image.addEventListener("load", handleLoad, {
        once: true,
      });

      image.addEventListener("error", handleError, {
        once: true,
      });
    });
  }

  if (image.naturalWidth === 0) {
    throw new Error(`Invalid image: ${image.currentSrc}`);
  }

  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      // The image may already be visually available even when decode rejects.
    }
  }
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export default function LoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tasks, dispatch] = useReducer(loadingReducer, initialState);
  const [hasRevealed, setHasRevealed] = useState(false);

  const completeTask = useCallback((task: LoadingTaskId) => {
    dispatch({
      task,
      result: "complete",
    });
  }, []);

  const failTask = useCallback((task: LoadingTaskId) => {
    dispatch({
      task,
      result: "failed",
    });
  }, []);

  const revealExperience = useCallback(() => {
    setHasRevealed(true);
  }, []);

  /*
   * Interface task:
   * waits for React to commit the page and the browser to prepare two frames.
   */
  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        completeTask("interface");
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [completeTask]);

  /*
   * Font task:
   * waits until the browser reports that the active fonts are ready.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadFonts() {
      if (!document.fonts) {
        completeTask("fonts");
        return;
      }

      try {
        await document.fonts.ready;

        if (!cancelled) {
          completeTask("fonts");
        }
      } catch {
        if (!cancelled) {
          failTask("fonts");
        }
      }
    }

    void loadFonts();

    return () => {
      cancelled = true;
    };
  }, [completeTask, failTask]);

  /*
   * Image task:
   * waits only for images marked with data-loader-critical="true".
   *
   * This prevents below-the-fold project images from making the opening
   * loader unnecessarily slow.
   */
  useEffect(() => {
    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(async () => {
        const criticalImages = Array.from(
          document.querySelectorAll<HTMLImageElement>(
            'img[data-loader-critical="true"]',
          ),
        );

        if (criticalImages.length === 0) {
          if (!cancelled) {
            completeTask("images");
          }

          return;
        }

        const results = await Promise.allSettled(
          criticalImages.map((image) => waitForImage(image)),
        );

        if (cancelled) {
          return;
        }

        const hasFailedImage = results.some(
          (result) => result.status === "rejected",
        );

        if (hasFailedImage) {
          failTask("images");
          return;
        }

        completeTask("images");
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [completeTask, failTask]);

  /*
   * Browser page task:
   * waits for the browser's load lifecycle to complete.
   */
  useEffect(() => {
    if (document.readyState === "complete") {
      completeTask("page");
      return;
    }

    function handlePageLoad() {
      completeTask("page");
    }

    window.addEventListener("load", handlePageLoad, {
      once: true,
    });

    return () => {
      window.removeEventListener("load", handlePageLoad);
    };
  }, [completeTask]);

  const actualProgress = useMemo(() => {
    const completedWeight = taskDefinitions.reduce(
      (total, definition) => {
        const taskState = tasks[definition.id];

        if (taskState === "pending") {
          return total;
        }

        return total + definition.weight;
      },
      0,
    );

    const totalWeight = taskDefinitions.reduce(
      (total, definition) => total + definition.weight,
      0,
    );

    return Math.round((completedWeight / totalWeight) * 100);
  }, [tasks]);

  const currentTask = useMemo(() => {
    const pendingTask = taskDefinitions.find(
      (definition) => tasks[definition.id] === "pending",
    );

    return pendingTask?.id ?? null;
  }, [tasks]);

  const allTasksResolved = useMemo(
    () =>
      taskDefinitions.every(
        (definition) => tasks[definition.id] !== "pending",
      ),
    [tasks],
  );

  const failedTasks = useMemo(
    () =>
      taskDefinitions
        .filter((definition) => tasks[definition.id] === "failed")
        .map((definition) => definition.id),
    [tasks],
  );

  const value = useMemo<LoadingContextValue>(
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
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error(
      "useLoading must be used inside LoadingProvider.",
    );
  }

  return context;
}