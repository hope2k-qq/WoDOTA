const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

const getAllHeroesService = {
    getHeroesData: function () {
        const filePath = path.join(__dirname, '../assets', 'activelist.txt');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const heroNames = [];
        const regex = /"([^"]+)"\s*"1"/g;
        let match;

        while ((match = regex.exec(fileContent)) !== null) {
            let heroName = match[1];
            heroName = heroName.replace('npc_dota_hero_', '');
            
            if (replacements_heroes[heroName]) {
                heroName = replacements_heroes[heroName];
            }

            heroNames.push(heroName);
        }

        return heroNames;
    }
};

module.exports = getAllHeroesService;
