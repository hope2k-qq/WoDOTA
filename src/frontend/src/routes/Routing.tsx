import {Grid} from "@mui/material";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {HomePage} from "../pages/home/HomePage";
//import {ProfilePage} from "../pages/profile/ProfilePage";
import {LeaderboardPage} from "../pages/leaderboard/LeaderboardPage";
import {HeroesPage} from "../pages/heroes/HeroesPage";
//import {UpdatesPage} from "../pages/updates/UpdatesPage";
//import {ShopPage} from "../pages/shop/ShopPage";
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
import {DynamicTitle} from "./components/DynamicTitle";

const routes = [
    { path: "/", element: <HomePage />, title: "WoDOTA (World of Dota) – Водота, Ворлд оф Дота, кастомная игра Dota 2" },
    { path: "/leaderboard", element: <LeaderboardPage />, title: "WoDOTA (World of Dota) - Таблица лидеров" },
    { path: "/heroes", element: <HeroesPage />, title: "WoDOTA (World of Dota) - Герои" },
    { path: "/hero/:name", element: <HeroPage />, title: "WoDOTA (World of Dota) - Герой" },
    { path: "/hero-build/:id", element: <HeroBuildPage />, title: "WoDOTA (World of Dota) - Билд на героя" },
    { path: "/news", element: <NewsPage />, title: "WoDOTA (World of Dota) - Новости" },
    { path: "/tournament", element: <TournamentsPage />, title: "WoDOTA (World of Dota) - Турниры" },
    { path: "/privacy-policy", element: <PrivacyPolicyPage />, title: "WoDOTA (World of Dota) - Политика конфиденциальности" },
    { path: "/votes", element: <VotesPage />, title: "WoDOTA (World of Dota) - Голосования" },
    { path: "*", element: <NotFoundPage />, title: "WoDOTA (World of Dota) - Страница не найдена" },

];



export const Routing = () => {
    return (
        <BrowserRouter>
            <TrackPageView />
            <ScrollToTop />
            <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto", position: "relative" }}>
                <TopBar />
                <Grid container style={{ width: "100%" }}>
                    <Grid item xs={12} style={{ minHeight: "120vh" }}>
                        <Routes>
                            {routes.map(({ path, element, title }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    element={
                                        <>
                                            <DynamicTitle title={title} />
                                            {path === "/" ? element : <PageWrapper>{element}</PageWrapper>}
                                        </>
                                    }
                                />
                            ))}
                        </Routes>
                    </Grid>
                    <Grid item xs={12}>
                        <Footer />
                    </Grid>
                </Grid>
            </div>
        </BrowserRouter>
    );
};