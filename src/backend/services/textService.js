const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

const langMap = {
    ru: 'russian',
    en: 'english',
    cs: 'english',
    uk: 'ukrainian',
};

function parseAddonFileForHero(filePath, heroName, abilityNames = [], innateNames = []) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const heroTalentsData = {};
        const abilitiesData = {};
        const innateData = {};

        // const foundAbilities = new Set();
        // const foundInnates = new Set();

        const heroLower = heroName.toLowerCase();

        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length < 2) return;

            let key = parts[0].trim().toLowerCase();
            let value = parts.slice(1).join('"').trim();

            value = value
                .replace(/<br><br>/g, '\n\n')
                .replace(/<br>/g, '\n');

            // --- hero replacement key ---
            let heroNameReplacement = heroLower;

            for (const [original, replacement] of Object.entries(replacements_heroes)) {
                if (replacement.toLowerCase() === heroLower) {
                    heroNameReplacement = original.toLowerCase();
                    break;
                }
            }

            // --- TALENTS / MODIFIERS ---
            if (
                key.startsWith('modifier_') &&
                key.includes(heroNameReplacement) &&
                !key.includes('boss_')
            ) {
                for (const [original, replacement] of Object.entries(replacements_heroes)) {
                    if (key.includes(original.toLowerCase())) {
                        key = key.replace(original.toLowerCase(), replacement.toLowerCase());
                        break;
                    }
                }

                heroTalentsData[key] = value;
            }

            // --- ABILITIES ---
            if (
                key.startsWith('dota_tooltip_ability_') &&
                !key.startsWith('dota_tooltip_ability_item') &&
                key.includes(heroLower) &&
                !key.includes('boss_')
            ) {
                const abilityKey = key.replace('dota_tooltip_ability_', '');

                // apply replacements
                let normalizedKey = key;
                for (const [original, replacement] of Object.entries(replacements_heroes)) {
                    if (normalizedKey.includes(original.toLowerCase())) {
                        normalizedKey = normalizedKey.replace(
                            original.toLowerCase(),
                            replacement.toLowerCase()
                        );
                        break;
                    }
                }

                // --- normal abilities ---
                if (abilityNames.length > 0) {
                    const match = abilityNames.find(a =>
                        abilityKey.includes(a)
                    );

                    if (match) {
                        abilitiesData[normalizedKey] = value;
                        // foundAbilities.add(match);
                    }
                }
                

                // --- innates ---
                if (innateNames.length > 0) {
                    const match = innateNames.find(a =>
                        abilityKey.includes(a)
                    );

                    if (match) {
                        innateData[normalizedKey] = value;
                        // foundInnates.add(match);
                    }
                }
            }
        });
        
        // --- missing ---
        // const missingAbilities = abilityNames.filter(a => !foundAbilities.has(a));
        // let missingInnates = innateNames.filter(a => !foundInnates.has(a));

        const missingAbilities = abilityNames;
        let missingInnates = innateNames;

        missingInnates = missingInnates.map(name => {
            let updated = name;

            for (const [original, replacement] of Object.entries(replacements_heroes)) {
                updated = updated.replace(original, replacement);
            }

            return updated;
        });
        
        return {
            heroTalentsData,
            abilitiesData,
            innateData,
            missingAbilities,
            missingInnates
        };

    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}

// function loadAdditionalAbilities(lang) {
//     try {
//         function getAddonFilePath(langCode) {
//             const langFull = langMap[langCode] || 'english';
//             return path.join(__dirname, '../data', `heroes_attributes_missing_${langFull}.json`);
//         }
//         let additionalAbilitiesFilePath = getAddonFilePath(lang);
//         const fileContent = fs.readFileSync(additionalAbilitiesFilePath, 'utf-8');
//        
//         const additionalAbilities = JSON.parse(fileContent);
//         return additionalAbilities;
//     } catch (error) {
//         console.error('Error reading additional abilities file:', error.message);
//         return {};
//     }
// }

