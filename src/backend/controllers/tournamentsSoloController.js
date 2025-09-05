const path = require("path");
const fs = require("fs");
const { getPlayersInfoBySteamIds } = require("../services/playerService");

let cachedTournamentListSoloData  = null;
let cachedTournamentQualifiersSoloData  = null;
let cachedTournamentPlayoffsSoloData  = null;
let cachedTournamentFinalSolo  = null;
let updating = false;

const updateTournamentListSoloData = async (app, steam_data) => {
    try {
        const filePath = path.join(__dirname, "../data/tournamentPlayersSolo.json");
        
        const data = await fs.promises.readFile(filePath, "utf8");
        let tournamentData = JSON.parse(data);
        
        const steamIds = tournamentData.players.map(player => player.dota_id.toString());
        const playersInfo = await getPlayersInfoBySteamIds(steamIds, steam_data);
        tournamentData.players = tournamentData.players.map(player => ({
            player_info: {
                player: player.player,
                dota_id: player.dota_id,
                avatar: playersInfo[player.dota_id]?.avatar || null,
                profileUrl: playersInfo[player.dota_id]?.profileUrl || null
            }
        }));

        cachedTournamentListSoloData = tournamentData;
        console.log('Tournament list data updated');

        const collection = app;
        const currentDate = new Date().toISOString();

        await collection.updateOne(
            { loc: 'https://wodota.pro/tournament' },
            {
                $set: { lastmod: currentDate }
            }
        );

    } catch (error) {
        console.error("Error in updateTournamentListSoloData:", error);
    } finally {
        updating = false;
    }
};

const updateTournamentQualifiersSoloData = async (app, steam_data) => {
    try {
        const filePath = path.join(__dirname, "../data/tournamentPlayersSoloQualifiers.json");

        fs.readFile(filePath, "utf8", async (err, data) => {
            if (err) {
                console.error("Ошибка при загрузке игроков:", err);
                return;
            }

            try {
                let tournamentData = JSON.parse(data);
                let steamIds = [];

                tournamentData.players.forEach(player => {
                    steamIds.push(player.dota_id.toString());
                });

                const playersInfo = await getPlayersInfoBySteamIds(steamIds, steam_data);

                let updatedTeams = tournamentData.players.map(player => ({
                    player_id: player.player_id,
                    player_info: {
                        player: player.player,
                        dota_id: player.dota_id,
                        avatar: playersInfo[player.dota_id]?.avatar || null,
                        profileUrl: playersInfo[player.dota_id]?.profileUrl || null
                    },
                    total_points: 0,
                    replays_points: 0
                }));

                let mapsWithGroups = tournamentData.maps.map(map => ({
                    map_name: map.map_name,
                    groups: map.groups.map(group => ({
                        group_name: group.group_name,
                        teams: group.teams.map(teamData => {
                            const teamIndex = updatedTeams.findIndex(t => t.team_id === teamData.team_id);
                            if (teamIndex !== -1) {
                                updatedTeams[teamIndex].total_points += teamData.points;

                                return {
                                    team_id: teamData.team_id,
                                    team_info: updatedTeams[teamIndex],
                                    points: teamData.points,
                                    place: teamData.place
                                };
                            }
                            return null;
                        }).filter(team => team !== null)
                    }))
                }));

                let replays = tournamentData.replays
                    ? tournamentData.replays.map(replay => ({
                        groups: replay.groups.map(group => ({
                            group_name: group.group_name,
                            teams: group.teams.map(teamData => {
                                const teamIndex = updatedTeams.findIndex(t => t.team_id === teamData.team_id);
                                if (teamIndex !== -1) {
                                    updatedTeams[teamIndex].replays_points += teamData.points;

                                    return {
                                        team_id: teamData.team_id,
                                        points: teamData.points,
                                        team_info: updatedTeams[teamIndex],
                                        place: teamData.place
                                    };
                                }
                                return null;
                            }).filter(team => team !== null)
                        }))
                    }))
                    : [];
                cachedTournamentQualifiersSoloData = ({ teams: updatedTeams, maps: mapsWithGroups, replays });
                console.log('Tournament qualifiers data updated');
                const collection = app;
                const currentDate = new Date().toISOString();

                await collection.updateOne(
                    { loc: 'https://wodota.pro/tournament' },
                    {
                        $set: {
                            lastmod: currentDate,
                        }
                    }
                );
            } catch (error) {
                console.error("Error processing tournament data:", error);
            }
        });
    } catch (error) {
        console.error("Error in updateTournamentListData:", error);
    } finally {
        updating = false;
    }
};

