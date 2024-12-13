const playerService = require('../services/playerService');
const apiService = require('../services/apiService');

const getRating = async (req, res) => {
    try {
        console.log('Fetching fresh rating data');
        const playersData = await apiService.fetchRatingData();
        const steamIds = playersData.map(player => player.steamid);
        const playersInfo = await playerService.getPlayersInfoBySteamIds(steamIds);

        const players = playersData.map(player => {
            const playerDetails = playersInfo[player.steamid] || { avatar: null, profileUrl: null };
            return {
                steamid: player.steamid,
                rating: player.rating,
                avatar: playerDetails.avatar,
                profileUrl: playerDetails.profileUrl
            };
        });

        res.json(players);
    } catch (error) {
        console.error('Error fetching rating data:', error.message);
        res.status(500).send('Error fetching data');
    }
};

const getArena = async (req, res) => {
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
                        profileUrls: []
                    });
                });
            }
        });

        const friendCodesArray = Array.from(allFriendCodes);
        const playerDetails = await playerService.getPlayersInfoBySteamIds(friendCodesArray);

        Object.keys(playersByKey).forEach(key => {
            playersByKey[key].forEach(playerGroup => {
                playerGroup.steamids.forEach(steamid => {
                    const details = playerDetails[steamid] || { avatar: null, profileUrl: null };
                    playerGroup.avatars.push(details.avatar);
                    playerGroup.profileUrls.push(details.profileUrl);
                });
            });
        });

        res.json(playersByKey);
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
        res.status(500).send('Error fetching data');
    }
};

module.exports = {
    getRating,
    getArena
};
