import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

import {translateTree} from '../../shared/translation-review';
const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ms", label: "Bahasa Malaysia", nativeLabel: "Bahasa Malaysia" },
  { code: "zh", label: "Chinese (中文)", nativeLabel: "中文" },
];

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

  const [bundles,setBundles]=useState({});
  useEffect(()=>{
    if(language==='en')return;
    let active=true;
    const refresh=()=>fetch('/api/public/translations?language='+language,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(active)setBundles(current=>({...current,[language]:d.approved||{}}));}).catch(()=>{if(active)setBundles(current=>({...current,[language]:{}}));});
    refresh();window.addEventListener('focus',refresh);
    const timer=setInterval(refresh,30000);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[language]);
  const approved=useMemo(()=>language==='en'?{}:bundles[language]||{},[language,bundles]);
  const translateContent=useCallback((value,prefix)=>translateTree(value,prefix,approved),[approved]);
  const t=useMemo(()=>translateTree(translations.en,'ui',approved),[approved]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateContent,
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
