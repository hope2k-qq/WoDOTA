import React, { useState, useEffect } from 'react';
import styles from './settings.module.scss';
import { useTranslation } from "react-i18next";

export const Settings = ({ isOpen, closeMenu }: { isOpen: boolean, closeMenu: () => void }) => {
    const { i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);  // Инициализируем с текущим языком из i18n
    const [isOpenLanguage, setIsOpenLanguage] = useState(false); // Состояние для открытия/закрытия списка языков

    // Список доступных языков
    const languages = i18n.languages;

    // Функция для изменения выбранного языка
    const handleSelectLanguage = (language: string) => {
        setSelectedLanguage(language); // Обновляем состояние выбранного языка
        i18n.changeLanguage(language); // Меняем язык в i18n
        setIsOpenLanguage(false); // Закрываем список после выбора
    };

    // Функция для переключения открытого состояния списка
    const toggleLanguageList = () => {
        setIsOpenLanguage(!isOpenLanguage);
    };

    // Для обновления языка в случае, если i18n.language изменится
    useEffect(() => {
        setSelectedLanguage(i18n.language); // Если язык изменится, обновляем состояние
    }, [i18n.language]);

    return (
        <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
            <h3 className={styles.title}>НАСТРОЙКИ WoDOTA</h3>
            <div className={styles.menuContent}>
                <div className={styles.off_container}>
                    <div>ОТКЛЮЧЕНИЕ АНИМАЦИЙ</div>
                </div>
                <div className={styles.off_container}>
                    <div className={styles.languageTitle}>ЯЗЫК</div>
                    <div className={styles.languageSelector} onClick={toggleLanguageList}>
                        <div className={styles.selectedLanguage}>
                            {/* Отображаем выбранный язык */}
                            <div onClick={() => console.log(i18n.languages)}>{selectedLanguage}</div>
                        </div>
                        {isOpenLanguage && (
                            <div className={styles.languageList}>
                                {languages.map((language, index) => (
                                    <div
                                        key={index}
                                        className={styles.languageItem}
                                        onClick={() => handleSelectLanguage(language)}
                                    >
                                        {language} {/* Отображаем код языка (например, 'en', 'ru') */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={closeMenu} className={styles.closeBtn}>Закрыть</button>
        </div>
    );
};
