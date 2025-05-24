import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../locales/i18n";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
const API_IP = process.env.REACT_APP_API_IP;
const CACHE_VERSION = '29.0';

type MyDataContextType = {
    language: string | null;
    heroesData: any | null;
    generalTalents: any | null;
    languageReady: boolean;
    reloadData: (lang?: string) => Promise<void>;
};

// ——— Контекст ———
const MyDataContext = createContext<MyDataContextType | undefined>(undefined);

// ——— Провайдер ———
export const MyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string | null>(null);
    const [heroesData, setHeroesData] = useState<any | null>(null);
    const [generalTalents, setGeneralTalents] = useState<any | null>(null);
    const [languageReady, setLanguageReady] = useState(false);

    const reloadData = async (langParam?: string) => {
        const lang = langParam || await getDefaultLanguage();
        await i18n.changeLanguage(lang);
        localStorage.setItem("language", lang);
        setLanguage(lang);

        try {
            const response = await axios.get(`${API_URL}/heroesAllDataJson/${lang}`);
            const data = response.data;
            setHeroesData(data);
            localStorage.setItem("heroesData", JSON.stringify(data));
            localStorage.setItem("cacheVersion", CACHE_VERSION);
        } catch (error) {
            console.error("Ошибка при загрузке heroesData:", error);
        }

        try {
            const response = await axios.get(`${API_URL}/general_talents/${lang}`);
            setGeneralTalents(response.data);
            localStorage.setItem("generalTalents", JSON.stringify(response.data));
        } catch (error) {
            console.error("Ошибка при загрузке generalTalents:", error);
        }
        setLanguageReady(true);
    };

    // const clearAllIndexedDB = async () => {
    //     try {
    //         const databases = await indexedDB.databases();
    //
    //         for (const db of databases) {
    //             if (db.name) {
    //                 const request = indexedDB.deleteDatabase(db.name);
    //
    //                 request.onerror = (event) => {
    //                     //console.error(`Ошибка при удалении базы данных ${db.name}`);
    //                 };
    //
    //                 request.onsuccess = () => {
    //                     //console.log(`База данных ${db.name} успешно удалена`);
    //                 };
    //             } else {
    //                 //console.warn('Имя базы данных отсутствует, пропускаем удаление');
    //             }
    //         }
    //
    //         //console.log('Все базы данных удалены');
    //     } catch (error) {
    //         //console.error('Ошибка при удалении баз данных:', error);
    //     }
    // };
    const clearAllIndexedDB = async () => {
        try {
            // Получаем список всех баз данных
            const databases = await indexedDB.databases();

            // Перебираем все базы данных
            for (const db of databases) {
                if (db.name) {
                    // Открываем базу данных для получения доступа к её хранилищам
                    const request = indexedDB.open(db.name);

                    request.onsuccess = (event: Event) => {
                        const target = event.target as IDBRequest;
                        if (target.result) {
                            const dbInstance = target.result;

                            // Перебираем все объектные хранилища в базе данных
                            const objectStoreNames: DOMStringList = dbInstance.objectStoreNames;

                            // Преобразуем DOMStringList в массив
                            const objectStoreNamesArray = Array.from(objectStoreNames);

                            objectStoreNamesArray.forEach((storeName: string) => {
                                // Начинаем транзакцию для удаления данных в каждом хранилище
                                const transaction = dbInstance.transaction(storeName, 'readwrite');
                                const store = transaction.objectStore(storeName);

                                // Очищаем хранилище
                                store.clear();
                                console.log(`Хранилище ${storeName} в базе данных ${db.name} очищено`);
                            });

                            // Закрываем базу данных после очистки
                            dbInstance.close();
                        } else {
                            console.error(`Не удалось открыть базу данных ${db.name}`);
                        }
                    };

                    request.onerror = (event) => {
                        console.error(`Ошибка при открытии базы данных ${db.name}`, event);
                    };
                }
            }

            console.log('Все базы данных очищены');
        } catch (error) {
            console.error('Ошибка при очистке баз данных:', error);
        }
    };





    useEffect(() => {
        const clearAllCaches = async () => {
            localStorage.clear();
            sessionStorage.clear();
            await clearAllIndexedDB();
            document.cookie.split(";").forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            });
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(cache => caches.delete(cache)));
            }
            if ("serviceWorker" in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
        };
        const cachedVersion = localStorage.getItem("cacheVersion");
        if (cachedVersion !== CACHE_VERSION) {
            clearAllCaches();
            reloadData();
        } else{
            setLanguageReady(true);
        }
    }, []);

    return (
        <MyDataContext.Provider value={{ language, heroesData, generalTalents, languageReady, reloadData }}>
            {children}
        </MyDataContext.Provider>
    );
};

// ——— Хук для доступа к контексту ———
export const useMyData = (): MyDataContextType => {
    const context = useContext(MyDataContext);
    if (!context) {
        throw new Error("useMyData must be used within a MyDataProvider");
    }
    return context;
};

// ——— Вспомогательные функции ———
const getCountryByIP = async (): Promise<string | null> => {
    try {
        const response = await fetch(`https://ipinfo.io/json?token=${API_IP}`);
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
