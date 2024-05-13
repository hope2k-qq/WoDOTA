import React, {useEffect} from 'react';
import './App.css';
import {Grid, ThemeProvider} from "@mui/material";
import {Routing} from "../routes/Routing";
import i18n from "../locales/i18n";
import {I18nextProvider} from "react-i18next";
import {setThemeVariables} from "../themesToSCSS";
import {themes} from "../themes";
import {useThemeStore} from "../entities/stores/useThemeStore";

const App = () => {
    const { getCurrentTheme } = useThemeStore();
    const theme = getCurrentTheme() || themes[0];
    useEffect(() => {
        setThemeVariables(theme);
    }, [theme]);
    return (
        <ThemeProvider theme={theme}>
            <I18nextProvider i18n={i18n}>
                <Grid item md={12} style={{background: "red", width: "100%", display: "flex", justifyContent: "center"}}>
                    <Routing />
                </Grid>
            </I18nextProvider>
        </ThemeProvider>
    );
}

export default App;
