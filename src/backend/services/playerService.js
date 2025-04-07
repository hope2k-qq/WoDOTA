const axios = require('axios');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getPlayersInfoBySteamIds = async (friendshipCodes) => {
    const apiKey = process.env.STEAM_API_KEY;
    const playerInfo = {};
    const chunkSize = 50
    const chunksPerBatch = 50;
    const batchDelay = 2000;

    const steamIds = friendshipCodes.map(code => (BigInt(code) + BigInt(76561197960265728)).toString());

    const chunks = [];
    for (let i = 0; i < steamIds.length; i += chunkSize) {
        chunks.push(steamIds.slice(i, i + chunkSize));
    }

    const fetchOnce = async (url) => {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.warn('Rate limit exceeded — skipping this chunk.');
            } else {
                console.error('Error fetching data from Steam API:', error.message);
            }
            return null;
        }
    };

    for (let i = 0; i < chunks.length; i += chunksPerBatch) {
        const batchChunks = chunks.slice(i, i + chunksPerBatch);

        for (const chunk of batchChunks) {
            const steamIdsString = chunk.join(',');
            const url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamIdsString}`;
            const responseData = await fetchOnce(url);

            if (responseData) {
                responseData.response.players.forEach(player => {
                    const friendCode = (BigInt(player.steamid) - BigInt(76561197960265728)).toString();
                    playerInfo[friendCode] = {
                        avatar: player.avatarfull,
                        personaName: player.personaname,
                        profileUrl: player.profileurl,
                    };
                });
            }
        }

        if (i + chunksPerBatch < chunks.length) {
            await delay(batchDelay);
        }
    }

    return playerInfo;
};

module.exports = {
    getPlayersInfoBySteamIds
};
