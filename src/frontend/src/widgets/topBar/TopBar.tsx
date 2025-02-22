import styles from "./top_bar.module.scss";
import { TopBarMenuItem } from "./components/TopBarMenuItem/TopBarMenuItem";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {useEffect, useState} from "react";
import { ReactComponent as MoreIcon } from "../../assets/icons/MoreIcon.svg";
//import { ReactComponent as HeroesIcon } from "../../assets/icons/heroes_icon.svg";
import { ReactComponent as LeaderboardIcon } from "../../assets/icons/leaderboard_icon.svg";
import { ReactComponent as VotesIcon } from "../../assets/icons/votes_icon.svg";
import { ReactComponent as SteamIcon } from "../../assets/icons/steam_icon.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings_icon.svg";

export const TopBar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoSrc, setLogoSrc] = useState("/logo.png");

    useEffect(() => {
        const handleResize = () => {
            setLogoSrc(window.innerWidth <= 1200 ? "/3logo.png" : "/logo1.png");
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const activeIcon = (path: string) => {
        return location.pathname === path || (path === "/heroes" && location.pathname.startsWith("/hero/"));
    };


    const toggleMenu = () => {
        setMenuOpen(prevState => !prevState);
    }

    const handleNavigate = (path: string) => {
        navigate(path);
        setMenuOpen(false);
    };

    return (
        <div>
            {menuOpen ? (
                <div className={styles.topbar_open}>
                    <div className={styles.topbar} style={{backgroundColor: "#12131a", justifyContent: "space-between"}}>
                        <div className={styles.topbar_left} style={{display: 'flex'}} onClick={() => handleNavigate('/heroes')}>
                            <img style={{width: '18rem'}} src={"/logo1.png"} alt="logo"/>
                        </div>
                        <div className={styles.cross} onClick={toggleMenu}>
                            <div className={styles.line}></div>
                            <div className={styles.line}></div>
                        </div>
                    </div>
                    <div className={styles.topbar_menu_open}>
                        <div className={styles.topbar_menu_item_open} onClick={() => handleNavigate('/leaderboard')}>
                            <TopBarMenuItem title={t('leaderboard')}
                                            onNavigate={() => navigate('/leaderboard')} menuOpen={menuOpen}/>
                            <MoreIcon/>
                        </div>
                        {/*<div className={styles.topbar_menu_item_open} onClick={() => handleNavigate('/heroes')}>*/}
                        {/*<TopBarMenuItem title={t('heroes_guides')}*/}
                        {/*                    onNavigate={() => navigate('/heroes')} menuOpen={menuOpen}/>*/}
                        {/*    <MoreIcon/>*/}
                        {/*</div>*/}
                        <div className={styles.topbar_menu_item_open} onClick={() => handleNavigate('/votes')}>
                            <TopBarMenuItem title={t('votes')}
                                            onNavigate={() => navigate('/votes')} menuOpen={menuOpen}/>
                            <MoreIcon/>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.topbar}>
                    <div className={styles.topbar_left} onClick={() => navigate('/heroes')}>
                        <img src={logoSrc} alt="logo"/>
                    </div>
                    <div className={`${styles.topbar_menu}`}>
                        <TopBarMenuItem title={t('leaderboard')}
                                        onNavigate={() => navigate('/leaderboard')}
                                        isActive={activeIcon("/leaderboard")} menuOpen={menuOpen} icon={<LeaderboardIcon />}/>
                        {/*<TopBarMenuItem title={t('heroes_guides')}*/}
                        {/*                onNavigate={() => navigate('/heroes')} isActive={activeIcon("/heroes")}*/}
                        {/*                menuOpen={menuOpen} icon={<HeroesIcon />}/>*/}
                        <TopBarMenuItem title={t('votes')}
                                        onNavigate={() => navigate('/votes')} isActive={activeIcon("/votes")}
                                        menuOpen={menuOpen} icon={<VotesIcon />}/>
                    </div>
                    <div className={styles.hamburger} onClick={toggleMenu}>
                        <div className={styles.line}></div>
                        <div className={styles.line}></div>
                        <div className={styles.line}></div>
                    </div>
                    <div className={styles.topbar_right}>
                        <div>
                            <SteamIcon />
                            <div>ВОЙТИ</div>
                        </div>
                        <div>
                            <SettingsIcon />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
