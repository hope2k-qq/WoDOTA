import React, {useEffect, useState} from 'react';
import './app.module.scss';
import {CssBaseline, Grid, ThemeProvider} from "@mui/material";
import {Routing} from "../routes/Routing";
import i18n from "../locales/i18n";
import {I18nextProvider} from "react-i18next";
import {setThemeVariables} from "../themesToSCSS";
import {themes} from "../themes";
import {useThemeStore} from "../entities/stores/useThemeStore";
import styles from "./app.module.scss";
import MaintenancePage from "../pages/maintenance/MaintenancePage";
import axios from "axios";
import {UnreadNewsProvider} from "../context/UnreadNewsContext";
const CACHE_VERSION = '2.0';

const App = () => {
    const { getCurrentTheme } = useThemeStore();
    const theme = getCurrentTheme() || themes[0];
    const API_URL = process.env.REACT_APP_API_URL;
    const [isMaintenance] = useState(false);

    const clearAllIndexedDB = async () => {
        try {
            const databases = await indexedDB.databases();

            for (const db of databases) {
                if (db.name) {
                    const request = indexedDB.deleteDatabase(db.name);

                    request.onerror = (event) => {
                        //console.error(`Ошибка при удалении базы данных ${db.name}`);
                    };

                    request.onsuccess = () => {
                        //console.log(`База данных ${db.name} успешно удалена`);
                    };
                } else {
                    //console.warn('Имя базы данных отсутствует, пропускаем удаление');
                }
            }

            //console.log('Все базы данных удалены');
        } catch (error) {
            //console.error('Ошибка при удалении баз данных:', error);
        }
    };



    useEffect(() => {
        const cachedVersion = localStorage.getItem('cacheVersion');
        const cachedData = localStorage.getItem('heroesData');

        if (cachedVersion === CACHE_VERSION && cachedData) {
            //console.log('Данные загружены из localStorage:', JSON.parse(cachedData));
            return;
        }

        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/heroesAllDataJson`);
                const data = response.data;

                localStorage.setItem('heroesData', JSON.stringify(data));
                localStorage.setItem('cacheVersion', CACHE_VERSION);
                window.location.reload();
                //console.log('Данные загружены с сервера:', data);
            } catch (error) {
                //console.error('Ошибка при загрузке данных с сервера:', error);
            }
        };

        fetchData();
        clearAllIndexedDB();
    }, [API_URL])

    useEffect(() => {
        setThemeVariables(theme);
    }, [theme]);

    if (isMaintenance) {
        return <MaintenancePage />;
    }

    return (
        <ThemeProvider theme={theme}>
            <I18nextProvider i18n={i18n}>
                <CssBaseline />
                <UnreadNewsProvider>
                    <Grid item md={12} className={styles.app}>
                        <Routing />
                    </Grid>
                </UnreadNewsProvider>
            </I18nextProvider>
        </ThemeProvider>
    );
}

export default App;
