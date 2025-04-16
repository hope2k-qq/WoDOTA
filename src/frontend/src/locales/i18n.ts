import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // 👈 вот оно!

import EN from './languages/en.json';
import UK from './languages/uk.json';
import RU from './languages/ru.json';
import CS from './languages/cs.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: EN },
            uk: { translation: UK },
            ru: { translation: RU },
            cs: { translation: CS },
        },
        fallbackLng: 'ru',
        supportedLngs: ['en', 'ru', 'uk', 'cs'],
        detection: {
            order: ['path', 'localStorage', 'cookie', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false,
        },
    });

i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});

export default i18n;
