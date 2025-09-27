import React, { useState } from "react";
import styles from "./touranament_qualifiers_solo.module.scss";
import {useTranslation} from "react-i18next";
import TournamentTableHead from "./TournamentTableHead";
import {ParticipantRow} from "./ParticipantRow";
// import {getImageUrl} from "../../../../utils/r2Storage";


interface Player {
    player_id: number;
    player_info: PlayerInfo;
    total_points: number;
    replays_points: number;
    winner: boolean;
}

interface PlayerInfo {
    player: string;
    dota_id: string;
    avatar: string;
    profileUrl: string;
}

interface Group {
    group_name: string;
    players: {
        player_id: number;
        player_info: PlayerInfo;
        points: number;
        place: number;
    }[];
}

interface ReplayGroup {
    group_name: string;
    players: {
        player_id: number;
        player_info: PlayerInfo;
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

type TournamentDataSolo = {
    players: Player[];
    maps: MapData[];
    replays: Replay[];
};

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

type TournamentDataDuo = {
    teams: Team[];
    maps: MapData[];
    replays: Replay[];
};

type TournamentData = TournamentDataSolo | TournamentDataDuo;

interface TournamentQualifiersProps {
    data: TournamentData;
    count: number;
    type: string;
}
// type Participant = {
//     total_points: number;
//     replays_points: number;
//     winner?: boolean;
//     player_id?: number;
//     team_id?: number;
// };

type Participant = Player | Team;

// Type guard для Solo
const isSolo = (data: TournamentData): data is TournamentDataSolo => {
    return (data as TournamentDataSolo).players !== undefined;
};

// Type guard для Duo
const isDuo = (data: TournamentData): data is TournamentDataDuo => {
    return (data as TournamentDataDuo).teams !== undefined;
};


export const TournamentQualifiersSolo: React.FC<TournamentQualifiersProps> = ({ data, count, type }) => {
    const { t } = useTranslation();
    const [showReplays, setShowReplays] = useState(false);

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

    const [selectedMap, setSelectedMap] = useState<MapData | null>(data.maps.length > 0 ? data.maps[0] : null);

    const handleMapClick = (map: MapData) => {
        setSelectedMap(map);
        setShowReplays(false);
    };

    const sortParticipants = (a: Participant, b: Participant) => {

        if (a.winner && !b.winner) return -1;
        if (!a.winner && b.winner) return 1;
        if (b.total_points === a.total_points) {
            return b.replays_points - a.replays_points;
        }
        return b.total_points - a.total_points;
    };

    return (
        <div className={styles.div}>
            <table className={styles.table}>
                <TournamentTableHead type={type} t={t} />
                <tbody>
                {/*{sortedParticipants.map((p, index) => (*/}
                {/*        <tr key={type === "solo" ? p.player_id : p.team_id} className={index < count ? styles.playoff_team : styles.no_playoff_team}>*/}
                {/*            <td>*/}
                {/*                <div className={styles.wreathContainer}>*/}
                {/*                    <img src={"/wreath.png"} alt={"wreath"} className={styles.wreathIcon}/>*/}
                {/*                    <div className={styles.rankNumber}>{index + 1}</div>*/}
                {/*                </div>*/}

                {/*            </td>*/}
                {/*            <td>*/}
                {/*                <div className={styles.container_table_data}>*/}
                {/*                    <img*/}
                {/*                        src={player.player_info.avatar}*/}
                {/*                        alt="avatar"*/}
                {/*                        className={styles.avatar}*/}
                {/*                        onClick={() => {*/}
                {/*                            if (player.player_info.profileUrl) {*/}
                {/*                                window.open(player.player_info.profileUrl, '_blank');*/}
                {/*                            }*/}
                {/*                        }}*/}
                {/*                    />*/}
                {/*                    <div className={styles.player_container}>*/}
                {/*                        <div*/}
                {/*                            className={styles.ellipsis}>{player.player_info.player}</div>*/}
                {/*                    </div>*/}
                {/*                </div>*/}
                {/*            </td>*/}
                {/*            <td>*/}
                {/*                <div className={styles.container_table_data}>*/}
                {/*                    <div className={styles.player_container} style={{justifyContent: 'center'}}>*/}
                {/*                        <div*/}
                {/*                            className={styles.ellipsis}>{player.player_info.dota_id}</div>*/}
                {/*                    </div>*/}
                {/*                </div>*/}
                {/*            </td>*/}
                {/*            <td className={styles.points}>*/}
                {/*                <div>{player.total_points}</div>*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*    ))}*/}
                {/*{type === "solo"*/}
                {/*    ? data.players.sort(sortParticipants).map((p, i) => (*/}
                {/*        <ParticipantRow key={p.player_id} participant={p} index={i} type="solo" count={count} />*/}
                {/*    ))*/}
                {/*    : data.teams.sort(sortParticipants).map((t, i) => (*/}
                {/*        <ParticipantRow*/}
                {/*            key={t.team_id}*/}
                {/*            participant={t}*/}
                {/*            index={i}*/}
                {/*            type="duo"*/}
                {/*            count={count}*/}
                {/*            updatedPlayers={updatedPlayers}*/}
                {/*            handleIdClick={handleIdClick}*/}
                {/*        />*/}
                {/*    ))}*/}
                {isSolo(data) &&
                    [...data.players].sort(sortParticipants).map((p, i) => (
                        <ParticipantRow key={p.player_id} participant={p} index={i} type="solo" count={count} />
                    ))
                }

                {isDuo(data) &&
                    [...data.teams].sort(sortParticipants).map((t, i) => (
                        <ParticipantRow key={t.team_id} participant={t} index={i} type="duo" count={count} />
                    ))
                }


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
                                                <th>{t('nickname')}</th>
                                                <th>DOTA ID</th>
                                                <th>{t('points')}</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                        {group.players
                                            .slice()
                                            .sort((a, b) => a.place - b.place)
                                            .map((playerData) => (
                                                <tr key={playerData.player_id}>
                                                    <td>
                                                        <div className={styles.wreathContainer}>
                                                            <img src={"/wreath.png"} alt={"wreath"}
                                                                 className={styles.wreathIconGroup}/>
                                                            <div className={styles.rankNumberGroup}>{playerData.place}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.container_table_data_group}>
                                                            <img
                                                                src={playerData.player_info.avatar}
                                                                alt="avatar"
                                                                className={styles.avatarGroup}
                                                                onClick={() => {
                                                                    if (playerData.player_info.profileUrl) {
                                                                        window.open(playerData.player_info.profileUrl, '_blank');
                                                                    }
                                                                }}
                                                            />
                                                            <div className={styles.player_container}>
                                                                <div className={styles.ellipsis}>
                                                                    {playerData.player_info.player}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className={styles.container_table_data_group}>
                                                            <div className={styles.player_container} style={{justifyContent: 'center'}}>
                                                                <div className={styles.ellipsis}>
                                                                    {playerData.player_info.dota_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={styles.points_group}>
                                                        <div>{playerData.points}</div>
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
                                                    <th>{t('nickname')}</th>
                                                    <th>DOTA ID</th>
                                                    <th>{t('points')}</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {group.players
                                                    .slice()
                                                    .sort((a, b) => a.place - b.place)
                                                    .map((playerData) => (
                                                        <tr key={playerData.player_id}>
                                                            <td>
                                                                <div className={styles.wreathContainer}>
                                                                    <img src={"/wreath.png"} alt={"wreath"}
                                                                         className={styles.wreathIconGroup}/>
                                                                    <div
                                                                        className={styles.rankNumberGroup}>{playerData.place}</div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={styles.container_table_data_group}>
                                                                    <img
                                                                        src={playerData.player_info.avatar}
                                                                        alt="avatar"
                                                                        className={styles.avatarGroup}
                                                                        onClick={() => {
                                                                            if (playerData.player_info.profileUrl) {
                                                                                window.open(playerData.player_info.profileUrl, '_blank');
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className={styles.player_container}>
                                                                        <div className={styles.ellipsis}>
                                                                            {playerData.player_info.player}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </td>
                                                            <td>
                                                                <div className={styles.container_table_data_group}>
                                                                    <div className={styles.player_container} style={{justifyContent: 'center'}}>
                                                                        <div className={styles.ellipsis}>
                                                                        {playerData.player_info.dota_id}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </td>
                                                            <td className={styles.points_group}>
                                                                <div>{playerData.points}</div>
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
