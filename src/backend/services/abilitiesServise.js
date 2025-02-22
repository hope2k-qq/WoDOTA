const abilitiesData = require('../data/heroesAbilities.json');

const abilitiesService = {
    getHeroAbilities: () => {
        const abilities = {};
        for (const hero in abilitiesData.heroes) {
            abilities[hero] = Object.values(abilitiesData.heroes[hero].abilities);
        }
        return abilities;
    }
};

module.exports = abilitiesService;
