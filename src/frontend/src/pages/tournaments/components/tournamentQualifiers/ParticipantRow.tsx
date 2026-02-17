import React from "react";
import styles from "./touranament_qualifiers.module.scss";

interface PlayerInfo {
    player: string;
    dota_id: string;
    avatar: string;
    profileUrl: string;
}

export interface Player {
    player_id: number;
    player_info: PlayerInfo;
    total_points: number;
    replays_points: number;
    winner: boolean;
}

export interface Team {
    team_id: number;
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
    total_points: number;
    replays_points: number;
    winner: boolean;
}

interface ParticipantRowProps {
    participant: Player | Team;
    index: number;
    type: "solo" | "duo";
    count: number;
    updatedPlayers?: Record<string, string>;
    handleIdClick?: (key: string, originalName: string, dotaId: string) => void;
}

function isPlayer(p: Player | Team): p is Player {
    return (p as Player).player_info !== undefined;
}

function isTeam(p: Player | Team): p is Team {
    return (p as Team).player1_info !== undefined;
}

export const ParticipantRow: React.FC<ParticipantRowProps> = ({
                                                                  participant,
                                                                  index,
                                                                  type,
                                                                  count,
                                                                  updatedPlayers,
                                                                  handleIdClick
                                                              }) => {

    return (
        <tr className={index < count ? styles.playoff_team : styles.no_playoff_team}>
            <td>
                <div className={styles.wreathContainer}>
                    <img src="/wreath.png" alt="wreath" className={styles.wreathIcon} />
                    <div className={styles.rankNumber}>{index + 1}</div>
                </div>
            </td>

            {isPlayer(participant) && type === "solo" && (
                <>
                    <td>
                        <div className={styles.container_table_data}>
                            <img
                                src={participant.player_info.avatar}
                                alt="avatar"
                                className={styles.avatar}
                                onClick={() => participant.player_info.profileUrl && window.open(participant.player_info.profileUrl, "_blank")}
                            />
                            <div className={styles.player_container}>
                                <div className={styles.ellipsis}>{participant.player_info.player}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className={styles.container_table_data}>
                            <div className={styles.player_container} style={{ justifyContent: "center" }}>
                                <div className={styles.ellipsis}>{participant.player_info.dota_id}</div>
                            </div>
                        </div>
                    </td>
                    <td className={styles.points}><div>{participant.total_points}</div></td>
                </>
            )}

            {isTeam(participant) && type === "duo" && (
                <>
                    <td>
                        <div className={styles.container_table_data}>
                            <img
                                src={participant.player1_info.avatar}
                                alt="avatar"
                                className={styles.avatar}
                                onClick={() => participant.player1_info.profileUrl && window.open(participant.player1_info.profileUrl, "_blank")}
                            />
                            <div className={styles.player_container}>
                                <div className={styles.ellipsis}>
                                    {updatedPlayers?.[`player1-${index}`] || participant.player1_info.player1}
                                </div>
                                <div
                                    className={`${styles.id} ${
                                        updatedPlayers?.[`player1-${index}`] === participant.player1_info.dota_id1 ? styles.active : ""
                                    }`}
                                    onClick={() => handleIdClick?.(`player1-${index}`, participant.player1_info.player1, participant.player1_info.dota_id1)}
                                >
                                    ID
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className={styles.container_table_data}>
                            <img
                                src={participant.player2_info.avatar}
                                alt="avatar"
                                className={styles.avatar}
                                onClick={() => participant.player2_info.profileUrl && window.open(participant.player2_info.profileUrl, "_blank")}
                            />
                            <div className={styles.player_container}>
                                <div className={styles.ellipsis}>
                                    {updatedPlayers?.[`player2-${index}`] || participant.player2_info.player2}
                                </div>
                                <div
                                    className={`${styles.id} ${
                                        updatedPlayers?.[`player2-${index}`] === participant.player2_info.dota_id2 ? styles.active : ""
                                    }`}
                                    onClick={() => handleIdClick?.(`player2-${index}`, participant.player2_info.player2, participant.player2_info.dota_id2)}
                                >
                                    ID
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className={styles.points}>
                        <div>{participant.total_points}</div>
                    </td>
                </>
            )}
        </tr>
    );
};
