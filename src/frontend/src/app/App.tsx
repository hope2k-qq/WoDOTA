import React, {useEffect, useState} from 'react';
import {CssBaseline, Grid, ThemeProvider} from "@mui/material";
import {Routing} from "../routes/Routing";
import i18n from "../locales/i18n";
import {I18nextProvider} from "react-i18next";
import {setThemeVariables} from "../themesToSCSS";
import {themes} from "../themes";
import {useThemeStore} from "../entities/stores/useThemeStore";
import styles from "./app.module.scss";
import MaintenancePage from "../pages/maintenance/MaintenancePage";
import {UnreadNewsProvider} from "../context/UnreadNewsContext";
import {HelmetProvider} from "react-helmet-async";
import {MyDataProvider, useMyData} from "../context/HeroesDataContext";
import {UserProvider} from "../context/UserContext";
//import RelocationNotice from "../widgets/relocationNotice/RelocationNotice";

const App = () => {
    const { getCurrentTheme } = useThemeStore();
    const theme = getCurrentTheme() || themes[0];
    const maintenance = process.env.REACT_APP_MAINTENANCE_MODE === 'true';
    const [isMaintenance] = useState(maintenance);
    useEffect(() => {
        setThemeVariables(theme);
    }, [theme]);

    if (isMaintenance) {
        return <MaintenancePage />;
    }

    return (
        <HelmetProvider>
            <ThemeProvider theme={theme}>
                <I18nextProvider i18n={i18n}>
                    <CssBaseline />
                    <MyDataProvider>
                        <UserProvider>
                            <UnreadNewsProvider>
                                <Grid item md={12} className={styles.app}>
                                    {/*<RelocationNotice />*/}
                                    <InnerApp />
                                </Grid>
                            </UnreadNewsProvider>
                        </UserProvider>
                    </MyDataProvider>
                </I18nextProvider>
            </ThemeProvider>
        </HelmetProvider>
    );
}

const InnerApp = () => {
    const { languageReady } = useMyData();

    return languageReady ? (
            <Routing />
    ) : null;
};

export default App;
