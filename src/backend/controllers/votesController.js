const axios = require('axios');
const replacements_heroes = require('../config/replacements_heroes');

exports.getVotes = async (req, res) => {
    try {
        const response = await axios.get('https://data.worldofdota.net/data/get_heroes_votes.php');
        
        const transformedData = response.data.map(hero => {
            const heroName = hero.hero_name.replace('npc_dota_hero_', '');
            const replacedHeroName = replacements_heroes[heroName] || heroName;

            return {
                hero_name: replacedHeroName,
                votes: hero.votes
            };
        });

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching heroes votes data:', error);
        res.status(500).json({ message: 'Error fetching heroes votes data' });
    }
};
