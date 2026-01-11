import { createContext, useContext, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t, i18n } = useTranslation();

  const language = (i18n.language?.split("-")[0] as Language) || "en";
  const isRTL = i18n.dir(language) === "rtl";

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", language);
    localStorage.setItem("app-language", language);
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  const safeT = (key: string, options?: any): string => {
    return t(key, options) as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: safeT, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
