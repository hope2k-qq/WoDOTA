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
import {useTranslation} from "react-i18next";

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
            en: "World of Dota (WoDOTA) is a custom game for Dota 2",
            ru: "World of Dota (WoDOTA) — Водота, Ворлд оф Дота, кастомная игра Dota 2",
            uk: "World of Dota (WoDOTA) — Водота, Ворлд оф Дота, кастомна гра Dota 2",
            cs: "World of Dota (WoDOTA) je custom hra pro Dota 2"
        },
        description: {
            en: "World of Dota (WoDOTA) is a unique game based on Dota 2. In it, players can test their strength in various modes, revealing the potential of each hero through a variety of unique talents.",
            ru: "World of Dota (WoDOTA) — уникальная игра на базе Dota 2. В ней игроки могут испытать свои силы в различных режимах, раскрывая потенциал каждого героя через множество уникальных талантов.",
            uk: "World of Dota (WoDOTA) — унікальна гра на базі Dota 2. У ній гравці можуть випробувати свої сили в різних режимах, розкриваючи потенціал кожного героя через безліч унікальних талантів.",
            cs: "World of Dota (WoDOTA) je jedinečná hra založená na Dota 2. V ní si hráči mohou vyzkoušet své síly v různých režimech a odhalit potenciál každého hrdiny prostřednictvím mnoha unikátních talentů."
        }
    },
    {
        path: "/leaderboard",
        element: <LeaderboardPage />,
        title: {
            en: "World of Dota (WoDOTA) — Leaderboard",
            ru: "World of Dota (WoDOTA) — Таблица лидеров",
            uk: "World of Dota (WoDOTA) — Таблиця лідерів",
            cs: "World of Dota (WoDOTA) — Tabulka lídrů"
        },
        description: {
            en: "Check out the World of Dota (WoDOTA) leaderboard — find out who’s the best in this custom Dota 2 mode!",
            ru: "Ознакомьтесь с таблицей лидеров World of Dota (WoDOTA) — узнайте, кто лучший в этом кастомном режиме Dota 2!",
            uk: "Перегляньте таблицю лідерів World of Dota (WoDOTA) — дізнайтеся, хто найкращий у цьому кастомному режимі Dota 2!",
            cs: "Prohlédněte si tabulku lídrů World of Dota (WoDOTA) — zjistěte, kdo je nejlepší v tomto customním režimu Dota 2!"
        }
    },
    {
        path: "/heroes",
        element: <HeroesPage />,
        title: {
            en: "World of Dota (WoDOTA) — Heroes",
            ru: "World of Dota (WoDOTA) — Герои",
            uk: "World of Dota (WoDOTA) — Герої",
            cs: "World of Dota (WoDOTA) — Hrdinové"
        },
        description: {
            en: "Discover the unique heroes of World of Dota (WoDOTA) — each with special abilities and talents!",
            ru: "Откройте для себя уникальных героев World of Dota (WoDOTA) — каждый с особыми способностями и талантами!",
            uk: "Познайте унікальних героїв World of Dota (WoDOTA) — кожен з особливими здібностями та талантами!",
            cs: "Objevte jedinečné hrdiny World of Dota (WoDOTA) — každý s unikátními schopnostmi a talenty!"
        }
    },
    {
        path: "/hero/:name",
        element: <HeroPage />,
        title: {
            en: "World of Dota (WoDOTA) — Hero",
            ru: "World of Dota (WoDOTA) — Герой",
            uk: "World of Dota (WoDOTA) — Герой",
            cs: "World of Dota (WoDOTA) — Hrdina"
        },
        description: {
            en: "Discover the hero's unique abilities and talents!",
            ru: "Откройте уникальные способности и таланты героя!",
            uk: "Відкрийте унікальні здібності та таланти героя!",
            cs: "Objevte jedinečné schopnosti a talenty hrdiny!"
        }
    },
    {
        path: "/hero-build/:id",
        element: <HeroBuildPage />,
        title: {
            en: "World of Dota (WoDOTA) — Hero Build",
            ru: "World of Dota (WoDOTA) — Билд на героя",
            uk: "World of Dota (WoDOTA) — Білд на героя",
            cs: "World of Dota (WoDOTA) — Build pro hrdinu"
        },
        description: {
            en: "Hero build in World of Dota (WoDOTA) — the perfect way to diversify your gameplay!",
            ru: "Билд для героя в World of Dota (WoDOTA) — идеальный вариант, чтобы разнообразить игру!",
            uk: "Білд для героя в World of Dota (WoDOTA) — ідеальний варіант для різноманітності гри!",
            cs: "Build pro hrdinu ve World of Dota (WoDOTA) — ideální způsob, jak zpestřit hru!"
        }
    },
    {
        path: "/news",
        element: <NewsPage />,
        title: {
            en: "World of Dota (WoDOTA) — News",
            ru: "World of Dota (WoDOTA) — Новости",
            uk: "World of Dota (WoDOTA) — Новини",
            cs: "World of Dota (WoDOTA) — Novinky"
        },
        description: {
            en: "Stay updated with the latest news and updates on the WoDOTA website!",
            ru: "Следите за последними новостями и обновлениями на сайте WoDOTA!",
            uk: "Слідкуйте за останніми новинами та оновленнями на сайті WoDOTA!",
            cs: "Sledujte nejnovější zprávy a aktualizace na webu WoDOTA!"
        }
    },
    {
        path: "/tournament",
        element: <TournamentsPage />,
        title: {
            en: "World of Dota (WoDOTA) — Tournaments",
            ru: "World of Dota (WoDOTA) — Турниры",
            uk: "World of Dota (WoDOTA) — Турніри",
            cs: "World of Dota (WoDOTA) — Turnaje"
        },
        description: {
            en: "Tournaments in World of Dota (WoDOTA) — compete, win, and make history!",
            ru: "Турниры в World of Dota (WoDOTA) — соревнуйтесь, побеждайте и становитесь легендой!",
            uk: "Турніри у World of Dota (WoDOTA) — змагайтеся, перемагайте та ставайте легендою!",
            cs: "Turnaje ve World of Dota (WoDOTA) — soutěžte, vítězte a pište historii!."
        }
    },
    {
        path: "/privacy-policy",
        element: <PrivacyPolicyPage />,
        title: {
            en: "World of Dota (WoDOTA) — Privacy Policy",
            ru: "World of Dota (WoDOTA) — Политика конфиденциальности",
            uk: "World of Dota (WoDOTA) — Політика конфіденційності",
            cs: "World of Dota (WoDOTA) — Zásady ochrany osobních údajů"
        },
        description: {
            en: "Learn how WoDOTA collects, uses, and protects your personal data.",
            ru: "Узнайте, как WoDOTA собирает, использует и защищает ваши персональные данные.",
            uk: "Дізнайтеся, як WoDOTA збирає, використовує та захищає ваші персональні дані.",
            cs: "Zjistěte, jak WoDOTA shromažďuje, používá a chrání vaše osobní údaje."
        }
    },
    {
        path: "/votes",
        element: <VotesPage />,
        title: {
            en: "World of Dota (WoDOTA) — Votes",
            ru: "World of Dota (WoDOTA) — Голосования",
            uk: "World of Dota (WoDOTA) — Голосування",
            cs: "World of Dota (WoDOTA) — Hlasování"
        },
        description: {
            en: "Participate in World of Dota (WoDOTA) votes for new heroes!",
            ru: "Участвуйте в голосованиях World of Dota (WoDOTA) за новых героев!",
            uk: "Беріть участь у голосуваннях World of Dota (WoDOTA) за нових героїв!",
            cs: "Hlasujte ve World of Dota (WoDOTA) pro nové hrdiny!"
        }
    },
    {
        path: "*",
        element: <NotFoundPage />,
        title: {
            en: "World of Dota (WoDOTA) – Page Not Found",
            ru: "World of Dota (WoDOTA) - Страница не найдена",
            uk: "World of Dota (WoDOTA) – Сторінка не знайдена",
            cs: "World of Dota (WoDOTA) – Stránka nenalezena"
        },
        description: {
            en: "The page you are looking for does not exist or has been moved. Return to the WoDOTA homepage.",
            ru: "Страница, которую вы ищете, не существует или была перемещена. Вернитесь на главную страницу WoDOTA.",
            uk: "Сторінка, яку ви шукаєте, не існує або була переміщена. Поверніться на головну сторінку WoDOTA.",
            cs: "Stránka, kterou hledáte, neexistuje nebo byla přesunuta. Vraťte se na hlavní stránku WoDOTA."
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
    const { t } = useTranslation();
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
                                    <meta property="og:description" content={t('og_description')}/>
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