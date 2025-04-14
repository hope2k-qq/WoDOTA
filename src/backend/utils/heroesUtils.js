function extractHeroModifiers(fileContent) {
    const heroesModifiers = {};  // Объект для группировки по героям
    const regex = /"?(modifier_([a-z_]+)_\d+_0)"?\s*"([^"]+)"/g;  // Расширенный regex для извлечения имени героя
    let match;

    while ((match = regex.exec(fileContent)) !== null) {
        const fullKey = match[1];
        const heroName = match[2];  // Извлекаем имя героя
        const description = match[3];

        // Инициализация если ещё нет такого героя
        if (!heroesModifiers[heroName]) {
            heroesModifiers[heroName] = {};
        }

        // Добавляем модификатор героя
        heroesModifiers[heroName][fullKey] = description;
    }

    return heroesModifiers;
}

function createHeroPatch(oldData, newData) {
    const patch = {};

    for (const hero in oldData) {
        const heroPatch = {};

        for (const key in oldData[hero]) {
            if (newData[hero] && newData[hero][key] && oldData[hero][key] !== newData[hero][key]) {
                heroPatch[key] = {
                    old: oldData[hero][key],
                    new: newData[hero][key]
                };
            }
        }
        
        if (Object.keys(heroPatch).length > 0) {
            patch[hero] = heroPatch;
        }
    }

    return patch;
}

module.exports = {
    extractHeroModifiers,
    createHeroPatch
};
