import React, { useEffect, useState } from 'react';
import { TournamentList } from "./components/tournamentList/TournamentList";
import styles from './tournaments.module.scss';
import {TournamentQualifiers} from "./components/tournamentQualifiers/TournamentQualifiers"; // Стили для кнопок

export const TournamentsPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('playoffs'); // Стейт для выбранного раздела
    const [data, setData] = useState<{ [key: string]: any }>({}); // Стейт для хранения данных каждого раздела
    const [loading, setLoading] = useState<boolean>(false); // Стейт для отслеживания загрузки данных
    const [error, setError] = useState<string | null>(null); // Стейт для отслеживания ошибок
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const loadData = async (section: string) => {
            if (data[section]) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_URL}/tournament/${section}`);
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
            <div className={styles.tournament_name}>WOD BEST DUO CUP</div>
            <div className={styles.tournament_data_container}>
                <div className={styles.tournament_data}>Даты проведения: 21-23 Марта 2025.</div>
                <div className={styles.tournament_data}>Регистрация открыта до 20 Марта 2025.</div>
                <div className={styles.tournament_data}>Призовой фонд: 20000 RUB + 124000 Монет + 2 Новых Эксклюзивных
                    Эффекта.
                </div>
            </div>
            <div className={styles.container_buttons_navigations}>
                <button
                    className={`${styles.button} ${activeSection === 'players' ? styles.active : ''}`}
                    onClick={() => handleSectionChange('players')}
                >
                    Все игроки
                </button>
                <button
                    className={`${styles.button} ${activeSection === 'qualifiers' ? styles.active : ''}`}
                    onClick={() => handleSectionChange('qualifiers')}
                >
                    Отборочный этап
                </button>
                <button
                    className={`${styles.button} ${activeSection === 'playoffs' ? styles.active : ''}`}
                    onClick={() => handleSectionChange('playoffs')}
                >
                    Плей-офф
                </button>
                <button
                    className={`${styles.button} ${activeSection === 'final' ? styles.active : ''}`}
                    style={{cursor: "not-allowed"}}
                    // onClick={() => handleSectionChange('final')}
                >
                    Финал
                </button>
            </div>

            {loading && <p>Загрузка...</p>}
            {error && <p>Ошибка: {error}</p>}

            <div className={styles.sectionContent}>
                {activeSection === 'players' && data['players'] && <TournamentList data={data['players'].teams || []}/>}
                {activeSection === 'qualifiers' && data['qualifiers'] &&
                    <TournamentQualifiers data={data['qualifiers'] || []}/>}
                {activeSection === 'playoffs' && data['playoffs'] &&  <TournamentQualifiers data={data['playoffs'] || []}/>}
                {activeSection === 'final' && data['final'] && <div>{JSON.stringify(data['final'])}</div>}
            </div>
        </div>
    );
};
