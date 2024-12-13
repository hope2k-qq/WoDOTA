const axios = require('axios');

const getPlayersInfoBySteamIds = async (friendshipCodes) => {
    const apiKey = process.env.STEAM_API_KEY;
    const playerInfo = {};

    const chunkSize = 50;
    const promises = [];

    const steamIds = friendshipCodes.map(code => (BigInt(code) + BigInt(76561197960265728)).toString());


    for (let i = 0; i < steamIds.length; i += chunkSize) {
        const chunk = steamIds.slice(i, i + chunkSize);
        const steamIdsString = chunk.join(',');

        promises.push(
            axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamIdsString}`)
                .then(response => {
                    if (response.data.response.players.length === 0) {
                        return;
                    }

                    response.data.response.players.forEach(player => {
                        const friendCode = (BigInt(player.steamid) - BigInt(76561197960265728)).toString();
                        playerInfo[friendCode] = {
                            avatar: player.avatar,
                            profileUrl: player.profileurl
                        };
                    });
                })
                .catch(error => {
                    console.error('Error fetching data from Steam API:', error.message);
                })
        );
    }

    await Promise.all(promises);

    return playerInfo;
};

module.exports = {
    getPlayersInfoBySteamIds
};