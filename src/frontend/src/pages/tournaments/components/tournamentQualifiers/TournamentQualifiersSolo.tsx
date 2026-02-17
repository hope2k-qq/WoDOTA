import React, { useState } from "react";
import styles from "./touranament_qualifiers_solo.module.scss";
import {useTranslation} from "react-i18next";
import TournamentTableHead from "./TournamentTableHead";
import {ParticipantRow} from "./ParticipantRow";
import { TournamentMapsSection } from "./TournamentMapsSection";
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
    type: "solo" | "duo";
}
type Participant = Player | Team;

const isSolo = (data: TournamentData): data is TournamentDataSolo => {
    return (data as TournamentDataSolo).players !== undefined;
};

const isDuo = (data: TournamentData): data is TournamentDataDuo => {
    return (data as TournamentDataDuo).teams !== undefined;
};


export const TournamentQualifiersSolo: React.FC<TournamentQualifiersProps> = ({ data, count, type }) => {
    const { t } = useTranslation();
    const [showReplays, setShowReplays] = useState(false);
    const [updatedPlayers, setUpdatedPlayers] = React.useState<{ [key: string]: string }>({});

    const handleIdClick = (key: string, originalName: string, dotaId: string) => {
        setUpdatedPlayers(prev => ({
            ...prev,
            [key]: prev[key] === dotaId ? originalName : dotaId
        }));
    };

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
                {isSolo(data) &&
                    [...data.players].sort(sortParticipants).map((p, i) => (
                        <ParticipantRow key={p.player_id} participant={p} index={i} type="solo" count={count} />
                    ))
                }

                {isDuo(data) &&
                    [...data.teams].sort(sortParticipants).map((t, i) => (
                        <ParticipantRow key={t.team_id} participant={t} index={i} type="duo" count={count} updatedPlayers={updatedPlayers} handleIdClick={handleIdClick} />
                    ))
                }


                </tbody>
            </table>
            <TournamentMapsSection
                data={data}
                type={type}
                t={t}
                showReplays={showReplays}
                setShowReplays={setShowReplays}
                selectedMap={selectedMap}
                setSelectedMap={setSelectedMap}
                handleMapClick={handleMapClick}
            />

        </div>
    );
};
