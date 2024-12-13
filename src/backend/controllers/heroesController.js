const textService = require('../services/textService');
const talentsService = require('../services/talentsService');

exports.getHeroes = (req, res) => {
    const heroesData = textService.getHeroesData();
    if (heroesData) {
        const heroNames = Object.keys(heroesData).sort();
        res.json(heroNames);
    } else {
        res.status(500).json({ error: 'Heroes data not available' });
    }
};

exports.getHeroData = (req, res) => {
    const heroName = decodeURIComponent(req.params.id);
    const heroTalentsInformation = talentsService.getHeroTalents()[heroName];
    const heroesData = textService.getHeroesData();
    const heroTalentsDescription = heroesData[heroName];

    if (!heroTalentsInformation && !heroTalentsDescription) {
        return res.status(404).json({ error: 'Hero not found' });
    }

    res.json({
        talents_information: heroTalentsInformation || null,
        talents_description: heroTalentsDescription || null
    });
};
