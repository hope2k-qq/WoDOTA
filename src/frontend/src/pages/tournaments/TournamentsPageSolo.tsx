import React, { useEffect, useState } from 'react';
import { TournamentListSolo } from "./components/tournamentList/TournamentListSolo";
import styles from './tournaments_solo.module.scss';
import {TournamentQualifiersSolo} from "./components/tournamentQualifiers/TournamentQualifiersSolo";
import {useTranslation} from "react-i18next";
import {TournamentQualifiers} from "./components/tournamentQualifiers/TournamentQualifiers";
import {TournamentList} from "./components/tournamentList/TournamentList";

export const TournamentsPageSolo: React.FC = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<string>('final');
    const [tournament, setTournament] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const loadLatestTournament = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_URL}/tournament/latest`);
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке турнира');
                }
                const result = await response.json();
                setTournament(result);
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

        loadLatestTournament();
    }, [API_URL]);

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error}</p>;
    if (!tournament) return null;

    return (
        <div className={styles.div}>
            <div className={styles.container}>
                <div className={styles.tournament_name}>{t(`${tournament.key}_name`) || "Tournament"}</div>
                <div className={styles.tournament_data_container}>
                    <div className={styles.tournament_data}>{t(`${tournament.key}_event_dates`)}</div>
                    <div className={styles.tournament_data}>{t(`${tournament.key}_registration`)}</div>
                    <div className={styles.tournament_data}>{t(`${tournament.key}_prize_pool`)}</div>
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
                    >
                        {t('final')}
                    </button>
                </div>

                <div className={styles.sectionContent}>
                    {tournament && tournament.type === 'solo' && (
                        <>
                            {activeSection === 'players' && tournament.data?.list && (
                                <TournamentListSolo data={tournament.data.list.players || []}/>
                            )}
                            {activeSection === 'qualifiers' && tournament.data?.qualifiers && (
                                <TournamentQualifiersSolo count={49} type={tournament.type}
                                                          data={tournament.data.qualifiers || []} />
                            )}
                            {activeSection === 'playoffs' && tournament.data?.playoffs && (
                                <TournamentQualifiersSolo count={7} type={tournament.type}
                                                          data={tournament.data.playoffs || []} />
                            )}
                            {activeSection === 'final' && tournament.data?.final && (
                                <TournamentQualifiersSolo count={1} type={tournament.type}
                                                          data={tournament.data.final || []} />
                            )}
                        </>
                    )}

                    {tournament && tournament.type === 'team' && (
                        <>
                            {activeSection === 'players' && tournament.data?.list && (
                                <TournamentList data={tournament.data.list.teams || []} />
                            )}
                            {activeSection === 'qualifiers' && tournament.data?.qualifiers && (
                                <TournamentQualifiersSolo count={49} type={tournament.type}
                                                          data={tournament.data.qualifiers || []} />
                            )}
                            {activeSection === 'playoffs' && tournament.data?.playoffs && (
                                <TournamentQualifiersSolo count={7} type={tournament.type}
                                                          data={tournament.data.playoffs || []} />
                            )}
                            {activeSection === 'final' && tournament.data?.final && (
                                <TournamentQualifiersSolo count={1} type={tournament.type}
                                                          data={tournament.data.final || []} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
