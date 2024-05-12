import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import EN from './languages/en.json';
import UA from './languages/ua.json';
import RU from './languages/ru.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: EN,
            },
            ua: {
                translation: UA,
            },
            ru: {
                translation: RU,
            }
        },
        lng: 'ru',
        fallbackLng: 'ru',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
