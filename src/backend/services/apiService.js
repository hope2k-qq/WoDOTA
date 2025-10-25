const axios = require('axios');
const replacements_heroes = require('../config/replacements_heroes');

const cleanHeroName = (hero) => {
    const name = hero.replace('npc_dota_hero_', '');
    return replacements_heroes[name] || name;
};

const fetchRatingData = async () => {
    try {
        const response = await axios.get('https://data.world-of-dota.com/data/get_top_rating_150.php');
        return response.data;
    } catch (error) {
        console.error('Error fetching rating data:', error.message);
        throw new Error('Failed to fetch rating data');
    }
};

const fetchArenaData = async () => {
    try {
        const response = await axios.get('https://data.world-of-dota.com/data/get_top_rating_pve_arena.php');
        const rawData = response.data;
        const cleanedData = {};

        for (const key in rawData) {
            if (Array.isArray(rawData[key]) && key !== "hero") {
                cleanedData[key] = rawData[key].map(entry => ({
                    ...entry,
                    hero_1: entry.hero_1 ? cleanHeroName(entry.hero_1) : entry.hero_1,
                    hero_2: entry.hero_2 ? cleanHeroName(entry.hero_2) : entry.hero_2,
                    hero_3: entry.hero_3 ? cleanHeroName(entry.hero_3) : entry.hero_3,
                }));
            }
        }

        if (rawData.hero) {
            cleanedData.hero = rawData.hero.map(entry => ({
                ...entry,
                hero: entry.hero ? cleanHeroName(entry.hero) : entry.hero
            }));
        }
        return cleanedData;
    } catch (error) {
        console.error('Error fetching arena data:', error.message);
        throw new Error('Failed to fetch arena data');
    }
};


module.exports = {
    fetchRatingData,
    fetchArenaData
};