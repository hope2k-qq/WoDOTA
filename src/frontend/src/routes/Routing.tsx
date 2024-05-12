import {Grid} from "@mui/material";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {HomePage} from "../pages/home/HomePage";
import {SideBar} from "../widgets/sideBar/SideBar";
import {ProfilePage} from "../pages/profile/ProfilePage";
import {LeaderboardPage} from "../pages/leaderboard/LeaderboardPage";
import {HeroesPage} from "../pages/heroes/HeroesPage";
import {UpdatesPage} from "../pages/updates/UpdatesPage";
import {ShopPage} from "../pages/shop/ShopPage";

export const Routing = () => {
    return (
        <BrowserRouter>
            <Grid container style={{ width: "100%",maxWidth: "1260px"}}>
                <Grid item xs={3} >
                    <SideBar />
                </Grid>
                <Grid item xs={9}>
                    <Routes>
                        <Route path="/" element={<HomePage />}/>
                        <Route path="/profile" element={<ProfilePage />}/>
                        <Route path="/leaderboard" element={<LeaderboardPage />}/>
                        <Route path="/heroes" element={<HeroesPage />}/>
                        <Route path="/updates" element={<UpdatesPage />}/>
                        <Route path="/shop" element={<ShopPage />}/>
                    </Routes>
                </Grid>
            </Grid>
        </BrowserRouter>
    );
};