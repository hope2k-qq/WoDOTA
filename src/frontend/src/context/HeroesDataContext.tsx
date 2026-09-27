import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../locales/i18n";
import axios from "axios";
import { CACHE_VERSION, FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from "../constants/api";

const API_URL = process.env.REACT_APP_API_URL;

type MyDataContextType = {
    language: string | null;
    generalTalents: any | null;
    heroesAttributes: any | null;
    languageReady: boolean;
    reloadData: (lang?: string) => Promise<void>;
};

const MyDataContext = createContext<MyDataContextType | undefined>(undefined);

export const MyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string | null>(null);
    const [generalTalents, setGeneralTalents] = useState<any | null>(null);
    const [heroesAttributes, setHeroesAttributes] = useState<any | null>(null);
    const [languageReady, setLanguageReady] = useState(false);

    const reloadData = React.useCallback(async (langParam?: string) => {
        try {
            setLanguageReady(false);

            const lang = langParam || await getDefaultLanguage();

            await i18n.changeLanguage(lang);
            localStorage.setItem("language", lang);
            setLanguage(lang);

            axios
                .post(
                    `${API_URL}/account/settings`,
                    { language: lang },
                    { withCredentials: true }
                )
                .catch(() => undefined);

            const [talentsResponse, heroesAttributesResponse] = await Promise.all([
                axios.get(
                    `${API_URL}/general_talents/${lang}?v=${CACHE_VERSION}`
                ),
                axios.get(
                    `${API_URL}/heroes?v=${CACHE_VERSION}`
                ),
            ]);

            setGeneralTalents(talentsResponse.data);
            setHeroesAttributes(heroesAttributesResponse.data);

            setLanguageReady(true);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            setLanguageReady(true);
        }
    }, []);

    useEffect(() => {
        reloadData();
    }, [reloadData]);

    return (
        <MyDataContext.Provider
            value={{
                language,
                generalTalents,
                heroesAttributes,
                languageReady,
                reloadData,
            }}
        >
            {children}
        </MyDataContext.Provider>
    );
};

export const useMyData = (): MyDataContextType => {
    const context = useContext(MyDataContext);

    if (!context) {
        throw new Error("useMyData must be used within MyDataProvider");
    }

    return context;
};

const detectLanguageSync = (): string | null => {
    const fromPath = window.location.pathname.split("/")[1];
    if (SUPPORTED_LANGUAGES.includes(fromPath)) return fromPath;

    const saved = localStorage.getItem("language");
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;

    return null;
};

const getDefaultLanguage = async (): Promise<string> => {
    const known = detectLanguageSync();
    if (known) return known;

    try {
        const response = await axios.get(`${API_URL}/detect-language`);
        const lang = response.data?.lang;
        if (lang && SUPPORTED_LANGUAGES.includes(lang)) return lang;
    } catch {
        return FALLBACK_LANGUAGE;
    }

    return FALLBACK_LANGUAGE;
};