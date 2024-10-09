import {Grid} from "@mui/material";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {HomePage} from "../pages/home/HomePage";
import {SideBar} from "../widgets/sideBar/SideBar";
import {ProfilePage} from "../pages/profile/ProfilePage";
import {LeaderboardPage} from "../pages/leaderboard/LeaderboardPage";
import {HeroesPage} from "../pages/heroes/HeroesPage";
import {UpdatesPage} from "../pages/updates/UpdatesPage";
import {ShopPage} from "../pages/shop/ShopPage";
import {VotesPage} from "../pages/votes/VotesPage";
import HeroPage from "../pages/heroes/components/heroPage/HeroPage";

export const Routing = () => {
    return (
        <BrowserRouter>
            <Grid container style={{ width: "100%",maxWidth: "1460px"}}>
                <Grid item xs={3} style={{padding: "1.5rem 1.5rem 0 0"}}>
                    <SideBar />
                </Grid>
                <Grid item xs={9} style={{paddingTop: "1.5rem"}}>
                    <Routes>
                        <Route path="/" element={<HomePage />}/>
                        <Route path="/profile" element={<ProfilePage />}/>
                        <Route path="/leaderboard" element={<LeaderboardPage />}/>
                        <Route path="/heroes" element={<HeroesPage />}/>
                        <Route path="/hero/:name" element={<HeroPage />}/>
                        <Route path="/updates" element={<UpdatesPage />}/>
                        <Route path="/shop" element={<ShopPage />}/>
                        <Route path="/votes" element={<VotesPage />}/>
                    </Routes>
                </Grid>
            </Grid>
        </BrowserRouter>
    );
};