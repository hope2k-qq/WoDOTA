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

const routes = [
    { path: "/", element: <HomePage /> },
    { path: "/leaderboard", element: <LeaderboardPage /> },
    { path: "/heroes", element: <HeroesPage /> },
    { path: "/hero/:name", element: <HeroPage /> },
    { path: "/hero-build/:id", element: <HeroBuildPage /> },
    { path: "/news", element: <NewsPage /> },
    { path: "/tournament", element: <TournamentsPage /> },
    { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
    { path: "/votes", element: <VotesPage /> },
    { path: "*", element: <NotFoundPage /> },
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
                            {routes.map(({ path, element }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    element={
                                        path === "/" ? (
                                            element
                                        ) : (
                                            <PageWrapper>{element}</PageWrapper>
                                        )
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