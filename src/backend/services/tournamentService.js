const path = require('path');
const { readJsonFile } = require('../utils/fileUtils');
const { getPlayersInfoBySteamIds } = require('./playerService');
const fs = require("fs");
const enrichSoloTournament = async (tournamentData, steam_data, stage = "") => {
    const steamIds = tournamentData.players.map(p => p.dota_id.toString());
    const playersInfo = await getPlayersInfoBySteamIds(steamIds, steam_data);

    if (stage === "") {
        const listPlayers = tournamentData.players.map(player => ({
            player_id: player.player_id,
            player_info: {
                player: player.player,
                dota_id: player.dota_id,
                avatar: playersInfo[player.dota_id]?.avatar || null,
                profileUrl: playersInfo[player.dota_id]?.profileUrl || null
            }
        }));
        return { players: listPlayers };
    }

    let updatedPlayers = tournamentData.players.map(player => ({
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

    const mapsWithGroups = tournamentData.maps?.map(map => ({
        map_name: map.map_name,
        groups: map.groups.map(group => ({
            group_name: group.group_name,
            players: group.players.map(p => {
                const idx = updatedPlayers.findIndex(t => t.player_id === p.player_id);
                if (idx !== -1) {
                    updatedPlayers[idx].total_points += p.points;

                    const playerData = updatedPlayers[idx];
                    return {
                        player_id: p.player_id,
                        points: p.points,
                        place: p.place,
                        player_info: playerData.player_info,
                    };
                }
                return null;
            }).filter(Boolean)
        }))
    })) || [];


    const replays = tournamentData.replays?.map(replay => ({
        groups: replay.groups.map(group => ({
            group_name: group.group_name,
            players: group.players.map(p => {
                const idx = updatedPlayers.findIndex(t => t.player_id === p.player_id);
                if (idx !== -1) {
                    updatedPlayers[idx].replays_points += p.points;
                    return {
                        player_id: p.player_id,
                        points: p.points,
                        place: p.place,
                        player_info: {
                            ...updatedPlayers[idx].player_info 
                        },
                    };
                }
                return null;
            }).filter(Boolean)
        }))
    })) || [];

    if (stage.toLowerCase() === "playoffs") {
        const groupTotals = {};

        mapsWithGroups.forEach(map => {
            map.groups.forEach(group => {
                group.players.forEach(playerData => {
                    if (!groupTotals[group.group_name]) groupTotals[group.group_name] = {};
                    if (!groupTotals[group.group_name][playerData.player_id]) groupTotals[group.group_name][playerData.player_id] = 0;
                    groupTotals[group.group_name][playerData.player_id] += playerData.points;
                });
            });
        });
        
        Object.entries(groupTotals).forEach(([groupName, players]) => {
            let maxPoints = Math.max(...Object.values(players));

            let potentialWinners = Object.entries(players)
                .filter(([_, points]) => points === maxPoints)
                .map(([playerId]) => parseInt(playerId));

            let winnerId = potentialWinners[0];

            if (potentialWinners.length > 1) {
                let maxReplayPoints = updatedPlayers.find(p => p.player_id === winnerId).replays_points;

                potentialWinners.forEach(playerId => {
                    const replayPoints = updatedPlayers.find(p => p.player_id === playerId).replays_points;
                    if (replayPoints > maxReplayPoints) {
                        winnerId = playerId;
                        maxReplayPoints = replayPoints;
                    }
                });
            }

            const idx = updatedPlayers.findIndex(p => p.player_id === winnerId);
            if (idx !== -1) {
                updatedPlayers[idx].winner = true;
                updatedPlayers[idx].winner_group = groupName;
            }
        });
    }


    return { players: updatedPlayers, maps: mapsWithGroups, replays };
};

const enrichDuoTournament = async (tournamentData, steam_data, stage) => {
    const steamIds = [];
    tournamentData.teams.forEach(team => {
        steamIds.push(team.dota_id1.toString(), team.dota_id2.toString());
    });

    const playersInfo = await getPlayersInfoBySteamIds(steamIds, steam_data);

    if (stage === "") {
        const listTeams = tournamentData.teams.map(team => ({
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
            }
        }));
        return { teams: listTeams };
    }

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
        replays_points: 0
    }));

    const mapsWithGroups = tournamentData.maps?.map(map => ({
        map_name: map.map_name,
        groups: map.groups.map(group => ({
            group_name: group.group_name,
            teams: group.teams.map(t => {
                const idx = updatedTeams.findIndex(team => team.team_id === t.team_id);
                if (idx !== -1) {
                    updatedTeams[idx].total_points += t.points;
                    return {
                        team_id: t.team_id,
                        points: t.points,
                        place: t.place,
                        team_info: {
                            player1_info: updatedTeams[idx].player1_info,
                            player2_info: updatedTeams[idx].player2_info,
                            total_points: updatedTeams[idx].total_points,
                            replays_points: updatedTeams[idx].replays_points
                        }
                    };
                }
                return null;
            }).filter(Boolean)
        }))
    })) || [];

    const replays = tournamentData.replays?.map(replay => ({
        groups: replay.groups.map(group => ({
            group_name: group.group_name,
            teams: group.teams.map(t => {
                const idx = updatedTeams.findIndex(team => team.team_id === t.team_id);
                if (idx !== -1) {
                    updatedTeams[idx].replays_points += t.points;
                    return {
                        team_id: t.team_id,
                        points: t.points,
                        place: t.place,
                        team_info: {
                            player1_info: updatedTeams[idx].player1_info,
                            player2_info: updatedTeams[idx].player2_info,
                            total_points: updatedTeams[idx].total_points,
                            replays_points: updatedTeams[idx].replays_points
                        }
                    };
                }
                return null;
            }).filter(Boolean)
        }))
    })) || [];

    return { teams: updatedTeams, maps: mapsWithGroups, replays };
};


const processTournamentData = async (dataFile, steamData, stage = "") => {
    const stageSuffix = stage || "";
    const filePath = path.join(__dirname, '../data', `${dataFile}${stageSuffix}.json`);
    const tournamentData = await readJsonFile(filePath);

    if (tournamentData.players) return await enrichSoloTournament(tournamentData, steamData, stage);
    if (tournamentData.teams) return await enrichDuoTournament(tournamentData, steamData, stage);
    return tournamentData;
};

module.exports = { processTournamentData };