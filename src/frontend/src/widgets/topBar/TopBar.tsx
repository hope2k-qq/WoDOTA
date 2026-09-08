import styles from "./top_bar.module.scss";
import { TopBarMenuItem } from "./components/TopBarMenuItem/TopBarMenuItem";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import React, {useEffect, useState} from "react";
import { ReactComponent as MoreIcon } from "../../assets/icons/MoreIcon.svg";
import { ReactComponent as HeroesIcon } from "../../assets/icons/heroes_icon.svg";
import { ReactComponent as LeaderboardIcon } from "../../assets/icons/leaderboard_icon.svg";
import { ReactComponent as VotesIcon } from "../../assets/icons/votes_icon.svg";
import { ReactComponent as SteamIcon } from "../../assets/icons/steam_icon.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings_icon.svg";
import { ReactComponent as NewsIcon } from "../../assets/icons/NewsIcon.svg";
import { ReactComponent as TournamentIcon } from "../../assets/icons/TournamentIcon.svg";
import { ReactComponent as YouTubeIcon } from "../../assets/icons/YouTubeIcon.svg";
//import { ReactComponent as WalletIcon } from "../../assets/icons/WalletIcon.svg";
import { ReactComponent as FireIcon } from "../../assets/icons/FireIcon.svg";
import {useUnreadNews} from "../../context/UnreadNewsContext";
import {Settings} from "./components/settings/Settings";
import {useUser} from "../../context/UserContext";

