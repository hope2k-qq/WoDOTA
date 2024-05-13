import styles from "./side_bar.module.scss"
import {SideBarMenuItem} from "./components/sideBarMenuItem/SideBarMenuItem";
import {useNavigate} from "react-router-dom";
import { ReactComponent as HomeIcon } from "../../assets/images/icons/HomeIcon.svg";
import { ReactComponent as ProfileIcon } from "../../assets/images/icons/ProfileIcon.svg";
import { ReactComponent as LeaderboardIcon } from "../../assets/images/icons/LeaderboardIcon.svg";
import { ReactComponent as DotaIcon } from "../../assets/images/icons/DotaIcon.svg";
import { ReactComponent as UpdatesIcon } from "../../assets/images/icons/UpdatesIcon.svg";
import { ReactComponent as ShopIcon } from "../../assets/images/icons/ShopIcon.svg";
import {LanguagesComponent} from "../../locales/languagesComponent/LanguagesComponent";
import {useTranslation} from "react-i18next";
import {useThemeStore} from "../../entities/stores/useThemeStore";

export const SideBar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { cycleThemes } = useThemeStore();

    return (
        <div className={styles.div}>
            <button>Войти</button>
            <div className={styles.div_menu}>
                <SideBarMenuItem title={t('home')} icon={<HomeIcon />}
                                 onNavigate={() => navigate('/')} />
                <SideBarMenuItem title={t('profile')} icon={<ProfileIcon />}
                                 onNavigate={() => navigate('/profile')} />
                <SideBarMenuItem title={t('leaderboard')} icon={<LeaderboardIcon />}
                                 onNavigate={() => navigate('/leaderboard')} />
                <SideBarMenuItem title={t('heroes_guides')} icon={<DotaIcon />}
                                 onNavigate={() => navigate('/heroes')} />
                <SideBarMenuItem title={t('updates')} icon={<UpdatesIcon />}
                                 onNavigate={() => navigate('/updates')} />
                <SideBarMenuItem title={t('shop')} icon={<ShopIcon />}
                                 onNavigate={() => navigate('/shop')} />
            </div>
            <LanguagesComponent />
            <button onClick={cycleThemes}>next</button>
        </div>
    );
};