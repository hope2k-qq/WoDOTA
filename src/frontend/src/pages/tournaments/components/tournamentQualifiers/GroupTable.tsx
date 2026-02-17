import React from "react";
import styles from "./touranament_qualifiers_solo.module.scss";
import { TFunction } from "i18next";

interface GroupTableProps {
    group: any;
    t: TFunction;
    type: "solo" | "duo";

}

export const GroupTable: React.FC<GroupTableProps> = ({ group, t, type }) => {
    const [updatedPlayers, setUpdatedPlayers] = React.useState<{ [key: string]: string }>({});

    const handleIdClick = (key: string, originalName: string, dotaId: string) => {
        setUpdatedPlayers(prev => ({
            ...prev,
            [key]: prev[key] === dotaId ? originalName : dotaId
        }));
    };
    const isSolo = type === "solo";

    const rows = isSolo
        ? group.players.slice().sort((a: any, b: any) => a.place - b.place)
        : group.teams.slice().sort((a: any, b: any) => a.place - b.place);

    const renderRank = (place: number) => (
        <div className={styles.wreathContainer}>
            <img
                src="/wreath.png"
                alt="wreath"
                className={styles.wreathIconGroup}
            />
            <div className={styles.rankNumberGroup}>{place}</div>
        </div>
    );

    const renderPlayerCell = (
        key: string,
        avatar: string,
        nickname: string,
        profileUrl?: string,
        options?: {
            enableToggle?: boolean;
            dotaId?: string;
        }
    ) => {
        const enableToggle = options?.enableToggle;
        const dotaId = options?.dotaId;

        const currentValue = enableToggle
            ? updatedPlayers[key] || nickname
            : nickname;

        const isActive = enableToggle && currentValue === dotaId;

        return (
            <div className={styles.container_table_data_group}>
                <img
                    src={avatar}
                    alt="avatar"
                    className={styles.avatarGroup}
                    onClick={() => {
                        if (profileUrl) {
                            window.open(profileUrl, "_blank");
                        }
                    }}
                />

                <div className={styles.player_container}>
                    <div className={styles.ellipsis}>
                        {currentValue}
                    </div>

                    {enableToggle && dotaId && (
                        <div
                            className={`${styles.id} ${isActive ? styles.active : ""}`}
                            onClick={() =>
                                handleIdClick(key, nickname, dotaId)
                            }
                        >
                            ID
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.group_container}>
            <div className={styles.group_name}>
                Группа: {group.group_name}
            </div>

            <table className={styles.table_group}>
                <thead>
                <tr>
                    <th>#</th>

                    {isSolo ? (
                        <>
                            <th>{t("nickname")}</th>
                            <th>DOTA ID</th>
                        </>
                    ) : (
                        <>
                            <th>{t("nickname")} #1</th>
                            <th>{t("nickname")} #2</th>
                        </>
                    )}

                    <th>{t("points")}</th>
                </tr>
                </thead>

                <tbody>
                {rows.map((row: any) => (
                    <tr key={isSolo ? row.player_id : row.team_id}>
                        <td>{renderRank(row.place)}</td>

                        {isSolo ? (
                            <>
                                <td>
                                    {renderPlayerCell(
                                        `solo-${row.player_id}`,
                                        row.player_info.avatar,
                                        row.player_info.player,
                                        row.player_info.profileUrl
                                    )}
                                </td>

                                <td>
                                    <div
                                        className={
                                            styles.container_table_data_group
                                        }
                                    >
                                        <div
                                            className={
                                                styles.player_container
                                            }
                                            style={{
                                                justifyContent: "center",
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles.ellipsis
                                                }
                                            >
                                                {row.player_info.dota_id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </>
                        ) : (
                            <>
                                <td>
                                    {renderPlayerCell(
                                        `team-${row.team_id}-p1`,
                                        row.team_info.player1_info.avatar,
                                        row.team_info.player1_info.player1,
                                        row.team_info.player1_info.profileUrl,
                                        {
                                            enableToggle: true,
                                            dotaId: row.team_info.player1_info.dota_id1
                                        }
                                    )}
                                </td>

                                <td>
                                    {renderPlayerCell(
                                        `team-${row.team_id}-p2`,
                                        row.team_info.player2_info.avatar,
                                        row.team_info.player2_info.player2,
                                        row.team_info.player2_info.profileUrl,
                                        {
                                            enableToggle: true,
                                            dotaId: row.team_info.player2_info.dota_id2
                                        }
                                    )}
                                </td>
                            </>
                        )}

                        <td className={styles.points_group}>
                            <div>{row.points}</div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};
