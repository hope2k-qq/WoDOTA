import React, { useEffect, useState } from 'react';
import { TournamentListSolo } from "./components/tournamentList/TournamentListSolo";
import styles from './tournaments_solo.module.scss';
import {TournamentQualifiersSolo} from "./components/tournamentQualifiers/TournamentQualifiersSolo";
import {useTranslation} from "react-i18next";
//import {TournamentQualifiers} from "./components/tournamentQualifiers/TournamentQualifiers";

export const TournamentsPageSolo: React.FC = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<string>('players');
    const [data, setData] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const loadData = async (section: string) => {
            if (data[section]) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_URL}/tournament_solo/${section}`);
                console.log(response)
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке данных');
                }
                const result = await response.json();
                console.log(result)
                setData(prevData => ({
                    ...prevData,
                    [section]: result
                }));
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Произошла неизвестная ошибка");
                }
            } finally {
                setLoading(false);
            }
        };

        loadData(activeSection);
    }, [API_URL, activeSection, data]);

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
    };

    return (
        <div className={styles.div}>
            <div className={styles.container}>
                <div className={styles.tournament_name}>RANDOM HERO CUP</div>
                <div className={styles.tournament_data_container}>
                    <div className={styles.tournament_data}>{t('event_dates_solo')}</div>
                    <div className={styles.tournament_data}>{t('registration_solo')}</div>
                    <div className={styles.tournament_data}>{t('prize_pool_solo')}</div>
                </div>
                <div className={styles.container_buttons_navigations}>
                    <button
                        className={`${styles.button} ${activeSection === 'players' ? styles.active : ''}`}
                        onClick={() => handleSectionChange('players')}
                    >
                        {t('all_players')}
                    </button>
                    <button
                        className={`${styles.button} ${activeSection === 'qualifiers' ? styles.active : ''}`}
                        onClick={() => handleSectionChange('qualifiers')}
                    >
                        {t('qualifying_stage')}
                    </button>
                    <button
                        className={`${styles.button} ${activeSection === 'playoffs' ? styles.active : ''}`}
                        onClick={() => handleSectionChange('playoffs')}
                    >
                        {t('playoff')}
                    </button>
                    <button
                        className={`${styles.button} ${activeSection === 'final' ? styles.active : ''}`}
                        onClick={() => handleSectionChange('final')}
                        disabled
                    >
                        {t('final')}
                    </button>
                </div>

                {loading && <p></p>}
                {error && <p>Ошибка: {error}</p>}

                <div className={styles.sectionContent}>
                    {activeSection === 'players' && data['players'] &&
                        <TournamentListSolo data={data['players'].players || []}/>}
                    {activeSection === 'qualifiers' && data['qualifiers'] &&
                        <TournamentQualifiersSolo count={49} data={data['qualifiers'] || []}/>}
                    {activeSection === 'playoffs' && data['playoffs'] &&
                        <TournamentQualifiersSolo count={7} data={data['playoffs'] || []}/>}
                    {activeSection === 'final' && data['final'] && <TournamentQualifiersSolo count={1} data={data['final'] || []}/>}
                </div>
            </div>
        </div>
    );
};
