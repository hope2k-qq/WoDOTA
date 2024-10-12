const luaparse = require('luaparse');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const app = express();
const path = require('path');
const apicache = require('apicache');
const port = 5000;
const cache = apicache.middleware;

app.use(cors());

const replacements = {
    'arc_warden': 'roshan',
    'chen': 'creep',
    'meepo': 'aghanim',
    'skeleton_king': 'wraith_king',
};

let herotalents = null;

try {
    const data = fs.readFileSync('./talents.lua', 'utf8');
    
    const parsedLua = luaparse.parse(data);
    
    parsedLua.body.forEach(node => {
        if (node.type === 'LocalStatement') {
            node.variables.forEach(variable => {
                if (variable.name === 'herotalents') {
                    herotalents = node.init[0];
                }
            });
        }
    });

    if (!herotalents) {
        throw new Error('No herotalents found in talents.lua');
    }

    const processHerotalents = (talents) => {
        const result = {};
        talents.fields.forEach(heroField => {
            const heroName = heroField.key.raw.replace(/"/g, '').replace('npc_dota_hero_', '');
            result[heroName] = {};
            heroField.value.fields.forEach(levelField => {
                const level = levelField.key.value;
                result[heroName][level] = {};
                levelField.value.fields.forEach(talentField => {
                    const talentIndex = talentField.key.value;
                    const talentDetails = (talentField.value.fields || []).map(talentDetail => {
                        if (!talentDetail.value.fields) {
                            console.log(`No fields in talentDetail for talentIndex ${talentIndex} at level ${level} for hero ${heroName}`);
                            return [];
                        }
                        
                        return talentDetail.value.fields.map(detail => {
                            if (detail.value && detail.value.fields) {
                                const subDetails = detail.value.fields.map(subDetail => {
                                    if (subDetail.value) {
                                        const rawValue = subDetail.value.raw || subDetail.value.value;
                                        return rawValue.replace(/"/g, '');
                                    } else if (subDetail.raw) {
                                        return subDetail.raw.replace(/"/g, '');
                                    } else {
                                        console.log(`Unhandled subDetail structure: ${JSON.stringify(subDetail)}`);
                                        return null;
                                    }
                                });
                                return `{${subDetails.join(', ')}}`;
                            } else if (detail.value) {
                                const rawValue = detail.value.raw || detail.value.value;
                                return rawValue.replace(/"/g, '');
                            } else if (detail.raw) {
                                return detail.raw.replace(/"/g, '');
                            } else {
                                console.log(`Unhandled detail structure: ${JSON.stringify(detail)}`);
                                return null;
                            }
                        }).join(', ');
                    }).flat();
                    
                    result[heroName][level][talentIndex] = talentDetails;
                });
            });
        });
        return result;
    };
    
    herotalents = processHerotalents(herotalents);
    
    Object.keys(replacements).forEach(oldName => {
        const newName = replacements[oldName];
        if (herotalents[oldName]) {
            const oldIndex = Object.keys(herotalents).indexOf(oldName);
            if (oldIndex !== -1) {
                const aghanimTalents = herotalents[oldName];
                delete herotalents[oldName];
                const heroNames = Object.keys(herotalents);
                heroNames.splice(oldIndex, 0, newName);
                herotalents = heroNames.reduce((acc, name) => {
                    acc[name] = name === newName ? aghanimTalents : herotalents[name];
                    return acc;
                }, {});
            }
        }
    });
    

} catch (error) {
    console.error('Error parsing Lua:', error);
}

function parseAddonFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const jsonData = {};
        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('"').trim();
                
                value = value.replace(/<\/?b>/g, '');
                
                const colorRegex = /<font color=['"]?([^'"]+)['"]?>(.*?)<\/font>/g;
                value = value.replace(colorRegex, (match, color, text) => {
                    return `{ "text": "${text}", "color": "${color}" }`;
                });
                
                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');

                jsonData[key] = value;
            }
        });

        return jsonData;
    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}


const filePath = path.join(__dirname, 'assets', 'addon_russian.txt');

try {
    const jsonData = parseAddonFile(filePath);
} catch (error) {
    console.error(error);
}

app.get('/hero/:id', (req, res) => {
    const heroName = req.params.id;
    
    if (!herotalents) {
        res.json({ error: 'Talents data not loaded yet' });
    } else {
        const heroTalents = herotalents[heroName];
        if (heroTalents) {
            res.json(heroTalents);
        } else {
            res.status(404).json({ error: 'Hero not found' });
        }
    }
});

app.get('/heroes', (req, res) => {
    if (!herotalents) {
        res.json({ error: 'Talents data not loaded yet' });
    } else {
        const heroNames = Object.keys(herotalents).sort();;
        res.json(heroNames);
    }
});

app.get('/text_data', (req, res) => {
    const filePath = path.join(__dirname, 'assets', 'addon_russian.txt');
    try {
        const jsonData = parseAddonFile(filePath);
        res.json(jsonData);
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const RATING_CACHE_DURATION = '10 minutes';
const ARENA_CACHE_DURATION = '10 minutes';
const VOTES_CACHE_DURATION = '30 minutes';
app.get('/leaderboard_rating', cache(RATING_CACHE_DURATION), async (req, res) => {
    try {
        let playersData;
        let playersInfo = {};
        
        const fetchRatingData = async () => {
            console.log('Fetching fresh rating data');
            const response = await axios.get('https://data.worldofdota.net/data/get_top_rating_150.php');
            return response.data;
        };
        
        const fetchPlayersInfo = async (steamIds) => {
            console.log('Fetching avatars from Steam API');
            return await getPlayersInfoBySteamIds(steamIds);
        };
        
        playersData = await fetchRatingData();
        const steamIds = playersData.map(player => player.steamid);

        playersInfo = await fetchPlayersInfo(steamIds);


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
        console.error('Error fetching data:', error.message);
        res.status(500).send('Error fetching data');
    }
});

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

app.get('/leaderboard_arena', cache(ARENA_CACHE_DURATION), async (req, res) => {
    try {
        let playersData;
        const playersByKey = {};
        const allFriendCodes = new Set();

        const fetchArenaData = async () => {
            console.log('Fetching fresh arena data');
            const response = await axios.get('https://data.worldofdota.net/data/get_top_rating_pve_arena.php');
            return response.data;
        };

        const fetchPlayersInfo = async (steamIds) => {
            console.log('Fetching avatars from Steam API');
            return await getPlayersInfoBySteamIds(steamIds);
        };

        playersData = await fetchArenaData();

        Object.keys(playersData).forEach(key => {
            const playersArray = playersData[key];

            if (playersArray) {
                playersByKey[key] = [];

                playersArray.forEach(entry => {
                    const friendCodes = [entry.p1, entry.p2, entry.p3, entry.p4].filter(id => id !== "0");
                    
                    friendCodes.forEach(code => {
                        allFriendCodes.add(code);
                    });
                    
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
        const playerDetails = await fetchPlayersInfo(friendCodesArray);
        
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
        console.error('Error fetching data:', error.message);
        res.status(500).send('Error fetching data');
    }
});

app.get('/votes', cache(VOTES_CACHE_DURATION), async (req, res) => {
    try {
        const response = await axios.get('https://data.worldofdota.net/data/get_heroes_votes.php');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching heroes votes data:', error);
        res.status(500).json({ message: 'Error fetching heroes votes data' });
    }
});

function extractItems() {
    const filePath = path.join(__dirname, 'assets', 'shop.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const itemNames = ['Items_Five', 'Items_pets', 'Items_emblems', 'Items_tips'];
    
    const itemConfigs = {
        Items_Five: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_pets: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_emblems: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_tips: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
    };
    
    const cleanRawData = (rawData) => {
        return rawData
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\s*[\r\n]+\s*/g, '\n')
            .trim();
    };
    
    const createItemObject = (arr, itemName) => {
        const config = itemConfigs[itemName];
        const itemObject = {};

        config.properties.forEach((prop, index) => {
            itemObject[prop] = arr[index].toString()
        });

        if (itemName === 'Items_pets') {
            itemObject.icon = itemObject.localizationKey.replace(/^pet_/, '');
        }

        return itemObject;
    };
    
    const parseItems = (itemName) => {
        const regex = new RegExp(`var\\s+${itemName}\\s*=\\s*(\\[[\\s\\S]*?\\]);?\\s*$`, 'gm');
        const match = regex.exec(fileContent);
        if (match) {
            try {
                let rawData = cleanRawData(match[1]);
                rawData = rawData
                    .replace(/'/g, '"')
                    .replace(/,\s*$/, '')
                    .replace(/,\s*]/g, ']')
                    .replace(/\b(true|false|null)\b/g, (match) => match);

                if (rawData.trim() !== '[]') {
                    const parsedData = JSON.parse(rawData);
                    return parsedData.map(arr => createItemObject(arr, itemName));
                } else {
                    console.warn(`Empty array ${itemName}, nothing will be extracted.`);
                }
            } catch (error) {
                console.error(`Error parsing JSON for ${itemName}:`, error);
            }
        } else {
            console.log(`Failed to extract data for ${itemName}.`);
        }
        return [];
    };
    
    const items = {};
    itemNames.forEach(itemName => {
        items[itemName] = parseItems(itemName);
    });

    return items;
}

app.get('/shop', (req, res) => {
    try {
        const itemsData = extractItems();
        res.json(itemsData);
    } catch (error) {
        console.error('Error while retrieving data:', error);
        res.status(500).send('Error while retrieving data.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
