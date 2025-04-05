const playerService = require('../services/playerService');
const apiService = require('../services/apiService');


let cachedRatingData = null;
let cachedArenaData = null;
let updating = false;

const updateRatingData = async (app) => {
    try {
        console.log('Fetching fresh rating data');

        const playersData = await apiService.fetchRatingData();

        const steamIds = playersData.map(player => player.steamid);
        const playersInfo = await playerService.getPlayersInfoBySteamIds(steamIds);

        const players = playersData.map((player, index) => {
            const playerDetails = playersInfo[player.steamid] || { avatar: null, profileUrl: null, personaName: null };

            return {
                steamid: player.steamid,
                rating: player.rating,
                avatar: playerDetails.avatar,
                profileUrl: playerDetails.profileUrl,
                personaName: playerDetails.personaName,
                rank: index + 1
            };
        });
        
        cachedRatingData = players;
        console.log('Rating data updated');
        const collection = app;
        const currentDate = new Date().toISOString();

        await collection.updateOne(
            { loc: 'https://wodota.pro/leaderboard' },
            {
                $set: {
                    lastmod: currentDate,
                }
            }
        );
    } catch (error) {
        console.error('Error fetching rating data:', error.message);
    } finally {
        updating = false; 
    }
};

const updateArenaData = async (app) => {
    try {
        console.log('Fetching fresh arena data');
        const playersData = await apiService.fetchArenaData();
        const playersByKey = {};
        const allFriendCodes = new Set();

        Object.keys(playersData).forEach(key => {
            const playersArray = playersData[key];
            if (playersArray) {
                playersByKey[key] = [];

                playersArray.forEach(entry => {
                    const friendCodes = [entry.p1, entry.p2, entry.p3, entry.p4].filter(id => id !== "0");
                    friendCodes.forEach(code => allFriendCodes.add(code));

                    playersByKey[key].push({
                        steamids: friendCodes,
                        wave_count: entry.wave_count,
                        heroes: [entry.hero_1, entry.hero_2, entry.hero_3],
                        avatars: [],
                        profileUrls: [],
                        personaNames: [],
                        rank: 0
                    });
                });
            }
        });

        const friendCodesArray = Array.from(allFriendCodes);
        const playerDetails = await playerService.getPlayersInfoBySteamIds(friendCodesArray);

        Object.keys(playersByKey).forEach(key => {
            playersByKey[key].forEach(playerGroup => {
                playerGroup.steamids.forEach(steamid => {
                    const details = playerDetails[steamid] || { avatar: null, profileUrl: null, personaName: null };
                    playerGroup.avatars.push(details.avatar);
                    playerGroup.profileUrls.push(details.profileUrl);
                    playerGroup.personaNames.push(details.personaName);
                });
            });

            playersByKey[key].sort((a, b) => b.wave_count - a.wave_count);

            playersByKey[key].forEach((playerGroup, index) => {
                playerGroup.rank = index + 1;
            });
        });
        
        cachedArenaData = playersByKey;
        console.log('Arena data updated');
        const collection = app;
        const currentDate = new Date().toISOString();

        await collection.updateOne(
            { loc: 'https://wodota.pro/leaderboard' },
            {
                $set: {
                    lastmod: currentDate,
                }
            }
        );
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
    } finally {
        updating = false;
    }
};

const updateDataSequentially = async (app) => {
    if (updating) return;

    updating = true;

    try {
        await updateRatingData(app);
        await updateArenaData(app);

    } catch (error) {
        console.error('Error updating data sequentially:', error.message);
    } finally {
        updating = false;
    }
};


const getRating = (req, res) => {
    if (cachedRatingData) {
        res.json(cachedRatingData);
    } else {
        res.json([]);
    }
};

const getArena = (req, res) => {
    if (cachedArenaData) {
        res.json(cachedArenaData);
    } else {
        res.json({});
    }
};

module.exports = {
    updateDataSequentially,
    getRating,
    getArena
};
