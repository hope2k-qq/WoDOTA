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
        const mustIncludeHeroes = [
            'npc_dota_hero_void_spirit',
            'npc_dota_hero_wisp',
            'npc_dota_hero_razor',
            'npc_dota_hero_phoenix',
            'npc_dota_hero_sniper',
            'npc_dota_hero_riki',
            'npc_dota_hero_monkey_king',
            'npc_dota_hero_faceless_void',
        ];
        cachedVotesData = response.data
            .filter(hero => {
                return !mustIncludeHeroes.includes(hero.hero_name);
            })
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