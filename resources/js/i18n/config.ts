import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APPLICATION_LANGUAGE } from '@/configs/application';

const translationFiles = import.meta.glob('./*/**/*.json', { eager: true });

/**
 * Transform glob imports into i18next resources structure
 * Converts './en/division.json' -> resources.en.division = {...}
 * Converts './id/common.json' -> resources.id.common = {...}
 * 
 * Can also handle nested namespaces like 
 * './en/pages/division/components/dialog.json' -> resources.en['pages/division/components/dialog'] = {...}
 */
function buildTranslations(files: Record<string, any>) {
  const resources: Record<string, Record<string, any>> = {};
  const regex = /\.\/([^/]+)\/(.+)\.json$/;

  Object.entries(files).forEach(([path, module]) => {
    // Extract language and namespace from path
    // Example: './en/division.json' -> language: 'en', namespace: 'division'
    const match = regex.exec(path);
    if (match) {
      const language = match[1];
      const namespace = match[2];
      if (!resources[language]) {
        resources[language] = {};
      }
      resources[language][namespace] = module.default;
    }
  });
  return resources;
}

const savedLanguage = APPLICATION_LANGUAGE;

i18next.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: 'en',
  resources: buildTranslations(translationFiles),
});