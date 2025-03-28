import {Grid} from "@mui/material";
import {BrowserRouter, Route, Routes} from "react-router-dom";
//import {HomePage} from "../pages/home/HomePage";
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

export const Routing = () => {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
                <TopBar />
                <Grid container style={{ width: "100%" }}>
                    <Grid item xs={12} style={{ minHeight: "120vh" }}>
                        <Routes>
                            <Route path="/" element={<HeroesPage />} />
                            {/*<Route path="/profile" element={<ProfilePage />} />*/}
                            <Route path="/leaderboard" element={<LeaderboardPage />} />
                            <Route path="/heroes" element={<HeroesPage />} />
                            <Route path="/hero/:name" element={<HeroPage />} />
                            <Route path="/hero-build/:id" element={<HeroBuildPage />} />
                            <Route path="/news" element={<NewsPage />} />
                            <Route path="/tournament" element={<TournamentsPage />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                            {/*<Route path="/updates" element={<UpdatesPage />} />*/}
                            {/*<Route path="/shop" element={<ShopPage />} />*/}
                            <Route path="/votes" element={<VotesPage />} />
                            <Route path="*" element={<NotFoundPage />} />
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