function loadAdditionalAbilities(lang) {
    function normalizeKey(key) {
        return key.replace(/:[a-z]+$/i, '');
    }

    function parseKeyValues(content) {
        const result = {};

        const regex = /"((?:\\.|[^"\\])*)"\s*"((?:\\.|[^"\\])*)"/g;

        let match;
        while ((match = regex.exec(content)) !== null) {
            const key = normalizeKey(match[1]);
            const value = match[2];

            if (!key || !value) continue;

            result[key.toLowerCase()] = value;
        }

        return result;
    }
    try {
        function getAddonFilePath(langCode) {
            const langFull = langMap[langCode] || 'english';
            return path.join(__dirname, '../data', `abilities_${langFull}.txt`);
        }

        const filePath = getAddonFilePath(lang);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = parseKeyValues(fileContent);
        
        return parsed;

    } catch (error) {
        console.error('Error reading additional abilities file:', error.message);
        return {};
    }
}

function parseAddonFile(filePath) {
    try {
        // let fileContent = null;
        // if (filePath.includes('english')) {
        //     fileContent = fs.readFileSync(filePath, 'utf-16le');
        // } else {
        //     fileContent = fs.readFileSync(filePath, 'utf-8');
        // }
        const fileContent = fs.readFileSync(filePath, 'utf8');
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

function getHeroData(heroName, abilityGroups = {}, lang) {
    let heroTalentsData = {};
    let abilitiesData = {};
    let innateData = {};
    let missingAbilities = {};
    let missingInnates = {};
    
    const abilityNames = abilityGroups.abilities || [];
    const innateAbility = abilityGroups.innate || [];
    
    

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

        const updatedInnateNames = innateAbility.map(abilityName => {
            for (const [key, value] of Object.entries(replacements_heroes)) {
                if (value === 'aghanim' || value === 'roshan') continue;

                if (abilityName.startsWith(value + '_')) {
                    return abilityName.replace(value, key);
                }
            }
            return abilityName;
        });

        ({
            heroTalentsData,
            abilitiesData,
            innateData,
            missingAbilities,
            missingInnates
        } = parseAddonFileForHero(
            filePath,
            heroName,
            updatedAbilityNames,
            updatedInnateNames
        ));
    } catch (error) {
        console.error('Error:', error.message);
    }
    


    const additionalAbilities = loadAdditionalAbilities(lang);

    const resultAbilities = {};
    const resultInnate = {};

    const existingAbilityKeys = new Set(Object.keys(abilitiesData));
    const existingInnateKeys = new Set(Object.keys(innateData));

    // const normalizedHero = replacements_heroes[heroName] || heroName;

    for (const [key, value] of Object.entries(additionalAbilities)) {
        if (key.includes('boss_')) continue;
        
        let normalizedKey = key;

        for (const [original, replacement] of Object.entries(replacements_heroes)) {
            
            
            if (normalizedKey.includes(original)) {
                normalizedKey = normalizedKey.replace(original, replacement);
                break;
            }
        }
        
        // const matchesHero =
        //     normalizedKey.includes(heroName) ||
        //     normalizedKey.includes(normalizedHero);
        // if (!matchesHero) continue;
        const isAbility = missingAbilities.some(name =>
            normalizedKey.includes(name)
        );

        if (isAbility && !existingAbilityKeys.has(normalizedKey)) {
            resultAbilities[normalizedKey] = value;
        }

        const isInnate = missingInnates.some(name =>
            normalizedKey.includes(name)
        );

        if (isInnate && !existingInnateKeys.has(normalizedKey)) {
            resultInnate[normalizedKey] = value;
        }
    }
    
    
    const finalAbilities = {
        ...(resultAbilities || {}),
        ...abilitiesData
    };

    const finalInnates = {
        ...(resultInnate || {}),
        ...innateData
    };

    return {
        heroTalentsData,
        abilities: finalAbilities,
        innate: finalInnates
    };
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
