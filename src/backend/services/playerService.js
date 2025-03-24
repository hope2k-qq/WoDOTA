const axios = require('axios');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getPlayersInfoBySteamIds = async (friendshipCodes) => {
    const apiKey = process.env.STEAM_API_KEY;
    const playerInfo = {};
    const chunkSize = 50;
    const maxConcurrentRequests = 5;

    const { default: pLimit } = await import('p-limit');
    const limit = pLimit(maxConcurrentRequests);

    const steamIds = friendshipCodes.map(code => (BigInt(code) + BigInt(76561197960265728)).toString());

    const chunks = [];
    for (let i = 0; i < steamIds.length; i += chunkSize) {
        chunks.push(steamIds.slice(i, i + chunkSize));
    }

    const promises = [];
    
    const fetchWithRetry = async (url) => {
        let retries = 5; 
        let success = false;

        while (!success && retries > 0) {
            try {
                const response = await axios.get(url);
                
                if (response.data.response.players.length > 0) {
                    return response.data;
                }
                success = true; 
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    console.log('Rate limit exceeded, retrying...');
                    await delay(1500);
                    retries--;
                } else {
                    console.error('Error fetching data from Steam API:', error.message);
                    break;
                }
            }
        }

        return null;
    };

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const steamIdsString = chunk.join(',');
        
        promises.push(limit(async () => {
            const url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamIdsString}`;
            const responseData = await fetchWithRetry(url);

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
        }));
    }

    await Promise.all(promises);
    return playerInfo;
};

module.exports = {
    getPlayersInfoBySteamIds
};
