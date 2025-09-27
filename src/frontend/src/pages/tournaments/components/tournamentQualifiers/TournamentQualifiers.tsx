import React, { useState } from "react";
import styles from "./touranament_qualifiers.module.scss";
import {useTranslation} from "react-i18next";
// import {getImageUrl} from "../../../../utils/r2Storage";


interface Team {
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

interface Group {
    group_name: string;
    teams: {
        team_id: number;
        team_info: Team;
        points: number;
        place: number;
    }[];
}

interface ReplayGroup {
    group_name: string;
    teams: {
        team_id: number;
        team_info: Team;
        points: number;
        place: number;
    }[];
}

interface Replay {
    groups: ReplayGroup[];
}

interface MapData {
    map_name: string;
    groups: Group[];
}

interface TournamentData {
    teams: Team[];
    maps: MapData[];
    replays: Replay[];
}

interface TournamentQualifiersProps {
    data: TournamentData;
}




export const TournamentQualifiers: React.FC<TournamentQualifiersProps> = ({ data }) => {
    const { t } = useTranslation();
    const [updatedPlayers, setUpdatedPlayers] = useState<{ [key: string]: string }>({});
    const [showReplays, setShowReplays] = useState(false);
    const handleIdClick = (key: string, originalName: string, dotaId: string) => {
        setUpdatedPlayers((prev) => ({
            ...prev,
            [key]: prev[key] === dotaId ? originalName : dotaId,
        }));
    };
    const [updatedGroupPlayers, setUpdatedGroupPlayers] = useState<{ [key: string]: string }>({});

    // const handleGetScreenshot = async (mapName: string, groupName: string): Promise<void> => {
    //     try {
    //         const objectKey = `tournament/final/${mapName}/${groupName}.png`;
    //
    //         const signedUrl = await getImageUrl(objectKey);
    //
    //         if (signedUrl) {
    //             window.open(signedUrl, '_blank');
    //         } else {
    //             console.error("Unable to fetch screenshot.");
    //         }
    //     } catch (error) {
    //         console.error("Error fetching screenshot:", error);
    //     }
    // };


    const handleGroupIdClick = (groupKey: string, originalName: string, dotaId: string) => {
        setUpdatedGroupPlayers((prev) => ({
            ...prev,
            [groupKey]: prev[groupKey] === dotaId ? originalName : dotaId,
        }));
    };
    const [selectedMap, setSelectedMap] = useState<MapData | null>(data.maps.length > 0 ? data.maps[0] : null);

    const handleMapClick = (map: MapData) => {
        setSelectedMap(map);
        setShowReplays(false);
    };

    return (
        <div className={styles.div}>
            <table className={styles.table}>
                <thead>
                <tr className={styles.table_info}>
                    <th><div className={styles.th_place}>{t('place')}</div><div className={styles.th_lattice}>#</div></th>
                    <th>
                        <div>{t('nickname')} #1</div>
                    </th>
                    <th>
                        <div>{t('nickname')} #2</div>
                    </th>
                    <th>{t('points')}</th>
                </tr>
                </thead>
                <tbody>
                {data.teams
                    .sort((a, b) => {
                        if (a.winner && !b.winner) return -1;
                        if (!a.winner && b.winner) return 1;

                        if (b.total_points === a.total_points) {
                            return b.replays_points - a.replays_points;
                        }
                        return b.total_points - a.total_points;
                    })
                    .map((team, index) => (
                        <tr key={team.team_id} className={index < 16 ? styles.playoff_team : styles.no_playoff_team}>
                            <td>
                                <div className={styles.wreathContainer}>
                                    <img src={"/wreath.png"} alt={"wreath"} className={styles.wreathIcon}/>
                                    <div className={styles.rankNumber}>{index + 1}</div>
                                </div>

                            </td>
                            <td>
                                <div className={styles.container_table_data}>
                                    <img
                                        src={team.player1_info.avatar}
                                        alt="avatar"
                                        className={styles.avatar}
                                        onClick={() => {
                                            if (team.player1_info.profileUrl) {
                                                window.open(team.player1_info.profileUrl, '_blank');
                                            }
                                        }}
                                    />
                                    <div className={styles.player_container}>
                                        <div
                                            className={styles.ellipsis}>{updatedPlayers[`player1-${index}`] || team.player1_info.player1}</div>
                                        <div
                                            className={`${styles.id} ${
                                                updatedPlayers[`player1-${index}`] === team.player1_info.dota_id1 ? styles.active : ""
                                            }`}
                                            onClick={() => handleIdClick(`player1-${index}`, team.player1_info.player1, team.player1_info.dota_id1)}
                                        >
                                            ID
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles.container_table_data}>
                                    <img
                                        src={team.player2_info.avatar}
                                        alt="avatar"
                                        className={styles.avatar}
                                        onClick={() => {
                                            if (team.player2_info.profileUrl) {
                                                window.open(team.player2_info.profileUrl, '_blank');
                                            }
                                        }}
                                    />
                                    <div className={styles.player_container}>
                                        <div
                                            className={styles.ellipsis}>{updatedPlayers[`player2-${index}`] || team.player2_info.player2}</div>
                                        <div
                                            className={`${styles.id} ${
                                                updatedPlayers[`player2-${index}`] === team.player2_info.dota_id2 ? styles.active : ""
                                            }`}
                                            onClick={() => handleIdClick(`player2-${index}`, team.player2_info.player2, team.player2_info.dota_id2)}
                                        >
                                            ID
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className={styles.points}>
                                <div>{team.total_points}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div>
                <div className={styles.btn_container}>
                    <div className={styles.container_buttons_map}>
                    {data.maps.map((map, index) => (
                            <button
                                key={index}
                                onClick={() => handleMapClick(map)}
                                className={`${styles.button}  ${!showReplays && selectedMap?.map_name === map.map_name ? styles.active : ''}`}
                            >
                                {t('map')} {map.map_name}
                            </button>
                        ))}
                        {data.replays?.length > 0 && (
                            <button
                                onClick={() => {
                                    setShowReplays(true);
                                    if (showReplays) {
                                        setSelectedMap(null);
                                    }
                                }}
                                className={`${styles.button} ${showReplays ? styles.active : ''}`}
                            >
                                {t('replays')}
                            </button>
                        )}
                    </div>
                </div>
                {showReplays ? (
                    <div>
                        <div className={styles.maps_name}>Переигровки</div>
                        {data.replays.map((replay, replayIndex) => (
                            <div className={styles.groups_grid}>
                                {replay.groups.map((group, index) => (
                                    <div key={index} className={styles.group_container}>
                                        <div className={styles.group_name}>Группа: {group.group_name}</div>
                                        <table className={styles.table_group}>
                                            <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>{t('nickname')} #1</th>
                                                <th>{t('nickname')} #2</th>
                                                <th>{t('points')}</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                        {group.teams
                                            .slice()
                                            .sort((a, b) => a.place - b.place)
                                            .map((teamData) => (
                                                <tr key={teamData.team_id}>
                                                    <td>
                                                        <div className={styles.wreathContainer}>
                                                            <img src={"/wreath.png"} alt={"wreath"}
                                                                 className={styles.wreathIconGroup}/>
                                                            <div className={styles.rankNumberGroup}>{teamData.place}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.container_table_data_group}>
                                                            <img
                                                                src={teamData.team_info.player1_info.avatar}
                                                                alt="avatar"
                                                                className={styles.avatarGroup}
                                                                onClick={() => {
                                                                    if (teamData.team_info.player1_info.profileUrl) {
                                                                        window.open(teamData.team_info.player1_info.profileUrl, '_blank');
                                                                    }
                                                                }}
                                                            />
                                                            <div className={styles.player_container}>
                                                                <div className={styles.ellipsis}>
                                                                    {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player1`] ||
                                                                        teamData.team_info.player1_info.player1}
                                                                </div>
                                                                <div
                                                                    className={`${styles.id} ${
                                                                        updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player1`] ===
                                                                        teamData.team_info.player1_info.dota_id1
                                                                            ? styles.active
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleGroupIdClick(
                                                                            `group-${group.group_name}-team-${teamData.team_id}-player1`,
                                                                            teamData.team_info.player1_info.player1,
                                                                            teamData.team_info.player1_info.dota_id1
                                                                        )
                                                                    }
                                                                >
                                                                    ID
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.container_table_data_group}>
                                                            <img
                                                                src={teamData.team_info.player2_info.avatar}
                                                                alt="avatar"
                                                                className={styles.avatarGroup}
                                                                onClick={() => {
                                                                    if (teamData.team_info.player2_info.profileUrl) {
                                                                        window.open(teamData.team_info.player2_info.profileUrl, '_blank');
                                                                    }
                                                                }}
                                                            />
                                                            <div className={styles.player_container}>
                                                                <div className={styles.ellipsis}>
                                                                    {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player2`] ||
                                                                        teamData.team_info.player2_info.player2}
                                                                </div>
                                                                <div
                                                                    className={`${styles.id} ${
                                                                        updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player2`] ===
                                                                        teamData.team_info.player2_info.dota_id2
                                                                            ? styles.active
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleGroupIdClick(
                                                                            `group-${group.group_name}-team-${teamData.team_id}-player2`,
                                                                            teamData.team_info.player2_info.player2,
                                                                            teamData.team_info.player2_info.dota_id2
                                                                        )
                                                                    }
                                                                >
                                                                    ID
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={styles.points_group}>
                                                        <div>{teamData.points}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    selectedMap && (
                        <div>
                            <div className={styles.maps_name}>{t('groups_for_map')} {selectedMap.map_name}</div>
                            {selectedMap.groups.length === 0 ? (
                                <div className={styles.noGroupsMessage}>{t('groups_missing')}</div>
                            ) : (
                                <div className={styles.groups_grid}>
                                    {selectedMap.groups.map((group, index) => (
                                        <div key={index} className={styles.group_container}>
                                        <div className={styles.group_name}>Группа: {group.group_name}</div>
                                            <table className={styles.table_group}>
                                                <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>{t('nickname')} #1</th>
                                                    <th>{t('nickname')} #2</th>
                                                    <th>{t('points')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {group.teams
                                                    .slice()
                                                    .sort((a, b) => a.place - b.place)
                                                    .map((teamData) => (
                                                        <tr key={teamData.team_id}>
                                                            <td>
                                                                <div className={styles.wreathContainer}>
                                                                    <img src={"/wreath.png"} alt={"wreath"}
                                                                         className={styles.wreathIconGroup}/>
                                                                    <div
                                                                        className={styles.rankNumberGroup}>{teamData.place}</div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={styles.container_table_data_group}>
                                                                    <img
                                                                        src={teamData.team_info.player1_info.avatar}
                                                                        alt="avatar"
                                                                        className={styles.avatarGroup}
                                                                        onClick={() => {
                                                                            if (teamData.team_info.player1_info.profileUrl) {
                                                                                window.open(teamData.team_info.player1_info.profileUrl, '_blank');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className={styles.player_container}>
                                                                        <div className={styles.ellipsis}>
                                                                            {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player1`] ||
                                                                                teamData.team_info.player1_info.player1}
                                                                        </div>
                                                                        <div
                                                                            className={`${styles.id} ${
                                                                                updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player1`] ===
                                                                                teamData.team_info.player1_info.dota_id1
                                                                                    ? styles.active
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() =>
                                                                                handleGroupIdClick(
                                                                                    `group-${group.group_name}-team-${teamData.team_id}-player1`,
                                                                                    teamData.team_info.player1_info.player1,
                                                                                    teamData.team_info.player1_info.dota_id1
                                                                                )
                                                                            }
                                                                        >
                                                                            ID
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </td>
                                                            <td>
                                                                <div className={styles.container_table_data_group}>
                                                                    <img
                                                                        src={teamData.team_info.player2_info.avatar}
                                                                        alt="avatar"
                                                                        className={styles.avatarGroup}
                                                                        onClick={() => {
                                                                            if (teamData.team_info.player2_info.profileUrl) {
                                                                                window.open(teamData.team_info.player2_info.profileUrl, '_blank');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className={styles.player_container}>
                                                                        <div className={styles.ellipsis}>
                                                                        {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player2`] ||
                                                                                teamData.team_info.player2_info.player2}
                                                                        </div>
                                                                        <div
                                                                            className={`${styles.id} ${
                                                                                updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player2`] ===
                                                                                teamData.team_info.player2_info.dota_id2
                                                                                    ? styles.active
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() =>
                                                                                handleGroupIdClick(
                                                                                    `group-${group.group_name}-team-${teamData.team_id}-player2`,
                                                                                    teamData.team_info.player2_info.player2,
                                                                                    teamData.team_info.player2_info.dota_id2
                                                                                )
                                                                            }
                                                                        >
                                                                            ID
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </td>
                                                            <td className={styles.points_group}>
                                                                <div>{teamData.points}</div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {/*<button onClick={() => handleGetScreenshot(selectedMap.map_name, group.group_name)}></button>*/}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                )}


            </div>
        </div>
    );
};
