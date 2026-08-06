"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  siteCopy,
  type Language,
  type SiteCopy,
} from "@/lib/site-copy";

const STORAGE_KEY = "baki-portfolio-language";

type LanguageContextValue = {
  language: Language;
  copy: SiteCopy;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(
  null,
);

const languageListeners = new Set<() => void>();

let currentLanguage: Language = "en";

function normalizeLanguage(value: string | null): Language {
  return value === "am" ? "am" : "en";
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  return normalizeLanguage(
    window.localStorage.getItem(STORAGE_KEY),
  );
}

function getLanguageSnapshot(): Language {
  currentLanguage = readStoredLanguage();

  return currentLanguage;
}

function getLanguageServerSnapshot(): Language {
  return "en";
}

function notifyLanguageListeners() {
  languageListeners.forEach((listener) => {
    listener();
  });
}

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    currentLanguage = normalizeLanguage(event.newValue);
    notifyLanguageListeners();
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveLanguage(language: Language) {
  currentLanguage = language;

  window.localStorage.setItem(STORAGE_KEY, language);

  notifyLanguageListeners();
}

export default function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getLanguageServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
  }, [language]);

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      saveLanguage(nextLanguage);
    },
    [],
  );

  const toggleLanguage = useCallback(() => {
    saveLanguage(language === "en" ? "am" : "en");
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      copy: siteCopy[language],
      setLanguage,
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider.",
    );
  }

  return context;
}