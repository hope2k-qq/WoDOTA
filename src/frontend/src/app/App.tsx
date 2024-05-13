import React, {useEffect} from 'react';
import './app.module.scss';
import {CssBaseline, Grid, ThemeProvider} from "@mui/material";
import {Routing} from "../routes/Routing";
import i18n from "../locales/i18n";
import {I18nextProvider} from "react-i18next";
import {setThemeVariables} from "../themesToSCSS";
import {themes} from "../themes";
import {useThemeStore} from "../entities/stores/useThemeStore";
import styles from "./app.module.scss";

const App = () => {
    const { getCurrentTheme } = useThemeStore();
    const theme = getCurrentTheme() || themes[0];
    useEffect(() => {
        setThemeVariables(theme);
    }, [theme]);
    return (
        <ThemeProvider theme={theme}>
            <I18nextProvider i18n={i18n}>
                <CssBaseline />
                <Grid item md={12} className={styles.app}>
                    <Routing />
                </Grid>
            </I18nextProvider>
        </ThemeProvider>
    );
}

export default App;
