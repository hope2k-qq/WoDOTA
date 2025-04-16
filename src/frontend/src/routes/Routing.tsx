import {Grid} from "@mui/material";
import {BrowserRouter, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {HomePage} from "../pages/home/HomePage";
import {LeaderboardPage} from "../pages/leaderboard/LeaderboardPage";
import {HeroesPage} from "../pages/heroes/HeroesPage";
import {VotesPage} from "../pages/votes/VotesPage";
import HeroPage from "../pages/heroes/components/heroPage/HeroPage";
import {TopBar} from "../widgets/topBar/TopBar";
import {NotFoundPage} from "../pages/notFound/NotFoundPage";
import {Footer} from "../widgets/footer/Footer";
import ScrollToTop from "../widgets/scrollToTop/ScrollToTop";
import {HeroBuildPage} from "../pages/heroes/components/heroBuildPage/HeroBuildPage";
import {NewsPage} from "../pages/news/NewsPage";
import {TournamentsPage} from "../pages/tournaments/TournamentsPage";
import {PrivacyPolicyPage} from "../pages/privacyPolicy/PrivacyPolicyPage";
import {TrackPageView} from "../utils/TrackPageView";
import { PageWrapper } from "./components/PageWrapper";
import i18n from "../locales/i18n";
import {useEffect} from "react";
import { Navigate } from "react-router-dom";
import {Helmet} from "react-helmet-async";
import {useMyData} from "../context/HeroesDataContext";

interface RouteTitle {
    en: string;
    ru: string;
    uk: string;
    cs: string;
}

const routes: { path: string; element: JSX.Element; title: RouteTitle, description: RouteTitle }[] = [
    {
        path: "/",
        element: <HomePage />,
        title: {
            en: "WoDOTA (World of Dota) – A custom Dota 2 game",
            ru: "WoDOTA (World of Dota) – Водота, Ворлд оф Дота, кастомная игра Dota 2",
            uk: "WoDOTA (World of Dota) – Водота, кастомна гра Dota 2",
            cs: "WoDOTA (World of Dota) – Svět Dota 2"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/leaderboard",
        element: <LeaderboardPage />,
        title: {
            en: "WoDOTA – Leaderboard",
            ru: "WoDOTA (World of Dota) - Таблица лидеров",
            uk: "WoDOTA – Лідерборд",
            cs: "WoDOTA – Tabulka výsledků"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/heroes",
        element: <HeroesPage />,
        title: {
            en: "WoDOTA – Heroes",
            ru: "WoDOTA (World of Dota) - Герои",
            uk: "WoDOTA – Герої",
            cs: "WoDOTA – Hrdinové"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/hero/:name",
        element: <HeroPage />,
        title: {
            en: "WoDOTA – Hero",
            ru: "WoDOTA (World of Dota) - Герой",
            uk: "WoDOTA – Герой",
            cs: "WoDOTA – Hrdina"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/hero-build/:id",
        element: <HeroBuildPage />,
        title: {
            en: "WoDOTA – Hero Build",
            ru: "WoDOTA (World of Dota) - Билд на героя",
            uk: "WoDOTA – Білд на героя",
            cs: "WoDOTA – Stavba hrdiny"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/news",
        element: <NewsPage />,
        title: {
            en: "WoDOTA – News",
            ru: "WoDOTA (World of Dota) - Новости",
            uk: "WoDOTA – Новини",
            cs: "WoDOTA – Novinky"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/tournament",
        element: <TournamentsPage />,
        title: {
            en: "WoDOTA – Tournaments",
            ru: "WoDOTA (World of Dota) - Турниры",
            uk: "WoDOTA – Турніри",
            cs: "WoDOTA – Turnaje"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/privacy-policy",
        element: <PrivacyPolicyPage />,
        title: {
            en: "WoDOTA – Privacy Policy",
            ru: "WoDOTA (World of Dota) - Политика конфиденциальности",
            uk: "WoDOTA – Політика конфіденційності",
            cs: "WoDOTA – Zásady ochrany osobních údajů"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "/votes",
        element: <VotesPage />,
        title: {
            en: "WoDOTA – Votes",
            ru: "WoDOTA (World of Dota) - Голосования",
            uk: "WoDOTA – Голосування",
            cs: "WoDOTA – Hlasování"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    },
    {
        path: "*",
        element: <NotFoundPage />,
        title: {
            en: "WoDOTA – Page Not Found",
            ru: "WoDOTA (World of Dota) - Страница не найдена",
            uk: "WoDOTA – Сторінка не знайдена",
            cs: "WoDOTA – Stránka nenalezena"
        },
        description: {
            en: "WoDOTA is a custom Dota 2 game with unique heroes and gameplay mechanics.",
            ru: "WoDOTA – это кастомная игра Dota 2 с уникальными героями и механиками игрового процесса.",
            uk: "WoDOTA – це кастомна гра Dota 2 з унікальними героями та механікою гри.",
            cs: "WoDOTA je vlastní hra Dota 2 s unikátními hrdiny a herními mechanikami."
        }
    }
];

const LanguageRedirect = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!i18n.isInitialized) return;

        const segments = pathname.split('/');
        const langPrefix = segments[1];

        const validLanguages = ['en', 'ru', 'uk', 'cs'];

        if (!validLanguages.includes(langPrefix)) {
            const defaultLang = i18n.language || 'ru';
            const newPath = `/${defaultLang}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
            navigate(newPath, { replace: true });
        }
    }, [pathname, navigate]);

    return null;
};

const LanguageSwitchingRoutes = () => {
    const { pathname } = useLocation();
    const languagePrefix = pathname.split('/')[1];
    const lang: keyof RouteTitle = ['en', 'uk', 'ru', 'cs'].includes(languagePrefix) ? languagePrefix as keyof RouteTitle : localStorage.getItem("language") as keyof RouteTitle;
    const { reloadData, language } = useMyData();

    useEffect(() => {
        if (language !== lang) {
            document.documentElement.lang = lang;
            i18n.changeLanguage(lang);
            reloadData(lang);
        }
    }, [lang, reloadData, language]);

    return (
        <Routes>
            <Route path="/" element={<Navigate to={`/${lang}`} replace />} />

            {routes.map(({ path, element, title, description }) => {
                const localizedPath =
                    path === "*"
                        ? `/${lang}/*`
                        : `/${lang}${path === "/" ? "" : path}`;


                return (
                    <Route
                        key={localizedPath}
                        path={`${localizedPath}`}
                        element={
                            <>
                                <Helmet>
                                    <title>{title[lang]}</title>
                                    <meta name="description" content={description[lang]}/>
                                    <meta property="og:title" content={title[lang]}/>
                                    <meta property="og:description" content={description[lang]}/>
                                    <meta property="og:locale" content={lang}/>
                                    <meta property="og:url"
                                          content={`https://wodota.pro/${lang}${path.replace(/\/$/, '')}`}/>
                                    <link rel="alternate" hrefLang="en"
                                          href={`https://wodota.pro/en${path.replace(/\/$/, '')}`}/>
                                    <link rel="alternate" hrefLang="ru"
                                          href={`https://wodota.pro/ru${path.replace(/\/$/, '')}`}/>
                                    <link rel="alternate" hrefLang="uk"
                                          href={`https://wodota.pro/uk${path.replace(/\/$/, '')}`}/>
                                    <link rel="alternate" hrefLang="cs"
                                          href={`https://wodota.pro/cs${path.replace(/\/$/, '')}`}/>
                                    <link rel="alternate" hrefLang="x-default"
                                          href={`https://wodota.pro${path.replace(/\/$/, '')}`}/>
                                </Helmet>
                                {path === "/" ? element : <PageWrapper>{element}</PageWrapper>}
                            </>
                        }
                    />
                );
            })}
        </Routes>
    );
};

export const Routing = () => {

    return (
        <BrowserRouter>
            <ScrollToTop />
            <TrackPageView />
            <LanguageRedirect />
            <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", position: "relative" }}>
                <TopBar />
                <Grid container style={{ width: "100%" }}>
                    <Grid item xs={12} style={{ minHeight: "120vh" }}>
                        <LanguageSwitchingRoutes />
                    </Grid>
                    <Grid item xs={12}>
                        <Footer />
                    </Grid>
                </Grid>
            </div>
        </BrowserRouter>
    );
};