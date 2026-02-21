const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

const langMap = {
    ru: 'russian',
    en: 'english',
    cs: 'english',
    uk: 'ukrainian',
};

function parseAddonFileForHero(filePath, heroName, abilityNames = []) {
    try {
        let fileContent = null;
        if (filePath.includes('english')) {
            fileContent = fs.readFileSync(filePath, 'utf-16le');
        } else {
            fileContent = fs.readFileSync(filePath, 'utf-8');
        }
        
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        const heroTalentsData = {};
        const abilitiesData = {};

        

        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                let key = parts[0].trim().toLowerCase();
                let value = parts.slice(1).join('"').trim();
                
                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');

                let heroNameReplacement = heroName;

                for (const [key, value] of Object.entries(replacements_heroes)) {
                    if (value === heroName) {
                        heroNameReplacement = key;
                        break;
                    }
                }
                
                if (key.startsWith('modifier_') && key.includes(heroNameReplacement) && !key.includes('boss_')) {
                    for (const [original, replacement] of Object.entries(replacements_heroes)) {
                        if (key.includes(original)) {
                            key = key.replace(original, replacement);
                            break;
                        }
                    }
                    heroTalentsData[key] = value;
                }
                if (
                    key.startsWith('dota_tooltip_ability_') &&
                    !key.startsWith('dota_tooltip_ability_item') &&
                    key.includes(heroName) &&
                    !key.includes('boss_')
                ) {
                    const abilityKey = key.replace('dota_tooltip_ability_', '');
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

function loadAdditionalAbilities(lang) {
    try {
        function getAddonFilePath(langCode) {
            const langFull = langMap[langCode] || 'english';
            return path.join(__dirname, '../data', `heroes_attributes_missing_${langFull}.json`);
        }
        let additionalAbilitiesFilePath = getAddonFilePath(lang);
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
        let fileContent = null;
        if (filePath.includes('english')) {
            fileContent = fs.readFileSync(filePath, 'utf-16le');
        } else {
            fileContent = fs.readFileSync(filePath, 'utf-8');
        }
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const generalTalentsData = {};

        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                let key = parts[0].trim().toLowerCase();
                let value = parts.slice(1).join('"').trim();
                
                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');
                
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

function getHeroData(heroName, abilityNames = [], lang) {
    let heroTalentsData = {};
    let abilitiesData = {};

    function getAddonFilePath(langCode) {
        const langFull = langMap[langCode] || 'english';
        return path.join(__dirname, '../assets', `addon_${langFull}.txt`);
    }
    const filePath = getAddonFilePath(lang);
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
                
                if (abilityName.startsWith(value + '_')) {
                    return abilityName.replace(value, key);
                }
            }

            return abilityName;
        });
        
        ({ heroTalentsData, abilitiesData } = parseAddonFileForHero(filePath, heroName, updatedAbilityNames));
    } catch (error) {
        console.error('Error:', error.message);
    }


    const additionalAbilities = loadAdditionalAbilities(lang);
    for (const [key, value] of Object.entries(additionalAbilities)) {
        const abilityKey = key.replace('dota_tooltip_ability_', '');
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

function getGeneralTalentsData(lang) {
    let generalTalentsData = {};
    function getAddonFilePath(langCode) {
        const langFull = langMap[langCode] || 'english';
        return path.join(__dirname, '../assets', `addon_${langFull}.txt`);
    }
    const filePath = getAddonFilePath(lang);

    try {
        generalTalentsData = parseAddonFile(filePath);
    } catch (error) {
        console.error('Error:', error.message);
    }

    return generalTalentsData;
}

module.exports = {
    getGeneralTalentsData,
    getHeroData
};
