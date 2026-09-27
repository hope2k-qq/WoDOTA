import { useTranslation } from "react-i18next";
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from "../constants/api";

export function useLang(): string {
    const { i18n } = useTranslation();

    const detected = i18n.resolvedLanguage || i18n.language || "";
    const short = detected.split("-")[0];

    return SUPPORTED_LANGUAGES.includes(short) ? short : FALLBACK_LANGUAGE;
}
