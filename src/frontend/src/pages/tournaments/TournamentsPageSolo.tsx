import React, {useCallback, useEffect, useState} from 'react';
import { TournamentListSolo } from "./components/tournamentList/TournamentListSolo";
import styles from './tournaments_solo.module.scss';
import {TournamentQualifiersSolo} from "./components/tournamentQualifiers/TournamentQualifiersSolo";
import {useTranslation} from "react-i18next";
import {TournamentList} from "./components/tournamentList/TournamentList";

export const TournamentsPageSolo: React.FC = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<string>('final');
    const [tournament, setTournament] = useState<any | null>(null);
    const [tournamentsList, setTournamentsList] = useState<any[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;

    const fetchTournamentData = useCallback(
        async (tournamentId?: number, apiPath?: string) => {
            if (!API_URL) return;
            setLoading(true);
            setError(null);

            try {
                const url =
                    tournamentId && apiPath
                        ? `${API_URL}/tournament${apiPath}`
                        : `${API_URL}/tournament/latest`;

                const response = await fetch(url);
                if (!response.ok)
                    throw new Error("Ошибка при загрузке турнира");

                const result = await response.json();
                setTournament(result);
                setActiveSection("final");
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Произошла неизвестная ошибка"
                );
            } finally {
                setLoading(false);
            }
        },
        [API_URL]
    );


    useEffect(() => {
        const loadData = async () => {
            if (!API_URL) return;
            try {
                const res = await fetch(`${API_URL}/tournaments`);
                if (!res.ok) throw new Error("Ошибка загрузки списка турниров");
                const list = await res.json();
                setTournamentsList(list);

                if (list.length > 0) {
                    const initialTournament = list[0];
                    setSelectedTournamentId(initialTournament.id);
                    await fetchTournamentData(initialTournament.id, initialTournament.apiPath);
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadData();
    }, [API_URL]);

    useEffect(() => {
        if (!selectedTournamentId) return;

        const selected = tournamentsList.find(
            (t) => t.id === selectedTournamentId
        );

        if (!selected) return;

        fetchTournamentData(selected.id, selected.apiPath);
    }, [selectedTournamentId, tournamentsList, fetchTournamentData]);


    const handleSectionChange = (section: string) => setActiveSection(section);

    const renderSectionContent = () => {
        if (!tournament) return null;
        const { type, data } = tournament;

        if (!data) return null;

        const sectionDataMap: Record<string, any> = {
            players: type === 'solo' ? data.list?.players : data.list?.teams,
            qualifiers: data.qualifiers,
            playoffs: data.playoffs,
            final: data.final,
        };

        const countsMap: Record<string, number> = {
            qualifiers: 49,
            playoffs: 7,
            final: 1,
        };

        if (activeSection === 'players' && sectionDataMap.players) {
            return type === 'solo'
                ? <TournamentListSolo data={sectionDataMap.players} />
                : <TournamentList data={sectionDataMap.players} />;
        }

        if (['qualifiers', 'playoffs', 'final'].includes(activeSection) && sectionDataMap[activeSection]) {
            return <TournamentQualifiersSolo
                type={type}
                count={countsMap[activeSection]}
                data={sectionDataMap[activeSection]}
            />;
        }

        return null;
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p>Ошибка: {error}</p>;
    if (!tournament) return null;

    return (
        <div className={styles.div}>
            <div className={styles.container}>
                <div>
                    <select
                        value={selectedTournamentId ?? ""}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedTournamentId(value ? Number(value) : null);
                        }}
                    >
                        {tournamentsList.map((tournamentItem, index) => (
                            <option key={tournamentItem.id} value={tournamentItem.id}>
                                {t(`${tournamentItem.key}_name`) || tournamentItem.key}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.tournament_name}>{t(`${tournament.key}_name`) || "Tournament"}</div>
                <div className={styles.tournament_data_container}>
                    <div className={styles.tournament_data}>{t(`${tournament.key}_event_dates`)}</div>
                    <div className={styles.tournament_data}>{t(`${tournament.key}_registration`)}</div>
                    <div className={styles.tournament_data}>{t(`${tournament.key}_prize_pool`)}</div>
                </div>
                <div className={styles.container_buttons_navigations}>
                    {['players', 'qualifiers', 'playoffs', 'final'].map(section => (
                        <button
                            key={section}
                            className={`${styles.button} ${activeSection === section ? styles.active : ''}`}
                            onClick={() => handleSectionChange(section)}
                        >
                            {t(section === 'players' ? 'all_players' : section)}
                        </button>
                    ))}
                </div>

                <div className={styles.sectionContent}>
                    {renderSectionContent()}
                </div>
            </div>
        </div>
    );
};
