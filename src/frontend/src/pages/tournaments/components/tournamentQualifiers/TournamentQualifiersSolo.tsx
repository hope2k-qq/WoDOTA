import React, { useState } from "react";
import styles from "./touranament_qualifiers.module.scss";
import {useTranslation} from "react-i18next";
// import {getImageUrl} from "../../../../utils/r2Storage";


interface Team {
    team_id: number;
    player_info: {
        player: string;
        dota_id: string;
        avatar: string;
        profileUrl: string;
    };
    total_points: number;
    replays_points: number;
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


export const TournamentQualifiersSolo: React.FC<TournamentQualifiersProps> = ({ data }) => {
    const { t } = useTranslation();
    const [showReplays, setShowReplays] = useState(false);
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
                        <div>{t('nickname')}</div>
                    </th>
                    <th>
                        <div>DOTA ID</div>
                    </th>
                    <th>{t('points')}</th>
                </tr>
                </thead>
                <tbody>
                {data.teams
                    .sort((a, b) => {
                        if (b.total_points === a.total_points) {
                            return b.replays_points - a.replays_points;
                        }
                        return b.total_points - a.total_points;
                    })
                    .map((team, index) => (
                        <tr key={team.team_id} className={index < 49 ? styles.playoff_team : styles.no_playoff_team}>
                            <td>
                                <div className={styles.wreathContainer}>
                                    <img src={"/wreath.png"} alt={"wreath"} className={styles.wreathIcon}/>
                                    <div className={styles.rankNumber}>{index + 1}</div>
                                </div>

                            </td>
                            <td>
                                <div className={styles.container_table_data}>
                                    <img
                                        src={team.player_info.avatar}
                                        alt="avatar"
                                        className={styles.avatar}
                                        onClick={() => {
                                            if (team.player_info.profileUrl) {
                                                window.open(team.player_info.profileUrl, '_blank');
                                            }
                                        }}
                                    />
                                    <div className={styles.player_container}>
                                        <div
                                            className={styles.ellipsis}>{team.player_info.player}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles.container_table_data}>
                                    <div className={styles.player_container} style={{justifyContent: 'center'}}>
                                        <div
                                            className={styles.ellipsis}>{team.player_info.dota_id}</div>
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
                                                                src={teamData.team_info.player_info.avatar}
                                                                alt="avatar"
                                                                className={styles.avatarGroup}
                                                                onClick={() => {
                                                                    if (teamData.team_info.player_info.profileUrl) {
                                                                        window.open(teamData.team_info.player_info.profileUrl, '_blank');
                                                                    }
                                                                }}
                                                            />
                                                            <div className={styles.player_container}>
                                                                <div className={styles.ellipsis}>
                                                                    {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player1`] ||
                                                                        teamData.team_info.player_info.player}
                                                                </div>
                                                                <div
                                                                    className={`${styles.id} ${
                                                                        updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ===
                                                                        teamData.team_info.player_info.dota_id
                                                                            ? styles.active
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleGroupIdClick(
                                                                            `group-${group.group_name}-team-${teamData.team_id}-player`,
                                                                            teamData.team_info.player_info.player,
                                                                            teamData.team_info.player_info.dota_id
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
                                                                src={teamData.team_info.player_info.avatar}
                                                                alt="avatar"
                                                                className={styles.avatarGroup}
                                                                onClick={() => {
                                                                    if (teamData.team_info.player_info.profileUrl) {
                                                                        window.open(teamData.team_info.player_info.profileUrl, '_blank');
                                                                    }
                                                                }}
                                                            />
                                                            <div className={styles.player_container}>
                                                                <div className={styles.ellipsis}>
                                                                    {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ||
                                                                        teamData.team_info.player_info.player}
                                                                </div>
                                                                <div
                                                                    className={`${styles.id} ${
                                                                        updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ===
                                                                        teamData.team_info.player_info.dota_id
                                                                            ? styles.active
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleGroupIdClick(
                                                                            `group-${group.group_name}-team-${teamData.team_id}-player`,
                                                                            teamData.team_info.player_info.player,
                                                                            teamData.team_info.player_info.dota_id
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
                                                                        src={teamData.team_info.player_info.avatar}
                                                                        alt="avatar"
                                                                        className={styles.avatarGroup}
                                                                        onClick={() => {
                                                                            if (teamData.team_info.player_info.profileUrl) {
                                                                                window.open(teamData.team_info.player_info.profileUrl, '_blank');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className={styles.player_container}>
                                                                        <div className={styles.ellipsis}>
                                                                            {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ||
                                                                                teamData.team_info.player_info.player}
                                                                        </div>
                                                                        <div
                                                                            className={`${styles.id} ${
                                                                                updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ===
                                                                                teamData.team_info.player_info.dota_id
                                                                                    ? styles.active
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() =>
                                                                                handleGroupIdClick(
                                                                                    `group-${group.group_name}-team-${teamData.team_id}-player1`,
                                                                                    teamData.team_info.player_info.player,
                                                                                    teamData.team_info.player_info.dota_id
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
                                                                        src={teamData.team_info.player_info.avatar}
                                                                        alt="avatar"
                                                                        className={styles.avatarGroup}
                                                                        onClick={() => {
                                                                            if (teamData.team_info.player_info.profileUrl) {
                                                                                window.open(teamData.team_info.player_info.profileUrl, '_blank');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className={styles.player_container}>
                                                                        <div className={styles.ellipsis}>
                                                                        {updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ||
                                                                                teamData.team_info.player_info.player}
                                                                        </div>
                                                                        <div
                                                                            className={`${styles.id} ${
                                                                                updatedGroupPlayers[`group-${group.group_name}-team-${teamData.team_id}-player`] ===
                                                                                teamData.team_info.player_info.dota_id
                                                                                    ? styles.active
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() =>
                                                                                handleGroupIdClick(
                                                                                    `group-${group.group_name}-team-${teamData.team_id}-player2`,
                                                                                    teamData.team_info.player_info.player,
                                                                                    teamData.team_info.player_info.dota_id
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
