const playerService = require('../services/playerService');
const apiService = require('../services/apiService');
const ratingTestData = require('../data/ratingTestData.json');

const getRating = async (req, res) => {
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

        // Отправляем ответ с данными игроков
        res.json(players);
    } catch (error) {
        console.error('Error fetching rating data:', error.message);
        res.status(500).send('Error fetching data');
    }
};

// const getRating = async (req, res) => {
//     try {
//         console.log('Fetching fresh rating data');
//         const testPlayer = ratingTestData;
//
//
//         res.json(testPlayer);
//     } catch (error) {
//         console.error('Error fetching rating data:', error.message);
//         res.status(500).send('Error fetching data');
//     }
// };

// const getArena = async (req, res) => {
//     try {
//         console.log('Fetching fresh rating data');
//         const testPlayer = ratingTestData;
//
//
//         res.json(testPlayer);
//     } catch (error) {
//         console.error('Error fetching rating data:', error.message);
//         res.status(500).send('Error fetching data');
//     }
// };

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

        res.json(playersByKey);
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
        res.status(500).send('Error fetching data');
    }
};

// const getArena = async (req, res) => {
//     try {
//         console.log('Returning mock arena data');
//
//         const mockData = {
//             "1": Array.from({ length: 150 }, (_, i) => ({
//                 steamids: ["1017237020"],
//                 wave_count: 25 + i,
//                 heroes: ["npc_dota_hero_axe"],
//                 avatars: ["https://avatars.steamstatic.com/3aafedd8ebb706ea1dbc9f4baed1595eaad69db8_full.jpg"],
//                 profileUrls: ["https://steamcommunity.com/id/hope2k-/"],
//                 personaNames: ["hope2k"],
//                 rank: i + 1
//             })),
//             "2": Array.from({ length: 150 }, (_, i) => ({
//                 steamids: ["1017237020", "1602096619"],
//                 wave_count: 25 + i,
//                 heroes: ["npc_dota_hero_axe", "npc_dota_hero_slark"],
//                 avatars: ["https://avatars.steamstatic.com/3aafedd8ebb706ea1dbc9f4baed1595eaad69db8_full.jpg", "https://avatars.steamstatic.com/43373d024b67cc77935ec69e00d1aa263d5827c0_full.jpg"],
//                 profileUrls: ["https://steamcommunity.com/id/hope2k-/", "https://steamcommunity.com/profiles/76561199562362347/"],
//                 personaNames: ["瑰ルfailrun瑰ル", "tv/zaqual"],
//                 rank: i + 1
//             })),
//             "3": Array.from({ length: 150 }, (_, i) => ({
//                 steamids: ["1017237020", "1602096619", "120897386"],
//                 wave_count: 25 + i,
//                 heroes: ["npc_dota_hero_axe", "npc_dota_hero_slark", "npc_dota_hero_pudge"],
//                 avatars: ["https://avatars.steamstatic.com/3aafedd8ebb706ea1dbc9f4baed1595eaad69db8_full.jpg", "https://avatars.steamstatic.com/43373d024b67cc77935ec69e00d1aa263d5827c0_full.jpg", "https://avatars.steamstatic.com/e653f3a7d1034c1b453262b5170acbfce0bc3e13_full.jpg"],
//                 profileUrls: ["https://steamcommunity.com/id/hope2k-/", "https://steamcommunity.com/profiles/76561199562362347/", "https://steamcommunity.com/profiles/76561198081163114/"],
//                 personaNames: ["瑰ルfailrun瑰ル", "tv/zaqual", "SoL.Rampage.VoR"],
//                 rank: i + 1
//             })),
//         };
//
//         res.json(mockData);
//     } catch (error) {
//         console.error('Error returning mock arena data:', error.message);
//         res.status(500).send('Error fetching data');
//     }
// };




module.exports = {
    getRating,
    getArena
};
