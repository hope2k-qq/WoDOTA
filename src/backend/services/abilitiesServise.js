const abilitiesData = require('../data/heroesAbilities.json');

const abilitiesService = {
    getHeroAbilities: () => {
        const heroes = {};

        for (const hero in abilitiesData.heroes) {
            const heroData = abilitiesData.heroes[hero];

            heroes[hero] = {
                innate: heroData.innate,
                abilities: Object.values(heroData.abilities)
            };
        }

        return heroes;
    }
};

module.exports = abilitiesService;