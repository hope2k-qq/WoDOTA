const axios = require('axios');
const replacements_heroes = require('../config/replacements_heroes');

let cachedVotesData = null;
let updating = false;

const updateVotesData = async (app) => {
    if (updating) return;
    updating = true;

    try {
        console.log('Fetching fresh vote data');
        const response = await axios.get('https://data.worldofdota.net/data/get_heroes_votes.php');

        cachedVotesData = response.data
            .filter(hero => parseInt(hero.votes, 10) !== 500000)
            .map(hero => {
                const heroName = hero.hero_name.replace('npc_dota_hero_', '');
                const replacedHeroName = replacements_heroes[heroName] || heroName;

                return {
                    hero_name: replacedHeroName,
                    votes: hero.votes
                };
            });
        const collection = app;
        const currentDate = new Date().toISOString(); 

        await collection.updateOne(
            { loc: 'https://wodota.pro/votes' },
            {
                $set: {
                    lastmod: currentDate,
                }
            }
        );
    } catch (error) {
        console.error('Error fetching vote data:', error.message);
    } finally {
        updating = false;
    }
};


const getVotes = (req, res) => {
    if (cachedVotesData) {
        res.json(cachedVotesData);
    } else {
        res.json([]);
    }
};

module.exports = {
    updateVotesData,
    getVotes
};