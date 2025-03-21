const path = require("path");
const fs = require("fs");
const { getPlayersInfoBySteamIds } = require("../services/playerService");

exports.getTournamentList = async (req, res) => {
    const filePath = path.join(__dirname, "../data/tournamentPlayersDuo.json");

    fs.readFile(filePath, "utf8", async (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Ошибка при загрузке игроков" });
        }

        try {
            let tournamentData = JSON.parse(data);
            let steamIds = [];
            
            tournamentData.teams.forEach(team => {
                steamIds.push(team.dota_id1.toString());
                steamIds.push(team.dota_id2.toString());
            });
            
            const playersInfo = await getPlayersInfoBySteamIds(steamIds);
            
            tournamentData.teams = tournamentData.teams.map(team => ({
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
                }
            }));

            res.json(tournamentData);
        } catch (error) {
            console.error("Ошибка обработки данных:", error);
            res.status(500).json({ error: "Ошибка при обработке данных" });
        }
    });
};

exports.getTournamentQualifiers = async (req, res) => {
    const filePath = path.join(__dirname, "../data/tournamentPlayersDuoQualifiers.json");

    fs.readFile(filePath, "utf8", async (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Ошибка при загрузке игроков" });
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
            const playersInfo = await getPlayersInfoBySteamIds(steamIds);

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
                total_points: 0 // Начальное значение очков
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
                                points: teamData.points
                            };
                        }
                        return null;
                    }).filter(team => team !== null)
                }))
            }));

            res.json({ teams: updatedTeams, maps: mapsWithGroups });
        } catch (error) {
            console.error("Ошибка обработки данных:", error);
            res.status(500).json({ error: "Ошибка при обработке данных" });
        }
    });
};


