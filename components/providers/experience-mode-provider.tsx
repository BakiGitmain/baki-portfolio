"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ExperienceMode =
  | "performance"
  | "quality";

type ExperienceModeSource =
  | "default"
  | "manual"
  | "session";

type ExperienceModeState = {
  mode: ExperienceMode;
  source: ExperienceModeSource;
};

type SetModeOptions = {
  persist?: boolean;
  source?: ExperienceModeSource;
};

type ExperienceModeContextValue = {
  mode: ExperienceMode;
  userSelected: boolean;
  setExperienceMode: (
    mode: ExperienceMode,
    options?: SetModeOptions,
  ) => void;
};

type NetworkInformationLike = {
  saveData?: boolean;
  addEventListener?: (
    type: "change",
    listener: () => void,
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: () => void,
  ) => void;
};

type NavigatorWithConnection =
  Navigator & {
    connection?: NetworkInformationLike;
  };

const STORAGE_KEY =
  "baki-portfolio-experience-mode";

const COMPACT_DEVICE_QUERY =
  "(max-width: 1023px)";

const REDUCED_MOTION_QUERY =
  "(prefers-reduced-motion: reduce)";

/*
 * SSR and hydration always start with the safe static mode.
 * Desktop Quality is selected only after the client resolves
 * the lightweight media-query/user-preference signals.
 */
const SERVER_STATE: ExperienceModeState = {
  mode: "performance",
  source: "default",
};

let currentState: ExperienceModeState =
  SERVER_STATE;

let initialized = false;

const listeners =
  new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    listener();
  });
}

function isExperienceMode(
  value: string | null,
): value is ExperienceMode {
  return (
    value === "performance" ||
    value === "quality"
  );
}

function getConnection() {
  return (
    navigator as NavigatorWithConnection
  ).connection;
}

function getDeviceDefault(): ExperienceMode {
  const compactDevice =
    window.matchMedia(
      COMPACT_DEVICE_QUERY,
    ).matches;

  const reducedMotion =
    window.matchMedia(
      REDUCED_MOTION_QUERY,
    ).matches;

  const saveData =
    getConnection()?.saveData === true;

  return compactDevice ||
    reducedMotion ||
    saveData
    ? "performance"
    : "quality";
}

function readStoredMode() {
  try {
    return window.localStorage.getItem(
      STORAGE_KEY,
    );
  } catch {
    return null;
  }
}

function initializeClientState() {
  if (
    initialized ||
    typeof window === "undefined"
  ) {
    return;
  }

  initialized = true;

  const storedMode =
    readStoredMode();

  if (isExperienceMode(storedMode)) {
    currentState = {
      mode: storedMode,
      source: "manual",
    };

    return;
  }

  currentState = {
    mode: getDeviceDefault(),
    source: "default",
  };
}

function updateDeviceDefault() {
  if (
    currentState.source !==
    "default"
  ) {
    return;
  }

  const nextMode =
    getDeviceDefault();

  if (
    nextMode ===
    currentState.mode
  ) {
    return;
  }

  currentState = {
    mode: nextMode,
    source: "default",
  };

  notifyListeners();
}

function subscribe(
  listener: () => void,
) {
  initializeClientState();

  listeners.add(listener);

  const compactQuery =
    window.matchMedia(
      COMPACT_DEVICE_QUERY,
    );

  const motionQuery =
    window.matchMedia(
      REDUCED_MOTION_QUERY,
    );

  const connection =
    getConnection();

  let resizeTimer = 0;

  function scheduleDefaultUpdate() {
    window.clearTimeout(
      resizeTimer,
    );

    resizeTimer =
      window.setTimeout(
        updateDeviceDefault,
        180,
      );
  }

  function handleStorage(
    event: StorageEvent,
  ) {
    if (
      event.key !== STORAGE_KEY
    ) {
      return;
    }

    if (
      isExperienceMode(
        event.newValue,
      )
    ) {
      currentState = {
        mode: event.newValue,
        source: "manual",
      };
    } else {
      currentState = {
        mode: getDeviceDefault(),
        source: "default",
      };
    }

    notifyListeners();
  }

  compactQuery.addEventListener(
    "change",
    scheduleDefaultUpdate,
  );

  motionQuery.addEventListener(
    "change",
    scheduleDefaultUpdate,
  );

  connection?.addEventListener?.(
    "change",
    scheduleDefaultUpdate,
  );

  window.addEventListener(
    "storage",
    handleStorage,
  );

  return () => {
    listeners.delete(listener);

    window.clearTimeout(
      resizeTimer,
    );

    compactQuery.removeEventListener(
      "change",
      scheduleDefaultUpdate,
    );

    motionQuery.removeEventListener(
      "change",
      scheduleDefaultUpdate,
    );

    connection?.removeEventListener?.(
      "change",
      scheduleDefaultUpdate,
    );

    window.removeEventListener(
      "storage",
      handleStorage,
    );
  };
}

function getSnapshot() {
  return currentState;
}

function getServerSnapshot() {
  return SERVER_STATE;
}

function updateExperienceMode(
  mode: ExperienceMode,
  options?: SetModeOptions,
) {
  const persist =
    options?.persist ?? true;

  const source =
    options?.source ??
    (
      persist
        ? "manual"
        : "session"
    );

  currentState = {
    mode,
    source,
  };

  if (
    persist &&
    typeof window !== "undefined"
  ) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        mode,
      );
    } catch {
      // Storage can be unavailable in strict privacy modes.
    }
  }

  notifyListeners();
}

const ExperienceModeContext =
  createContext<ExperienceModeContextValue | null>(
    null,
  );

export default function ExperienceModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const state =
    useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );

  const value =
    useMemo<ExperienceModeContextValue>(
      () => ({
        mode: state.mode,
        userSelected:
          state.source ===
          "manual",
        setExperienceMode:
          updateExperienceMode,
      }),
      [
        state.mode,
        state.source,
      ],
    );

  return (
    <ExperienceModeContext.Provider
      value={value}
    >
      {children}
    </ExperienceModeContext.Provider>
  );
}

export function useExperienceMode() {
  const context =
    useContext(
      ExperienceModeContext,
    );

  if (!context) {
    throw new Error(
      "useExperienceMode must be used inside ExperienceModeProvider.",
    );
  }

  return context;
}