export const TopBar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoSrc, setLogoSrc] = useState(
        typeof window !== "undefined" && window.innerWidth <= 1200 ? "/3logo.png" : "/logo1.png"
    );
    const { unreadNewsCount } = useUnreadNews();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const currentLang = location.pathname.split('/')[1];
    const { user, loading } = useUser();
    const API_URL = process.env.REACT_APP_API_URL;


    useEffect(() => {
        ["/3logo.png", "/logo1.png"].forEach((src) => {
            const img = new Image();
            img.src = src;
        });

        const handleResize = () => {
            setLogoSrc(window.innerWidth <= 1200 ? "/3logo.png" : "/logo1.png");
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);
    if (loading) return null;
    const loginUrl = `${API_URL}/auth/steam`;



    const langDisplayMap: { [key: string]: string } = {
        cs: 'CZ',
        en: 'EN',
        uk: 'UA',
        ru: 'RU'
    };
    const langLabel = langDisplayMap[currentLang] || currentLang.toUpperCase();
    const toggleSettingsMenu = () => {
        setIsSettingsOpen(!isSettingsOpen);
    };

    const closeSettingsMenu = () => {
        setIsSettingsOpen(false);
    };



    const activeIcon = (path: string) => {
        if (!path) return true;

        const { pathname } = location;

        const pathParts = pathname.split('/');
        const langPrefix = pathParts.length > 1 ? `/${pathParts[1]}` : '';

        const isExactMatch = pathname === `${langPrefix}${path}`;

        const isHeroesSection = path === "/heroes" && (
            pathname.startsWith(`${langPrefix}/hero/`) ||
            pathname.startsWith(`${langPrefix}/hero-build/`)
        );

        return isExactMatch || isHeroesSection;
    };





    const toggleMenu = () => {
        setMenuOpen(prevState => !prevState);
    }

    const buildPath = (path: string) => {
        const normalizedPath = path === '/' ? '' : path;
        return `/${currentLang}${normalizedPath}`;
    };

    return (
        <div>
            {menuOpen ? (
                <div className={styles.topbar_open}>
                    <div className={styles.topbar} style={{backgroundColor: "#12131a", justifyContent: "space-between"}}>
                        <Link className={styles.topbar_left} style={{display: 'flex'}} to={buildPath('/')} onClick={() => setMenuOpen(false)}>
                            <img style={{width: '18rem'}} src={"/logo1.png"} alt="logo"/>
                        </Link>
                        <div className={styles.cross} onClick={toggleMenu}>
                            <div className={styles.line}></div>
                            <div className={styles.line}></div>
                        </div>
                    </div>
                    <div className={styles.topbar_menu_open}>
                        <div className={styles.menu_item_open_top}>
                            <div className={styles.topbar_menu_item_open_sub_c}>
                                <div className={styles.topbar_menu_item_open_sub_top}>
                                    <TopBarMenuItem title={t('game')} menuOpen={menuOpen}/>
                                </div>
                                <div className={styles.topbar_menu_item_open_sub_c_bottom}
                                     style={{borderBottom: '1px solid rgba(128, 128, 128, 0.5)'}}>
                                    <Link className={styles.topbar_menu_item_open_sub_bottom}
                                          to={buildPath('/tournament')} onClick={() => setMenuOpen(false)}>
                                        <TopBarMenuItem title={t('tournament')} menuOpen={menuOpen}/>
                                        <MoreIcon/>
                                    </Link>
                                    <Link className={styles.topbar_menu_item_open_sub_bottom}
                                          to={buildPath('/votes')} onClick={() => setMenuOpen(false)}>
                                        <TopBarMenuItem title={t('votes')} menuOpen={menuOpen}/>
                                        <MoreIcon/>
                                    </Link>
                                    <Link className={styles.topbar_menu_item_open_sub_bottom}
                                          to={buildPath('/leaderboard')} onClick={() => setMenuOpen(false)}>
                                        <TopBarMenuItem title={t('leaderboard')} menuOpen={menuOpen}/>
                                        <MoreIcon/>
                                    </Link>
                                </div>
                            </div>
                            <Link className={styles.topbar_menu_item_open} to={buildPath('/heroes')}
                                  onClick={() => setMenuOpen(false)}>
                                <TopBarMenuItem title={t('heroes').toUpperCase()} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </Link>
                            <Link className={styles.topbar_menu_item_open} to={buildPath('/creators/videos')}
                                  onClick={() => setMenuOpen(false)}>
                                <TopBarMenuItem title={t('wodota_content')} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </Link>
                            <Link className={styles.topbar_menu_item_open} to={buildPath('/news')}
                                  onClick={() => setMenuOpen(false)}>
                                <TopBarMenuItem title={t('news')} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </Link>
                        </div>
                        <div className={styles.menu_item_open_bottom}>
                            <div className={styles.menu_item_steam_container}>
                                {!user ? (
                                    <a href={loginUrl} className={styles.container_steam}>
                                        <SteamIcon />
                                        <div>{t('login')}</div>
                                    </a>
                                ) : (
                                    <div className={styles.container_user}>
                                        <img src={user.avatar} alt={user.name} className={styles.avatar} />
                                        <span className={styles.name}>{user.name}</span>
                                    </div>
                                )}
                                <div className={styles.container_settings} onClick={toggleSettingsMenu}>
                                    <SettingsIcon/>
                                </div>
                            </div>
                            <a
                                href="https://steamcommunity.com/sharedfiles/filedetails/?id=2880603428"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.cta_button}
                            >
                                <SteamIcon className={styles.icon}/>
                                <div className={styles.text_container}>
                                    <span className={styles.main_text}>{t('play_for_free')}</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.topbar}>
                    <Link className={styles.topbar_left} to={buildPath('/')}>
                        <img src={logoSrc} alt="logo"/>
                        <span className={styles.logo_language}>{langLabel}</span>
                    </Link>
                    <div className={`${styles.topbar_menu}`}>
                        <TopBarMenuItem title={t('game')}
                                        menuOpen={menuOpen} icon={<FireIcon/>}
                                        isActive={activeIcon("/tournament") || activeIcon("/votes") || activeIcon("/leaderboard")}
                                        subItems={[
                                            {
                                                title: t('tournament'),
                                                icon: <TournamentIcon />, to: buildPath('/tournament') },
                                            { title: t('votes'), icon: <VotesIcon />, to: buildPath('/votes') },
                                            { title: t('leaderboard'), icon: <LeaderboardIcon />, to: buildPath('/leaderboard') },
                                        ]}/>
                        <TopBarMenuItem title={t('heroes').toUpperCase()}
                                        to={buildPath('/heroes')} isActive={activeIcon("/heroes")}
                                        menuOpen={menuOpen} icon={<HeroesIcon/>}/>
                        <TopBarMenuItem title={t('wodota_content')}
                                        to={buildPath('/creators/videos')}
                                        isActive={activeIcon("/creators/videos")} menuOpen={menuOpen}
                                        icon={<YouTubeIcon/>}/>
                    </div>
                    <div className={styles.hamburger} onClick={toggleMenu}>
                        <div className={styles.line}></div>
                        <div className={styles.line}></div>
                        <div className={styles.line}></div>
                    </div>
                    <div className={styles.topbar_right}>
                        <Link className={styles.news_container} to={buildPath('/news')}>
                            <NewsIcon className={styles.news_icon}/>
                            {unreadNewsCount > 0 && (
                                <div className={styles.news_badge}>{unreadNewsCount}</div>
                            )}
                        </Link>
                        {!user ? (
                            <a href={loginUrl} className={styles.container_steam}>
                                <SteamIcon />
                                <div>{t('login')}</div>
                            </a>
                        ) : (
                            <div className={styles.container_user}>
                                <img src={user.avatar} alt={user.name} className={styles.avatar}/>
                                <span className={styles.name}>{user.name}</span>
                            </div>
                        )}
                        <div className={styles.container_settings} onClick={toggleSettingsMenu}>
                            <SettingsIcon/>
                        </div>
                    </div>
                </div>
            )}
            {isSettingsOpen && <div className={styles.overlay}></div>}
            <Settings isOpen={isSettingsOpen} closeMenu={closeSettingsMenu} />
        </div>
    );
};