const updateTournamentPlayoffsSoloData = async (app, steam_data) => {
    try {
        const filePath = path.join(__dirname, "../data/tournamentPlayersDuoPlayoffs.json");

        fs.readFile(filePath, "utf8", async (err, data) => {
            if (err) {
                console.error("Ошибка при загрузке игроков:", err);
                return;
            }

            try {
                let tournamentData = JSON.parse(data);
                let steamIds = [];

                // Собираем ID игроков
                tournamentData.teams.forEach(team => {
                    steamIds.push(team.dota_id1.toString());
                    steamIds.push(team.dota_id2.toString());
                });

                // Получаем информацию о игроках
                const playersInfo = await getPlayersInfoBySteamIds(steamIds, steam_data);

                // Преобразуем команды, добавляя информацию об игроках
                let updatedTeams = tournamentData.teams.map(team => ({
                    team_id: team.team_id,
                    player1_info: {
                        player1: team.player1,
                        dota_id1: team.dota_id1,
                        avatar: playersInfo[team.dota_id1]?.avatar || null,
                        profileUrl: playersInfo[team.dota_id1]?.profileUrl || null
                    },
                    player2_info: {
                        player2: team.player2,
                        dota_id2: team.dota_id2,
                        avatar: playersInfo[team.dota_id2]?.avatar || null,
                        profileUrl: playersInfo[team.dota_id2]?.profileUrl || null
                    },
                    total_points: 0,
                    replays_points: 0,
                }));

                // Создаём массив карт с группами внутри
                let mapsWithGroups = tournamentData.maps.map(map => ({
                    map_name: map.map_name,
                    groups: map.groups.map(group => ({
                        group_name: group.group_name,
                        teams: group.teams.map(teamData => {
                            const teamIndex = updatedTeams.findIndex(t => t.team_id === teamData.team_id);
                            if (teamIndex !== -1) {
                                updatedTeams[teamIndex].total_points += teamData.points;

                                return {
                                    team_id: teamData.team_id,
                                    team_info: updatedTeams[teamIndex],
                                    points: teamData.points,
                                    place: teamData.place
                                };
                            }
                            return null;
                        }).filter(team => team !== null)
                    }))
                }));

                let replays = tournamentData.replays
                    ? tournamentData.replays.map(replay => ({
                        groups: replay.groups.map(group => ({
                            group_name: group.group_name,
                            teams: group.teams.map(teamData => {
                                const teamIndex = updatedTeams.findIndex(t => t.team_id === teamData.team_id);
                                if (teamIndex !== -1) {
                                    // Добавляем очки из переигровок
                                    updatedTeams[teamIndex].replays_points += teamData.points;

                                    return {
                                        team_id: teamData.team_id,
                                        points: teamData.points,
                                        team_info: updatedTeams[teamIndex],
                                        place: teamData.place
                                    };
                                }
                                return null;
                            }).filter(team => team !== null)
                        }))
                    }))
                    : [];

                cachedTournamentPlayoffsData = ({ teams: updatedTeams, maps: mapsWithGroups, replays });
                console.log('Tournament playoffs data updated');
                const collection = app;
                const currentDate = new Date().toISOString();

                await collection.updateOne(
                    { loc: 'https://wodota.pro/tournament' },
                    {
                        $set: {
                            lastmod: currentDate,
                        }
                    }
                );
            } catch (error) {
                console.error("Error processing tournament data:", error);
            }
        });
    } catch (error) {
        console.error("Error in updateTournamentListData:", error);
    } finally {
        updating = false;
    }
};

