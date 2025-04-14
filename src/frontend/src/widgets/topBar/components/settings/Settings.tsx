import React, { useState, useEffect } from 'react';
import styles from './settings.module.scss';
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';

export const Settings = ({ isOpen, closeMenu }: { isOpen: boolean, closeMenu: () => void }) => {
    const { i18n, t } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
    const [isOpenLanguage, setIsOpenLanguage] = useState(false);
    const navigate = useNavigate();

    const languageOptions = [
        { code: 'ru', label: 'RUSSIAN', icon: '/ru.svg' },
        { code: 'en', label: 'ENGLISH', icon: '/en.svg' },
        { code: 'uk', label: 'UKRAINE', icon: '/uk.svg' },
        { code: 'cs', label: 'CZECH REPUBLIC', icon: '/cs.svg' },
    ];


    const handleSelectLanguage = (languageCode: string) => {
        setSelectedLanguage(languageCode);
        i18n.changeLanguage(languageCode);

        const currentPath = window.location.pathname.split('/').slice(2).join('/');

        const newPath = currentPath ? `/${languageCode}/${currentPath}` : `/${languageCode}`;
        setIsOpenLanguage(false);
        navigate(newPath);
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
                    <div className={styles.languageTitle}>{t('language').toUpperCase()}</div>
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
            </div>
        </div>
    );
};
