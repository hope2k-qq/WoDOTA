import React, { useState } from 'react';
import styles from "./touranament_list.module.scss";

interface Team {
    player1_info: {
        player1: string;
        dota_id1: string;
        avatar: string;
        profileUrl: string;
    };
    player2_info: {
        player2: string;
        dota_id2: string;
        avatar: string;
        profileUrl: string;
    };
}

interface TournamentListProps {
    data: Team[];
}

export const TournamentList: React.FC<TournamentListProps> = ({ data }) => {
    const [updatedPlayers, setUpdatedPlayers] = useState<{ [key: string]: string }>({});



    const handleIdClick = (key: string, originalName: string, dotaId: string) => {
        setUpdatedPlayers((prev) => ({
            ...prev,
            [key]: prev[key] === dotaId ? originalName : dotaId,
        }));
    };

    return (
        <div>
            <table className={styles.table}>
                <thead>
                <tr className={styles.table_info}>
                    <th>#</th>
                    <th>Никнейм #1</th>
                    <th>Никнейм #2</th>
                </tr>
                </thead>
                <tbody>
                {data.map((team, index) => (
                    <tr key={index + 1} className={styles.table_data}>
                        <td>{index + 1}</td>
                        <td>
                            <div className={styles.container_table_data}>
                                <div className={styles.player_container}>
                                    <img src={team.player1_info.avatar} alt={"avatar"} className={styles.avatar}/>
                                    <div>{updatedPlayers[`player1-${index}`] || team.player1_info.player1}</div>
                                </div>
                                <div className={`${styles.id} ${updatedPlayers[`player1-${index}`] === team.player1_info.dota_id1 ? styles.active : ''}`}
                                     onClick={() => handleIdClick(`player1-${index}`, team.player1_info.player1, team.player1_info.dota_id1)}>
                                    ID
                                </div>
                            </div>
                        </td>
                        <td>
                            <div className={styles.container_table_data}>
                                <div className={styles.player_container}>
                                    <img src={team.player2_info.avatar} alt={"avatar"} className={styles.avatar}/>
                                    <div>{updatedPlayers[`player2-${index}`] || team.player2_info.player2}</div>
                                </div>
                                <div  className={`${styles.id} ${updatedPlayers[`player2-${index}`] === team.player2_info.dota_id2 ? styles.active : ''}`}
                                      onClick={() => handleIdClick(`player2-${index}`, team.player2_info.player2, team.player2_info.dota_id2)}>
                                    ID
                                </div>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};