const updateTournamentFinalSoloData = async (app, steam_data) => {
    try {
        const filePath = path.join(__dirname, "../data/tournamentPlayersDuoFinal.json");

        fs.readFile(filePath, "utf8", async (err, data) => {
            if (err) {
                console.error("Ошибка при загрузке игроков:", err);
                return;
            }

            try {
                let tournamentData = JSON.parse(data);
                let steamIds = [];

                // Собираем ID игроков
                tournamentData.teams.forEach(team => {
                    steamIds.push(team.dota_id1.toString());
                    steamIds.push(team.dota_id2.toString());
                });

                // Получаем информацию о игроках
                const playersInfo = await getPlayersInfoBySteamIds(steamIds, steam_data);

                // Преобразуем команды, добавляя информацию об игроках
                let updatedTeams = tournamentData.teams.map(team => ({
                    team_id: team.team_id,
                    player1_info: {
                        player1: team.player1,
                        dota_id1: team.dota_id1,
                        avatar: playersInfo[team.dota_id1]?.avatar || null,
                        profileUrl: playersInfo[team.dota_id1]?.profileUrl || null
                    },
                    player2_info: {
                        player2: team.player2,
                        dota_id2: team.dota_id2,
                        avatar: playersInfo[team.dota_id2]?.avatar || null,
                        profileUrl: playersInfo[team.dota_id2]?.profileUrl || null
                    },
                    total_points: 0,
                    replays_points: 0,
                }));

                // Создаём массив карт с группами внутри
                let mapsWithGroups = tournamentData.maps.map(map => ({
                    map_name: map.map_name,
                    groups: map.groups.map(group => ({
                        group_name: group.group_name,
                        teams: group.teams.map(teamData => {
                            const teamIndex = updatedTeams.findIndex(t => t.team_id === teamData.team_id);
                            if (teamIndex !== -1) {
                                updatedTeams[teamIndex].total_points += teamData.points;

                                return {
                                    team_id: teamData.team_id,
                                    team_info: updatedTeams[teamIndex],
                                    points: teamData.points,
                                    place: teamData.place
                                };
                            }
                            return null;
                        }).filter(team => team !== null)
                    }))
                }));

                let replays = tournamentData.replays
                    ? tournamentData.replays.map(replay => ({
                        groups: replay.groups.map(group => ({
                            group_name: group.group_name,
                            teams: group.teams.map(teamData => {
                                const teamIndex = updatedTeams.findIndex(t => t.team_id === teamData.team_id);
                                if (teamIndex !== -1) {
                                    // Добавляем очки из переигровок
                                    updatedTeams[teamIndex].replays_points += teamData.points;

                                    return {
                                        team_id: teamData.team_id,
                                        points: teamData.points,
                                        team_info: updatedTeams[teamIndex],
                                        place: teamData.place
                                    };
                                }
                                return null;
                            }).filter(team => team !== null)
                        }))
                    }))
                    : [];

                cachedTournamentFinal = ({ teams: updatedTeams, maps: mapsWithGroups, replays });
                console.log('Tournament final data updated');
                const collection = app;
                const currentDate = new Date().toISOString();

                await collection.updateOne(
                    { loc: 'https://wodota.pro/tournament' },
                    {
                        $set: {
                            lastmod: currentDate,
                        }
                    }
                );
            } catch (error) {
                console.error("Error processing tournament data:", error);
            }
        });
    } catch (error) {
        console.error("Error in updateTournamentListData:", error);
    } finally {
        updating = false;
    }
};
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const updateDataSequentiallyTournament = async (app, steam_data) => {
    if (updating) return;

    updating = true;

    try {
        await updateTournamentListSoloData(app, steam_data);
        await delay(3000);
        await updateTournamentQualifiersSoloData(app, steam_data);
        await delay(3000);
        await updateTournamentPlayoffsSoloData(app, steam_data);
        await delay(3000);
        await updateTournamentFinalSoloData(app, steam_data);
        await delay(3000);
    } catch (error) {
        console.error('Error updating data sequentially:', error.message);
    } finally {
        updating = false;
    }
}

const getTournamentListSolo = (req, res) => {
    if (cachedTournamentListSoloData) {
        res.json(cachedTournamentListSoloData);
    } else {
        res.json([]);
    }
};

const getTournamentQualifiersSolo = (req, res) => {
    if (cachedTournamentQualifiersSoloData) {
        res.json(cachedTournamentQualifiersSoloData);
    } else {
        res.json([]);
    }
};

const getTournamentPlayoffsSolo = (req, res) => {
    if (cachedTournamentPlayoffsSoloData) {
        res.json(cachedTournamentPlayoffsSoloData);
    } else {
        res.json([]);
    }
};
const getTournamentFinalSolo = (req, res) => {
    if (cachedTournamentFinalSolo) {
        res.json(cachedTournamentFinalSolo);
    } else {
        res.json([]);
    }
};

module.exports = {
    updateDataSequentiallyTournament,
    getTournamentListSolo,
    getTournamentQualifiersSolo,
    getTournamentPlayoffsSolo,
    getTournamentFinalSolo,
};


