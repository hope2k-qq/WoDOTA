import React from "react";
import styles from "./touranament_qualifiers_solo.module.scss";
import { TFunction } from "i18next";
import {GroupTable} from "./GroupTable";

interface TournamentMapsSectionProps {
    data: any;
    type: "solo" | "duo";
    t: TFunction;
    showReplays: boolean;
    setShowReplays: (v: boolean) => void;
    selectedMap: any;
    setSelectedMap: (map: any | null) => void;
    handleMapClick: (map: any) => void;
}

export const TournamentMapsSection: React.FC<TournamentMapsSectionProps> = ({
                                                                                data,
                                                                                type,
                                                                                t,
                                                                                showReplays,
                                                                                setShowReplays,
                                                                                selectedMap,
                                                                                setSelectedMap,
                                                                                handleMapClick,
                                                                            }) => {
    return (
        <div>
            <div className={styles.btn_container}>
                <div className={styles.container_buttons_map}>
                    {data.maps.map((map: any, index: number) => (
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
                    {data.replays.map((replay: any, replayIndex: number) => (
                        <div className={styles.groups_grid}>
                            {replay.groups.map((group: any, index: number) => (
                                <GroupTable key={index} group={group} t={t} type={type}/>
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
                                {selectedMap.groups.map((group: any, index: number) => (
                                    <GroupTable key={index} group={group} t={t} type={type}/>
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};
