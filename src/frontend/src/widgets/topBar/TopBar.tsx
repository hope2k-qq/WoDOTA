import styles from "./top_bar.module.scss";
import { TopBarMenuItem } from "./components/TopBarMenuItem/TopBarMenuItem";
import { useLocation, useNavigate } from "react-router-dom";
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
import { ReactComponent as WalletIcon } from "../../assets/icons/WalletIcon.svg";
import { ReactComponent as FireIcon } from "../../assets/icons/FireIcon.svg";
import {useUnreadNews} from "../../context/UnreadNewsContext";
import {Settings} from "./components/settings/Settings";

export const TopBar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoSrc, setLogoSrc] = useState("/logo.png");
    const { unreadNewsCount, setUnreadNewsCount } = useUnreadNews();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const currentLang = location.pathname.split('/')[1];

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

    useEffect(() => {
        const storedUnreadNewsCount = localStorage.getItem('unreadNewsCount');
        if (storedUnreadNewsCount) {
            setUnreadNewsCount(Number(storedUnreadNewsCount));
        }
    }, [setUnreadNewsCount]);


    useEffect(() => {
        const handleResize = () => {
            setLogoSrc(window.innerWidth <= 1200 ? "/3logo.png" : "/logo1.png");
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);


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

    const handleNavigate = (path: string) => {
        const normalizedPath = path === '/' ? '' : path;
        navigate(`/${currentLang}${normalizedPath}`);
        setMenuOpen(false);
    };

    return (
        <div>
            {menuOpen ? (
                <div className={styles.topbar_open}>
                    <div className={styles.topbar} style={{backgroundColor: "#12131a", justifyContent: "space-between"}}>
                        <div className={styles.topbar_left} style={{display: 'flex'}} onClick={() => handleNavigate('/')}>
                            <img style={{width: '18rem'}} src={"/logo1.png"} alt="logo"/>
                        </div>
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
                                    <MoreIcon/>
                                </div>
                                <div className={styles.topbar_menu_item_open_sub_c_bottom}
                                     style={{borderBottom: '1px solid rgba(128, 128, 128, 0.5)'}}>
                                    <div className={styles.topbar_menu_item_open_sub_bottom}>
                                        <TopBarMenuItem title={t('tournament')}
                                                        onNavigate={() => handleNavigate('/tournament')}
                                                        menuOpen={menuOpen}/>
                                        <MoreIcon/>
                                    </div>
                                    <div className={styles.topbar_menu_item_open_sub_bottom}>
                                        <TopBarMenuItem title={t('votes')}
                                                        onNavigate={() => handleNavigate('/votes')}
                                                        menuOpen={menuOpen}/>
                                        <MoreIcon/>
                                    </div>
                                    <div className={styles.topbar_menu_item_open_sub_bottom}>
                                        <TopBarMenuItem title={t('leaderboard')}
                                                        onNavigate={() => handleNavigate('/leaderboard')}
                                                        menuOpen={menuOpen}/>
                                        <MoreIcon/>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.topbar_menu_item_open} onClick={() => handleNavigate('/heroes')}>
                                <TopBarMenuItem title={t('heroes').toUpperCase()}
                                                onNavigate={() => handleNavigate('/heroes')} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </div>
                            <div className={styles.topbar_menu_item_open}
                                 onClick={() => handleNavigate('/creators/videos')}>
                                <TopBarMenuItem title={t('wodota_content')}
                                                onNavigate={() => handleNavigate('/creators/videos')} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </div>
                            <div className={styles.topbar_menu_item_open} onClick={() => window.open('https://store.worldofdota.net/ru-RU', '_blank')}>
                                <TopBarMenuItem title={t('donate')}
                                                onNavigate={() => window.open('https://store.worldofdota.net/ru-RU', '_blank')} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </div>
                            <div className={styles.topbar_menu_item_open} onClick={() => handleNavigate('/news')}>
                                <TopBarMenuItem title={t('news')}
                                                onNavigate={() => handleNavigate('/news')} menuOpen={menuOpen}/>
                                <MoreIcon/>
                            </div>
                        </div>
                        <div className={styles.menu_item_open_bottom}>
                            <div className={styles.menu_item_steam_container}>
                                <div className={styles.container_steam}>
                                    <SteamIcon/>
                                    <div>{t('login')}</div>
                                </div>
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
                    <div className={styles.topbar_left} onClick={() => handleNavigate('/')}>
                        <img src={logoSrc} alt="logo"/>
                        <span className={styles.logo_language}>{langLabel}</span>
                    </div>
                    <div className={`${styles.topbar_menu}`}>
                        <TopBarMenuItem title={t('game')}
                                        menuOpen={menuOpen} icon={<FireIcon/>}
                                        subItems={[
                                            {
                                                title: t('tournament'),
                                                icon: <TournamentIcon />, onNavigate: () => handleNavigate('/tournament') },
                                            { title: t('votes'), icon: <VotesIcon />, onNavigate: () => handleNavigate('/votes') },
                                            { title: t('leaderboard'), icon: <LeaderboardIcon />, onNavigate: () => handleNavigate('/leaderboard') },
                                        ]}/>
                        <TopBarMenuItem title={t('heroes').toUpperCase()}
                                        onNavigate={() => handleNavigate('/heroes')} isActive={activeIcon("/heroes")}
                                        menuOpen={menuOpen} icon={<HeroesIcon/>}/>
                        <TopBarMenuItem title={t('wodota_content')}
                                        onNavigate={() => handleNavigate('/creators/videos')}
                                        isActive={activeIcon("/creators/videos")} menuOpen={menuOpen}
                                        icon={<YouTubeIcon/>}/>
                        <TopBarMenuItem title={t('donate')}
                                        onNavigate={() => window.open('https://store.worldofdota.net/ru-RU', '_blank')}
                                        menuOpen={menuOpen} icon={<WalletIcon/>}/>
                    </div>
                    <div className={styles.hamburger} onClick={toggleMenu}>
                        <div className={styles.line}></div>
                        <div className={styles.line}></div>
                        <div className={styles.line}></div>
                    </div>
                    <div className={styles.topbar_right}>
                        <div className={styles.news_container} onClick={() => navigate('/news')}>
                            <NewsIcon className={styles.news_icon}/>
                            {unreadNewsCount > 0 && (
                                <div className={styles.news_badge}>{unreadNewsCount}</div>
                            )}
                        </div>
                        <div className={styles.container_steam}>
                            <SteamIcon/>
                            <div>{t('login')}</div>
                        </div>
                        <div className={styles.container_settings} onClick={toggleSettingsMenu}>
                            <SettingsIcon />
                        </div>
                    </div>
                </div>
            )}
            {isSettingsOpen && <div className={styles.overlay}></div>}
            <Settings isOpen={isSettingsOpen} closeMenu={closeSettingsMenu} />
        </div>
    );
};
