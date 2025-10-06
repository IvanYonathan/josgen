import { APPLICATION_LANGUAGE, AVAILABLE_LANGUAGES } from "@/configs/application";
import React from "react";
import { useTranslation } from "react-i18next"

interface UseLanguageData
{
  availableLanguages: { code: string; name: string }[];
  language: string;
  defaultLanguage: string;
  changeLanguage: (value: string) => void;
}

function useLanguage(): UseLanguageData {

  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('egeroo.webapp.language', lng);
  }

  const availableLanguages = React.useMemo(() => {
    return AVAILABLE_LANGUAGES.map(lang => ({
      code: lang,
      name: t(`common:languages.${lang}`)
    }));
  }, [AVAILABLE_LANGUAGES, t]);

  return { 
    language: i18n.language,
    defaultLanguage: APPLICATION_LANGUAGE,
    availableLanguages,
    changeLanguage, 
  };
}

export {
  useLanguage,
}