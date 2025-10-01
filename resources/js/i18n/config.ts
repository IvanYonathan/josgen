import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './en/translation';
import idTranslation from './id/translation';
import { APPLICATION_LANGUAGE } from '../configs/application';

const savedLanguage = APPLICATION_LANGUAGE;

i18next.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: 'en',
  resources: {
    en: enTranslation,
    id: idTranslation,
  },
});