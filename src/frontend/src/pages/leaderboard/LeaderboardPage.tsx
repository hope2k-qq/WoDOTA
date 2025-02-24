import styles from "./leaderboard.module.scss";
import axios from "axios";
import React, {useEffect, useState, useCallback} from "react";
import { ReactComponent as SearchIcon } from "../../assets/icons/SearchIcon.svg";

interface Player {
    steamid: string;
    rating: number;
    avatar?: string;
    profileUrl?: string;
    personaName?: string;
    rank: string;
}

interface PlayerGroup {
    steamids: string[];
    wave_count: string;
    heroes: string[];
    avatars: string[];
    profileUrls: string[];
    personaNames: string[];
    rank: string;
}

export const LeaderboardPage = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [arenaPlayers, setArenaPlayers] = useState<Record<string, PlayerGroup[]>>({});
    const [loadingRating, setLoadingRating] = useState<boolean>(true);
    const [loadingArena, setLoadingArena] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState<string>("rating");
    const [arenaGroup, setArenaGroup] = useState<string>("1");
    const [searchTerm, setSearchTerm] = useState("");
    const API_URL = process.env.REACT_APP_API_URL;

    const [openModalIndex, setOpenModalIndex] = useState<number | null>(null);

    const handleShowAllHeroes = (index: number) => {
        setOpenModalIndex(prevIndex => (prevIndex === index ? null : index));
    };

    const fetchRatingData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/leaderboard_rating`);
            const playersData: Player[] = response.data.map((player: { steamid: string; rating: string; avatar?: string; profileUrl?: string; personaName?: string; rank: string; }) => ({
                steamid: player.steamid,
                rating: parseInt(player.rating, 10),
                avatar: player.avatar,
                profileUrl: player.profileUrl,
                personaName: player.personaName,
                rank: player.rank

            }));
            setPlayers(playersData);
        } catch (err) {
            setError("Error fetching rating data");
        } finally {
            setLoadingRating(false);
        }
    }, [API_URL]);

    const fetchArenaData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/leaderboard_arena`);
            setArenaPlayers(response.data);
        } catch (err) {
            setError("Error fetching arena data");
        } finally {
            setLoadingArena(false);
        }
    }, [API_URL]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([fetchRatingData(), fetchArenaData()]);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        void fetchData();
    }, [fetchRatingData, fetchArenaData]);






    const handleRatingChange = (rating: string) => {
        setSelectedRating(rating);
    };

    const handleArenaGroupChange = (group: string) => {
        setArenaGroup(group);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const filteredPlayers = players.filter((player) =>
        player.personaName?.toLowerCase().includes(searchTerm) ?? false
    );

    const filteredArenaPlayers = arenaPlayers[arenaGroup]?.filter((player) =>
        player.personaNames?.some(name => name.toLowerCase().includes(searchTerm)) ?? false
    ) || [];

    const handleHeroClick = (hero: string) => {
        const heroName = hero.replace("npc_dota_hero_", "");
        window.open(`/hero/${heroName}`, "_blank");
    };

    if (loadingRating) {
        return <div></div>;
    }

    if (error) {
        return <div>error</div>;
    }


    const renderRatingPlayers = () => {
        const topPlayers = filteredPlayers.filter(player => Number(player.rank) <= 3);
        const remainingPlayers = filteredPlayers.filter(player => Number(player.rank) > 3);


        return (
            <div className={styles.container_table}>
                <div className={styles.topPlayersContainer}>
                    {topPlayers.map((player, index) => (
                        <div
                            key={index}
                            className={`${styles.topPlayerCard} ${styles.topPlayerCardMaskRating} ${styles[`topPlayerCard${player.rank}`]} 
                        ${styles[`topPlayerCard${player.rank}_border_color`]}`}
                        >
                            <img src={"/crown.png"} alt="crown" className={styles.crownIcon}/>
                            <div className={`${styles.topPlayersRank} 
                            ${styles[`topPlayerCard${player.rank}_color`]}`}>{player.rank} МЕСТО
                            </div>
                            <div className={`${styles.topPlayersRankOverlay} 
                        ${styles[`topPlayerCard${player.rank}_color_stroke`]}`}>{player.rank}</div>
                            <div className={styles.topPlayerAvatarContainer}>
                                <div className={`${styles.topPlayerAvatarContainerSolo} 
                        ${styles[`topPlayerCard${player.rank}_border_color`]}`}>
                                    <img src={player.avatar} alt="avatar" className={styles.topPlayerAvatar}
                                         onClick={() => window.open(`${player.profileUrl}`, "_blank")}/>
                                </div>
                            </div>

                            <div className={styles.topPlayerNameContainer}>
                                <span className={`${styles.topPlayerName} ${styles[`topPlayerCard${player.rank}_color`]}`} >{player.personaName}</span>
                            </div>

                            <div className={styles.topPlayerRatingContainer}>
                                <div className={styles.topPlayerRating}>{player.rating}</div>
                                <div className={styles.ratingLabel}>Рейтинг</div>
                            </div>
                        </div>
                    ))}
                </div>

                <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                    <tr>
                        <th className={`${styles.cell} ${styles.rankCell}`}>Ранг</th>
                        <th className={`${styles.cell} ${styles.playerCell}`}>Игрок</th>
                        <th className={`${styles.cell} ${styles.ratingCell}`}>Рейтинг</th>
                    </tr>
                    </thead>
                    <tbody className={styles.playersTable}>
                    {remainingPlayers.map((player, index) => (
                        <tr
                            key={index}
                            className={styles.tableRow}
                            onClick={() => window.open(player.profileUrl, '_blank', 'noopener,noreferrer')}
                            role="button"
                            tabIndex={0}
                        >
                            <td className={`${styles.cell} ${styles.rankCellData}`}>
                                <div className={styles.wreathContainer}>
                                    <img src={"/wreath.png"} alt={"wreath"} className={styles.wreathIcon} />
                                    <div className={styles.rankNumber}>{player.rank}</div>
                                </div>
                            </td>

                            <td className={`${styles.cell} ${styles.playerCellData}`}>
                                <div className={styles.playerContainer}>
                                    <img src={player.avatar} alt="avatar" className={styles.avatar} />
                                    <span className={styles.name}>{player.personaName}</span>
                                    <div className={styles.rankOverlay}>{player.rank}</div>
                                </div>
                            </td>

                            <td className={`${styles.cell} ${styles.ratingCellData}`}>
                                <div>{player.rating}</div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };



    const renderArenaPlayers = () => {
        const topArenaPlayers = filteredArenaPlayers.filter(player => Number(player.rank) <= 3);
        const remainingArenaPlayers = filteredArenaPlayers.filter(player => Number(player.rank) > 3);

        return (
            <div className={styles.container_table}>
                <div className={styles.topPlayersContainer}>
                    {topArenaPlayers.map((playerGroup, index) => (
                        <div
                            key={index}
                            className={`${styles.topPlayerCard} ${styles[`topPlayerCard${playerGroup.rank}`]} 
                        ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}
                        ${playerGroup.personaNames.length === 1 ? styles.topPlayerCardMaskSolo :
                                styles.topPlayerCardMaskOther}
                        `}
                        >
                            {/*<div className={`${styles.rainbowIcon} ${styles[`topPlayerCard${playerGroup.rank}_color_fill`]}`}>*/}
                            {/*    <RainbowIcon />*/}
                            {/*</div>*/}

                            {/*<img src={"/rainbow.png"} alt="rainbow" className={styles.rainbowIcon}/>*/}
                            <img src={"/crown.png"} alt="crown" className={styles.crownIcon}/>
                            <div className={`${styles.topPlayersRankOverlay} 
                        ${styles[`topPlayerCard${playerGroup.rank}_color_stroke`]}`}>{playerGroup.rank}</div>
                            <div className={`${styles.topPlayersRank} 
                            ${styles[`topPlayerCard${playerGroup.rank}_color`]}`}>{playerGroup.rank} МЕСТО</div>

                            {playerGroup.personaNames.length === 1 ? (
                                <div className={styles.topPlayerAvatarContainer}>
                                    <div className={`${styles.topPlayerAvatarContainerSolo} 
                        ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}`}>
                                        {playerGroup.avatars.map((avatar, idx) => (
                                            <img key={idx} src={avatar} alt="avatar" className={styles.topPlayerAvatar}
                                                 onClick={() => window.open(`${playerGroup.profileUrls[idx]}`, "_blank")}/>
                                        ))}
                                    </div>
                                </div>

                            ) : (
                                <div className={``}>
                                    {playerGroup.personaNames.length === 2 ? (
                                        playerGroup.avatars.map((avatar, idx) => (
                                            <div
                                                className={`${idx === 0 ? styles.topPlayerFirstAvatarMainContainerDuo :
                                                    styles.topPlayerSecondAvatarMainContainerDuo}
                                                ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}
                                                `}>
                                                <div className={styles.topPlayerAvatarContainer}>
                                                    <div
                                                        className={`${idx === 0 ? styles.topPlayerAvatarContainerDuo : styles.topPlayerAvatarContainerDuo2Player} ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}`}>
                                                        <img key={idx} src={avatar} alt="avatar"
                                                             className={styles.topPlayerAvatar}
                                                             onClick={() => window.open(`${playerGroup.profileUrls[idx]}`, "_blank")}/>
                                                    </div>
                                                </div>

                                                {playerGroup.heroes[idx] && (
                                                    <div className={styles.topPlayerHeroesContainer}>
                                                        <img
                                                            src={`https://cdn.dota2.com/apps/dota2/images/heroes/${playerGroup.heroes[idx].replace(
                                                                "npc_dota_hero_",
                                                                ""
                                                            )}_full.png`}
                                                            onClick={() => handleHeroClick(playerGroup.heroes[idx])}
                                                            alt={playerGroup.heroes[idx]}
                                                            className={`${styles.heroIconTop} ${styles[`heroIcon_border_${playerGroup.rank}`]}`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div>
                                            <div>
                                                <div className={styles.topPlayerAvatarContainer}>
                                                    <div
                                                        className={`${styles.topPlayerAvatarContainerDuo} 
                                                    ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}`}>
                                                        <img key={0} src={playerGroup.avatars[0]} alt="avatar"
                                                             className={styles.topPlayerAvatar}
                                                             onClick={() => window.open(`${playerGroup.profileUrls[0]}`,
                                                                 "_blank")}/>
                                                    </div>
                                                </div>
                                                <div className={styles.topPlayerHeroesContainer}>
                                                    <img
                                                        src={`https://cdn.dota2.com/apps/dota2/images/heroes/${playerGroup.heroes[0].replace(
                                                            "npc_dota_hero_",
                                                            ""
                                                        )}_full.png`}
                                                        alt={playerGroup.heroes[0]}
                                                        onClick={() => handleHeroClick(playerGroup.heroes[0])}
                                                        className={`${styles.heroIconTop} ${styles[`heroIcon_border_${playerGroup.rank}`]}`}
                                                    />
                                                </div>
                                            </div>


                                            <div>
                                                <div
                                                    className={`${styles.topPlayerAvatarMainContainerTrio} ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}`}>
                                                    {playerGroup.avatars.slice(1, 3).map((avatar, idx) => (
                                                        <div className={`${styles.topPlayerAvatarContainerTrio} 
                                                        ${styles[`topPlayerCard${playerGroup.rank}_border_color`]}`}>
                                                            <img key={idx} src={avatar} alt="avatar"
                                                                 className={styles.topPlayerAvatar}
                                                                 onClick={() => window.open(`${playerGroup.profileUrls[idx + 1]}`, "_blank")}/>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className={styles.topPlayerHeroesContainer}>
                                                    {playerGroup.heroes.slice(1, 3).map((hero, idx) => (
                                                        <img
                                                            key={idx + 1}
                                                            src={`https://cdn.dota2.com/apps/dota2/images/heroes/${hero.replace(
                                                                "npc_dota_hero_",
                                                                ""
                                                            )}_full.png`}
                                                            alt={hero}
                                                            onClick={() => handleHeroClick(hero)}
                                                            className={`${styles.heroIconTop} ${styles[`heroIcon_border_${playerGroup.rank}`]}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            )}

                            {playerGroup.personaNames.length === 1 && (
                                <div>
                                    <div className={styles.topPlayerNameContainer} style={{margin: "0.5rem 0 0 0"}}>
                                        {playerGroup.personaNames.map((personaName, idx) => (
                                            <span key={idx}
                                                  className={`${styles.topPlayerName} ${styles[`topPlayerCard${playerGroup.rank}_color`]}`}>{personaName}</span>
                                        ))}
                                    </div>
                                    <div className={styles.topPlayerHeroesContainer}>
                                        <img
                                            src={`https://cdn.dota2.com/apps/dota2/images/heroes/${playerGroup.heroes[0].replace(
                                                "npc_dota_hero_",
                                                ""
                                            )}_full.png`}
                                            alt={playerGroup.heroes[0]}
                                            onClick={() => handleHeroClick(playerGroup.heroes[0])}
                                            className={`${styles.heroIconTop} ${styles[`heroIcon_border_${playerGroup.rank}`]}`}
                                        />
                                    </div>
                                    <div className={`${styles.topPlayerHeroesName} ${styles[`topPlayerCard${playerGroup.rank}_color`]}`}>
                                                  {playerGroup.heroes[0].replace("npc_dota_hero_", "").toUpperCase()}</div>
                                </div>
                            )}
                            <div className={styles.topPlayerRatingContainer}>
                                <div className={styles.topPlayerRating}>{playerGroup.wave_count}</div>
                                <div className={styles.ratingLabel}>Рейтинг</div>
                            </div>
                </div>
                ))}
            </div>
                <div onClick={() =>console.log(openModalIndex)}>1</div>

        <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                    <tr>
                        <th className={`${styles.cell} ${styles.rankCell}`}>Ранг</th>
                        <th className={`${styles.cell} ${styles.playerCell}`}>Игрок</th>
                        <th className={`${styles.cell} ${styles.ratingCell}`}>Герои</th>
                        <th className={`${styles.cell} ${styles.ratingCell}`}>Рейтинг</th>
                    </tr>
                    </thead>
                    <tbody className={styles.playersTable}>
                    {remainingArenaPlayers.map((playerGroup, index) => (
                        <tr
                            key={index}
                            style={arenaGroup !== "1" ? {cursor: 'default'} : undefined}
                            className={styles.tableRow}
                            onClick={() => arenaGroup === "1" ?
                                window.open(playerGroup.profileUrls[0], '_blank', 'noopener,noreferrer') : ''}
                            role="button"
                            tabIndex={0}
                        >
                            <td className={`${styles.cell} ${styles.rankCellData}`}>
                                <div className={styles.wreathContainer}>
                                    <img src={"/wreath.png"} alt={"wreath"} className={styles.wreathIcon}/>
                                    <div className={styles.rankNumber}>{playerGroup.rank}</div>
                                </div>
                            </td>

                            <td className={`${styles.cell} ${styles.playerCellData}`}>
                                {arenaGroup === "1" ? (
                                    playerGroup.personaNames.map((personaName, idx) => (
                                        <div key={idx} className={styles.playerContainer}>
                                            <img src={playerGroup.avatars[idx]} alt="avatar" className={styles.avatar}/>
                                            <span className={styles.name}>{personaName}</span>
                                            <div className={styles.rankOverlay}>{playerGroup.rank}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.playerContainer}>
                                        {playerGroup.avatars.map((avatar, idx) => (
                                            <img key={idx} src={avatar} alt="avatar" className={styles.avatar}
                                                 onClick={() => window.open(`${playerGroup.profileUrls[idx]}`, "_blank")}/>
                                        ))}
                                        <div className={styles.rankOverlay}>{playerGroup.rank}</div>
                                    </div>
                                )}
                            </td>
                            <td className={`${styles.cell} ${styles.heroesCellData}`}>
                                <div>
                                    <div className={styles.heroIcons}
                                         style={playerGroup.heroes.filter(hero => hero).length === 1 ? { display: 'flex' } : {}}>
                                        {playerGroup.heroes
                                            .filter(hero => hero)
                                            .map((hero, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`https://cdn.dota2.com/apps/dota2/images/heroes/${hero.replace(
                                                        "npc_dota_hero_",
                                                        ""
                                                    )}_full.png`}
                                                    alt={hero}
                                                    onClick={() => handleHeroClick(hero)}
                                                    className={`${styles.heroIcon} ${styles.heroIcon_border_table}`}
                                                />
                                            ))}
                                    </div>

                                    {playerGroup.heroes.filter(hero => hero).length > 1 && (
                                        <button onClick={() => handleShowAllHeroes(index)}
                                                className={styles.showAllHeroesButton}>
                                            {openModalIndex === index ? "Скрыть героев" : "Показать героев"}
                                        </button>
                                    )}

                                    {openModalIndex === index && (
                                        <div
                                            className={styles.modalOverlay}
                                        >
                                            <div
                                                className={styles.modalContent}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className={styles.modalHeroesGrid}>
                                                    {playerGroup.heroes
                                                        .filter(hero => hero)
                                                        .map((hero, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={`https://cdn.dota2.com/apps/dota2/images/heroes/${hero.replace(
                                                                    "npc_dota_hero_",
                                                                    ""
                                                                )}_full.png`}
                                                                alt={hero}
                                                                onClick={() => handleHeroClick(playerGroup.heroes[idx])}
                                                                className={styles.modalHeroIcon}
                                                            />
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>

                            <td className={`${styles.cell} ${styles.ratingCellData}`}>
                                <div>{playerGroup.wave_count}</div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
        </table>
            </div>
        );
    };

    return (
        <div className={styles.main_container}>
            <div className={styles.container_leaderboard}>
                <div className={styles.title}>ТАБЛИЦА ЛИДЕРОВ</div>

                <div className={styles.container_navigation} onClick={() => setOpenModalIndex(null)}>
                    <div className={styles.container_filter_navigation}>
                        <div className={styles.title_buttonGroup}>Выбери режим игры:</div>
                        <div className={styles.buttonGroup}>
                            <button
                                className={`${styles.button} ${selectedRating === "rating" ? styles.active : ""}`}
                                onClick={() => handleRatingChange("rating")}
                            >
                                РЕЙТИНГ
                            </button>
                            <button
                                className={`${styles.button} ${selectedRating === "arena" ? styles.active : ""}`}
                                onClick={() => handleRatingChange("arena")}
                            >
                                АРЕНА
                            </button>
                        </div>
                        {selectedRating === "arena" && (
                            <div className={styles.arenaGroup}>
                                <button
                                    className={`${styles.button} ${arenaGroup === "1" ? styles.active : ""}`}
                                    onClick={() => handleArenaGroupChange("1")}
                                >
                                    1
                                </button>
                                <button
                                    className={`${styles.button} ${arenaGroup === "2" ? styles.active : ""}`}
                                    onClick={() => handleArenaGroupChange("2")}
                                >
                                    2
                                </button>
                                <button
                                    className={`${styles.button} ${arenaGroup === "3" ? styles.active : ""}`}
                                    onClick={() => handleArenaGroupChange("3")}
                                >
                                    3
                                </button>
                            </div>
                        )}
                        <div className={styles.search_container}>
                            <SearchIcon className={styles.search_icon}/>
                            <input
                                type="text"
                                placeholder="Поиск игрока..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={styles.search_input}
                            />
                        </div>
                    </div>
                </div>


                <div className={styles.table_container}>
                    {selectedRating === "rating" && <ul className={styles.playerList}>{renderRatingPlayers()}</ul>}

                    {selectedRating === "arena" && (
                        <>

                            {loadingArena ? <div>Loading arena data...</div> :
                                <ul className={styles.playerList}>{renderArenaPlayers()}</ul>}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};
