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

type ExperienceModeState = {
  mode: ExperienceMode;

  /*
   * false:
   * the site is still allowed to automatically optimize
   * weak mobile devices.
   *
   * true:
   * the visitor explicitly selected a mode.
   */
  userSelected: boolean;
};

type SetModeOptions = {
  persist?: boolean;
};

type ExperienceModeContextValue =
  ExperienceModeState & {
    setExperienceMode: (
      mode: ExperienceMode,
      options?: SetModeOptions,
    ) => void;
  };

const STORAGE_KEY =
  "baki-portfolio-experience-mode";

const SERVER_STATE: ExperienceModeState = {
  mode: "quality",
  userSelected: false,
};

let currentState: ExperienceModeState = SERVER_STATE;

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

function initializeClientState() {
  if (
    initialized ||
    typeof window === "undefined"
  ) {
    return;
  }

  initialized = true;

  const storedMode =
    window.localStorage.getItem(
      STORAGE_KEY,
    );

  if (isExperienceMode(storedMode)) {
    currentState = {
      mode: storedMode,
      userSelected: true,
    };
  }
}

function subscribe(
  listener: () => void,
) {
  initializeClientState();

  listeners.add(listener);

  function handleStorage(
    event: StorageEvent,
  ) {
    if (
      event.key !== STORAGE_KEY
    ) {
      return;
    }

    if (
      !isExperienceMode(
        event.newValue,
      )
    ) {
      return;
    }

    currentState = {
      mode: event.newValue,
      userSelected: true,
    };

    notifyListeners();
  }

  window.addEventListener(
    "storage",
    handleStorage,
  );

  return () => {
    listeners.delete(listener);

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

  currentState = {
    mode,
    userSelected: persist,
  };

  if (
    persist &&
    typeof window !== "undefined"
  ) {
    window.localStorage.setItem(
      STORAGE_KEY,
      mode,
    );
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
          state.userSelected,

        setExperienceMode:
          updateExperienceMode,
      }),
      [
        state.mode,
        state.userSelected,
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