import React, { useState, useEffect } from 'react';
import styles from './settings.module.scss';
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import {useUser} from "../../../../context/UserContext";
import { ReactComponent as QuitIcon } from "../../../../assets/icons/QuitIcon.svg";
import { ReactComponent as HitIcon } from "../../../../assets/icons/HitIcon.svg";

export const Settings = ({ isOpen, closeMenu }: { isOpen: boolean, closeMenu: () => void }) => {
    const { i18n, t } = useTranslation();
    const { setUser, setShowNumbers, setShowText } = useUser();
    const { user } = useUser();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
    const [isOpenLanguage, setIsOpenLanguage] = useState(false);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    const languageOptions = [
        { code: 'ru', label: 'RUSSIAN', icon: '/ru.svg' },
        { code: 'en', label: 'ENGLISH', icon: '/en.svg' },
        { code: 'uk', label: 'UKRAINE', icon: '/uk.svg' },
        { code: 'cs', label: 'CZECH REPUBLIC', icon: '/cs.svg' },
    ];


    const handleSelectLanguage = (languageCode: string) => {
        setSelectedLanguage(languageCode);
        i18n.changeLanguage(languageCode);

        fetch(`${API_URL}/account/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ language: languageCode })
        }).then(res => {
            if (!res.ok) {
                console.error('Ошибка при обновлении языка на сервере');
            }
        }).catch(err => {
            console.error('Ошибка сети при отправке языка:', err);
        });

        const currentPath = window.location.pathname.split('/').slice(2).join('/');
        const newPath = currentPath ? `/${languageCode}/${currentPath}` : `/${languageCode}`;
        setIsOpenLanguage(false);
        navigate(newPath);
    };

    const handleLogout = async () => {

        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            setUser(null);
            setShowNumbers(true);
            setShowText(true);

        } catch (error) {
            console.error('Ошибка сети при выходе:', error);
        }
    };



    const toggleLanguageList = () => {
        setIsOpenLanguage(prev => !prev);
    };

    useEffect(() => {
        setSelectedLanguage(i18n.language);
    }, [i18n.language]);

    return (
        <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
            <div className={styles.close_container} onClick={closeMenu}>
                <img src={"/close.svg"} alt={"close"}/>
            </div>
            <h3 className={styles.title}>{t('settings').toUpperCase()} WoDOTA</h3>
            <div className={styles.menuContent}>
                <div className={styles.off_container}>
                    <div className={styles.languageTitle}>
                        {t('language').toUpperCase()}
                        <div className={styles.translationNotice}>
                            <HitIcon className={styles.translationNoticeIcon}/>
                            <div className={styles.translationTooltip}>
                                <span className={styles.translationTooltipTitle}>{t('translation_notice_title')}</span>
                                <span className={styles.translationTooltipText}>
                                    {t('translation_notice_text')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.languageSelector} onClick={toggleLanguageList}>
                        <div className={styles.selectedLanguage}>
                            <div className={styles.languageItemContainer}>
                                <img
                                    src={languageOptions.find(lang => lang.code === selectedLanguage)?.icon}
                                    alt={selectedLanguage}
                                />
                                <div className={styles.languageItem}>
                                    {languageOptions.find(lang => lang.code === selectedLanguage)?.label}
                                </div>
                            </div>

                        </div>
                        {isOpenLanguage && (
                            <div className={styles.languageList}>
                                {languageOptions.map(({code, label, icon}) => (
                                    <div className={styles.languageItemContainer}
                                         key={code}
                                         onClick={() => {
                                             handleSelectLanguage(code);
                                             toggleLanguageList();
                                         }}>
                                        <img src={icon} alt={label}/>
                                        <div
                                            className={styles.languageItem}
                                        >
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {user && (
                    <div className={styles.off_container}>
                        <div className={styles.languageTitle}>{t('steam_account')}</div>
                        <div className={styles.userContainer}>
                            <div className={styles.userInfoWrapper}>
                                <div className={styles.userInfo}>
                                    <img src={user.avatar} alt={user.name} className={styles.avatar}/>
                                    <span className={styles.userName}>{user.name}</span>
                                </div>
                                <div className={styles.closeIconWrapper} onClick={handleLogout}>
                                    <QuitIcon className={styles.closeIcon}/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
