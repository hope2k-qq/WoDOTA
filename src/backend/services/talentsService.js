const fs = require('fs');
const path = require('path');
const luaparse = require('luaparse');
const replacements_heroes = require('../config/replacements_heroes');

let herotalents = null;

const filePath2 = path.join(__dirname, '../assets', 'talents.lua');

const loadHeroTalents = () => {
    try {
        const data = fs.readFileSync(filePath2, 'utf8');
        const parsedLua = luaparse.parse(data);

        parsedLua.body.forEach(node => {
            if (node.type === 'LocalStatement') {
                node.variables.forEach(variable => {
                    if (variable.name === 'herotalents') {
                        herotalents = node.init[0];
                    }
                });
            }
        });

        if (!herotalents) {
            throw new Error('No herotalents found in talents.lua');
        }

        herotalents = processHerotalents(herotalents);
    } catch (error) {
        console.error('Error parsing Lua:', error);
    }
};

const processHerotalents = (talents) => {
    const result = {};

    talents.fields.forEach(heroField => {
        let heroName = heroField.key.raw.replace(/"/g, '').replace('npc_dota_hero_', '');
        
        if (replacements_heroes[heroName]) {
            heroName = replacements_heroes[heroName];
        }

        result[heroName] = {};
        heroField.value.fields.forEach(levelField => {
            const level = levelField.key.value;
            result[heroName][level] = {};
            levelField.value.fields.forEach(talentField => {
                const talentIndex = talentField.key.value;
                const talentDetails = (talentField.value.fields || []).map(talentDetail => {
                    if (!talentDetail.value.fields) {
                        console.log(`No fields in talentDetail for talentIndex ${talentIndex} at level ${level} for hero ${heroName}`);
                        return [];
                    }
                    return talentDetail.value.fields.map(detail => {
                        if (detail.value && detail.value.fields) {
                            const subDetails = detail.value.fields.map(subDetail => {
                                const rawValue = subDetail.value?.raw || subDetail.value?.value;
                                return rawValue ? rawValue.replace(/"/g, '') : null;
                            }).filter(Boolean);
                            return `{${subDetails.join(', ')}}`;
                        } else if (detail.value) {
                            const rawValue = detail.value.raw || detail.value.value;
                            return rawValue.replace(/"/g, '');
                        } else if (detail.raw) {
                            return detail.raw.replace(/"/g, '');
                        } else {
                            console.log(`Unhandled detail structure: ${JSON.stringify(detail)}`);
                            return null;
                        }
                    }).join(', ');
                }).flat();

                result[heroName][level][talentIndex] = replaceWords(talentDetails, replacements_heroes);
            });
        });
    });
    return result;
};

const replaceWords = (input, replacements_heroes) => {
    if (typeof input === 'string') {
        let replacedString = input;
        for (const [key, value] of Object.entries(replacements_heroes)) {
            const regex = new RegExp(key, 'g');
            replacedString = replacedString.replace(regex, value);
        }
        return replacedString;
    } else if (Array.isArray(input)) {
        return input.map(item => replaceWords(item, replacements_heroes));
    } else if (typeof input === 'object' && input !== null) {
        const replacedObject = {};
        for (const key in input) {
            replacedObject[key] = replaceWords(input[key], replacements_heroes);
        }
        return replacedObject;
    } else {
        console.log(`Unexpected input type: ${typeof input}`, input);
        return input;
    }
};

const getHeroTalents = () => {
    if (!herotalents) {
        loadHeroTalents();
    }
    return herotalents;
};

module.exports = {
    getHeroTalents
};
