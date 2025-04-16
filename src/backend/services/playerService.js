const axios = require('axios');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const STEAM_BASE_ID = BigInt('76561197960265728');
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

const getPlayersInfoBySteamIds = async (friendshipCodes, steamCollection) => {
    const apiKey = process.env.STEAM_API_KEY;
    const playerInfo = {};
    const chunkSize = 50;

    const steamIds = friendshipCodes.map(code => (BigInt(code) + STEAM_BASE_ID).toString());
    const now = Date.now();
    
    const cachedPlayers = await steamCollection.find({
        steamid: { $in: steamIds },
        updatedAt: { $gt: new Date(now - MAX_AGE_MS) }
    }).toArray();

    const foundSteamIds = new Set();
    cachedPlayers.forEach(player => {
        const friendCode = (BigInt(player.steamid) - STEAM_BASE_ID).toString();
        playerInfo[friendCode] = {
            avatar: player.avatar,
            personaName: player.personaName,
            profileUrl: player.profileUrl
        };
        foundSteamIds.add(player.steamid);
    });

    console.log(`[MongoDB] Found ${cachedPlayers.length} cached users in DB`);

    const steamIdsToFetch = steamIds.filter(id => !foundSteamIds.has(id));
    console.log(`[API Fetch] Need to fetch ${steamIdsToFetch.length} users from Steam API`);

    const chunks = [];
    for (let i = 0; i < steamIdsToFetch.length; i += chunkSize) {
        chunks.push(steamIdsToFetch.slice(i, i + chunkSize));
    }

    const fetchOnce = async (url) => {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.warn('Rate limit exceeded — skipping this chunk.');
            } else {
                console.error('Error fetching Steam API:', error.message);
            }
            return null;
        }
    };
    
    for (const chunk of chunks) {
        const steamIdsString = chunk.join(',');
        const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamIdsString}`;
        const responseData = await fetchOnce(url);

        if (responseData) {
            const playersToInsert = [];

            responseData.response.players.forEach(player => {
                const friendCode = (BigInt(player.steamid) - STEAM_BASE_ID).toString();
                const entry = {
                    steamid: player.steamid,
                    avatar: player.avatarfull,
                    personaName: player.personaname,
                    profileUrl: `https://steamcommunity.com/profiles/${player.steamid}`,
                    updatedAt: new Date()
                };

                playerInfo[friendCode] = {
                    avatar: entry.avatar,
                    personaName: entry.personaName,
                    profileUrl: entry.profileUrl
                };

                playersToInsert.push(entry);
            });

            const bulkOps = playersToInsert.map(player => ({
                updateOne: {
                    filter: { steamid: player.steamid },
                    update: { $set: player },
                    upsert: true
                }
            }));

            await steamCollection.bulkWrite(bulkOps);
            console.log(`[MongoDB] Updated ${playersToInsert.length} users in DB`);
        }
        
        await delay(2000);
    }

    return playerInfo;
};

module.exports = {
    getPlayersInfoBySteamIds
};
