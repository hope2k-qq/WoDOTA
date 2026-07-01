import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../locales/i18n";
import axios from "axios";

const API_IP = process.env.REACT_APP_API_IP;
const API_URL = process.env.REACT_APP_API_URL;

const CACHE_VERSION = "104.0";

type MyDataContextType = {
    language: string | null;
    heroesData: any | null;
    generalTalents: any | null;
    heroesAttributes: any | null;
    languageReady: boolean;
    reloadData: (lang?: string) => Promise<void>;
};

const MyDataContext = createContext<MyDataContextType | undefined>(undefined);

export const MyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string | null>(null);
    const [heroesData, setHeroesData] = useState<any | null>(null);
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

            try {
                await axios.post(
                    `${API_URL}/account/settings`,
                    { language: lang },
                    { withCredentials: true }
                );
            } catch (err) {
                console.warn("Не удалось сохранить язык:", err);
            }

            const [heroesResponse, talentsResponse, heroesAttributesResponse] = await Promise.all([
                axios.get(
                    `${API_URL}/heroesAllDataJson/${lang}?v=${CACHE_VERSION}`
                ),
                axios.get(
                    `${API_URL}/general_talents/${lang}?v=${CACHE_VERSION}`
                ),
                axios.get(
                    `${API_URL}/heroes?v=${CACHE_VERSION}`
                ),
            ]);

            setHeroesData(heroesResponse.data);
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
                heroesData,
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

const getCountryByIP = async (): Promise<string | null> => {
    try {
        const response = await fetch(
            `https://ipinfo.io/json?token=${API_IP}`
        );
        const data = await response.json();
        return data.country;
    } catch {
        return null;
    }
};

const getDefaultLanguage = async (): Promise<string> => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) return savedLanguage;

    const country = await getCountryByIP();

    if (country === "UA") return "uk";
    if (country === "RU") return "ru";
    if (country === "CZ") return "cs";

    return "en";
};