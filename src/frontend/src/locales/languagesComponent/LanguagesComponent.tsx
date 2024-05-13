import React, { useEffect, useState, useMemo } from "react";
import styles from "./languages_component.module.scss";
import { useTranslation } from "react-i18next";
import ua from "../../assets/images/ua.png";
import en from "../../assets/images/en.png";
import ru from "../../assets/images/ru.png";

type Language = "ua" | "ru" | "en";
export const LanguagesComponent: React.FC = () => {
    const { i18n } = useTranslation();

    const languages: Language[] = useMemo(() => ["ua", "ru", "en"], []);
    const flags: Record<Language, string> = { ua, ru, en };

    const [currentLanguageIndex, setCurrentLanguageIndex]
        = useState<number>(() => {
        const storedLanguageIndex = parseInt(localStorage.getItem("languageIndex") || "0", 10);
        return storedLanguageIndex >= 0 && storedLanguageIndex < languages.length ? storedLanguageIndex : 0;
    });

    useEffect(() => {
        localStorage.setItem("languageIndex", String(currentLanguageIndex));
        const language = languages[currentLanguageIndex];
        i18n.changeLanguage(language);
    }, [currentLanguageIndex, i18n, languages]);

    const changeLanguage = () => {
        setCurrentLanguageIndex((prevIndex) => (prevIndex + 1) % languages.length);
    };

    return (
        <div className={styles.div}>
            <img src={flags[languages[currentLanguageIndex]]} alt={languages[currentLanguageIndex]} onClick={changeLanguage} />
        </div>
    );
};
