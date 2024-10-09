import styles from "./side_bar.module.scss"
import {SideBarMenuItem} from "./components/sideBarMenuItem/SideBarMenuItem";
import {useLocation, useNavigate} from "react-router-dom";
import { ReactComponent as HomeIcon } from "../../assets/icons/HomeIcon.svg";
import { ReactComponent as ProfileIcon } from "../../assets/icons/ProfileIcon.svg";
import { ReactComponent as LeaderboardIcon } from "../../assets/icons/LeaderboardIcon.svg";
import { ReactComponent as DotaIcon } from "../../assets/icons/DotaIcon.svg";
import { ReactComponent as UpdatesIcon } from "../../assets/icons/UpdatesIcon.svg";
import { ReactComponent as ShopIcon } from "../../assets/icons/ShopIcon.svg";
import { ReactComponent as MoonIcon } from "../../assets/icons/MoonIcon.svg";
import { ReactComponent as SunIcon } from "../../assets/icons/SunIcon.svg";
import {LanguagesComponent} from "../../locales/languagesComponent/LanguagesComponent";
import {useTranslation} from "react-i18next";
import {useThemeStore} from "../../entities/stores/useThemeStore";
import {useState} from "react";

export const SideBar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentThemeIndex, cycleThemes} = useThemeStore();
    const [isDarkTheme, setIsDarkTheme] = useState(currentThemeIndex === 1);
    const location = useLocation();

    const activeIcon = (path: string) => {
        return location.pathname.includes(path);
    }
    const changeTheme = () => {
        setIsDarkTheme(!isDarkTheme);
        cycleThemes();
    };
    return (
        <div className={styles.div}>
            <div className={styles.div_header}>
                <button>Войти</button>
            </div>
            <div className={styles.div_menu}>
                <SideBarMenuItem title={t('home')} icon={<HomeIcon />}
                                 onNavigate={() => navigate('/')} isActive={location.pathname === "/"}/>
                <SideBarMenuItem title={t('profile')} icon={<ProfileIcon />}
                                 onNavigate={() => navigate('/profile')} isActive={activeIcon("/profile")}/>
                <SideBarMenuItem title={t('leaderboard')} icon={<LeaderboardIcon />}
                                 onNavigate={() => navigate('/leaderboard')} isActive={activeIcon("/leaderboard")}/>
                <SideBarMenuItem title={t('heroes_guides')} icon={<DotaIcon />}
                                 onNavigate={() => navigate('/heroes')} isActive={activeIcon("/heroes")}/>
                <SideBarMenuItem title={t('updates')} icon={<UpdatesIcon />}
                                 onNavigate={() => navigate('/updates')} isActive={activeIcon("/updates")}/>
                <SideBarMenuItem title={t('shop')} icon={<ShopIcon />}
                                 onNavigate={() => navigate('/shop')} isActive={activeIcon("/shop")}/>
                <SideBarMenuItem title={t('shop')} icon={<ShopIcon />}
                                 onNavigate={() => navigate('/votes')} isActive={activeIcon("/shop")}/>
            </div>
            <div className={styles.div_footer}>
                {isDarkTheme ?
                    <MoonIcon onClick={changeTheme}/>
                    :
                    <SunIcon onClick={changeTheme}/>}
                <LanguagesComponent/>
            </div>

        </div>
    );
};