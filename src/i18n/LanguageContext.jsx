import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ms", label: "Bahasa Melayu", nativeLabel: "Bahasa Melayu" },
  { code: "zh", label: "Chinese (中文)", nativeLabel: "中文" },
];

function deepMerge(target, source) {
  if (!target) return source;
  const result = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (
      result[key] === undefined ||
      result[key] === "" ||
      (Array.isArray(result[key]) && result[key].length === 0 && Array.isArray(source[key]) && source[key].length > 0)
    ) {
      result[key] = source[key];
    }
  }
  return result;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem("dch_language");
      if (saved && (saved === "en" || saved === "ms" || saved === "zh")) {
        return saved;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return "en";
  });

  const setLanguage = (newLang) => {
    if (newLang === "en" || newLang === "ms" || newLang === "zh") {
      setLanguageState(newLang);
      try {
        localStorage.setItem("dch_language", newLang);
      } catch {
        // localStorage not supported/accessible
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-Hans" : language;
  }, [language]);

  const t = deepMerge(translations[language] || {}, translations.en);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageConfig:
          SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
          SUPPORTED_LANGUAGES[0],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
