const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

const filePath = path.join(__dirname, '../assets', 'addon_russian.txt');
const additionalAbilitiesFilePath = path.join(__dirname, '../data', 'heroesAttributesMissing.json');



function parseAddonFileForHero(filePath, heroName, abilityNames = []) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const heroTalentsData = {};
        const abilitiesData = {};

        

        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                let key = parts[0].trim();
                let value = parts.slice(1).join('"').trim();

                value = value.replace(/<\/?b>/g, '');

                const colorRegex = /<font color=['"]?([^'"]+)['"]?>(.*?)<\/font>/g;
                value = value.replace(colorRegex, (match, color, text) => {
                    return `{"text": "${text}", "color": "${color}"}`;
                });

                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');

                let heroNameReplacement = heroName;

                for (const [key, value] of Object.entries(replacements_heroes)) {
                    if (value === heroName) {
                        heroNameReplacement = key;
                        break;
                    }
                }

                // Добавляем таланты героя
                if (key.startsWith('modifier_') && key.includes(heroNameReplacement) && !key.includes('boss_')) {
                    for (const [original, replacement] of Object.entries(replacements_heroes)) {
                        if (key.includes(original)) {
                            key = key.replace(original, replacement);
                            break;
                        }
                    }
                    heroTalentsData[key] = value;
                }
                
                
                
                // Добавляем данные только для выбранных способностей
                if (
                    key.startsWith('DOTA_Tooltip_ability_') &&
                    !key.startsWith('DOTA_Tooltip_ability_item') &&
                    key.includes(heroName) &&
                    !key.includes('boss_')
                ) {
                    
                    const abilityKey = key.replace('DOTA_Tooltip_ability_', '');
                    if (abilityNames.length === 0 || abilityNames.some(ability => abilityKey.startsWith(ability))) {
                        for (const [original, replacement] of Object.entries(replacements_heroes)) {
                            if (key.includes(original)) {
                                key = key.replace(original, replacement);
                                break;
                            }
                        }
                        abilitiesData[key] = value;
                    }
                }
            }
        });

        return { heroTalentsData, abilitiesData };
    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}

function loadAdditionalAbilities() {
    try {
        const fileContent = fs.readFileSync(additionalAbilitiesFilePath, 'utf-8');
        const additionalAbilities = JSON.parse(fileContent);

        return additionalAbilities;
    } catch (error) {
        console.error('Error reading additional abilities file:', error.message);
        return {};
    }
}

function parseAddonFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const generalTalentsData = {};

        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                let key = parts[0].trim();
                let value = parts.slice(1).join('"').trim();

                value = value.replace(/<\/?b>/g, '');

                const colorRegex = /<font color=['"]?([^'"]+)['"]?>(.*?)<\/font>/g;
                value = value.replace(colorRegex, (match, color, text) => {
                    return `{"text": "${text}", "color": "${color}"}`;
                });

                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');

                // Добавляем общие таланты (например, для всех героев)
                if (key.startsWith('woda_talent_')) {
                    generalTalentsData[key] = value;
                }
            }
        });

        return generalTalentsData;
    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}

function getHeroData(heroName, abilityNames = []) {
    let heroTalentsData = {};
    let abilitiesData = {};

    try {
        for (const [key, value] of Object.entries(replacements_heroes)) {
            if (value === 'aghanim' || value === 'roshan') {
                continue;
            }

            if (value === heroName) {
                heroName = key;
                break;
            }
        }
        
        const updatedAbilityNames = abilityNames.map(abilityName => {
            for (const [key, value] of Object.entries(replacements_heroes)) {
                if (value === 'aghanim' || value === 'roshan') {
                    continue;
                }

                if (abilityName.includes(value)) {
                    return abilityName.replace(value, key);
                }
            }
            return abilityName;
        });
        
        ({ heroTalentsData, abilitiesData } = parseAddonFileForHero(filePath, heroName, updatedAbilityNames));
    } catch (error) {
        console.error('Error:', error.message);
    }


    const additionalAbilities = loadAdditionalAbilities();

    for (const [key, value] of Object.entries(additionalAbilities)) {
        const abilityKey = key.replace('DOTA_Tooltip_ability_', '');
        if (
            key.includes(heroName) &&
            !key.includes('boss_') &&
            (abilityNames.length === 0 || abilityNames.some(ability => abilityKey.startsWith(ability)))
        ) {
            abilitiesData[key] = value;
        }
    }

    return { heroTalentsData, abilitiesData };
}

function getGeneralTalentsData() {
    let generalTalentsData = {};

    try {
        generalTalentsData = parseAddonFile(filePath); // Получаем данные о талантах
    } catch (error) {
        console.error('Error:', error.message);
    }

    return generalTalentsData; // Возвращаем только данные о талантах
}

module.exports = {
    getGeneralTalentsData,
    getHeroData
};
