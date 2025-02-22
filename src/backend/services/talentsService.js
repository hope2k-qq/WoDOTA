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

const loadHeroTalentByName = (heroName) => {
    try {
        const data = fs.readFileSync(filePath2, 'utf8');
        const parsedLua = luaparse.parse(data);

        let herotalents = null;

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

        // Найти таланты только для указанного героя и вернуть без имени героя в ключах
        return processHeroTalentByName(herotalents, heroName);
    } catch (error) {
        console.error('Error parsing Lua:', error);
        return null;
    }
};

const processHeroTalentByName = (talents, heroName) => {
    let heroKey = heroName.replace('npc_dota_hero_', '');
    for (const [key, value] of Object.entries(replacements_heroes)) {
        if (value === heroKey) {
            heroKey = key;
            break;
        }
    }

    const heroField = talents.fields.find(field => {
        const fieldName = field.key.raw.replace(/"/g, '').replace('npc_dota_hero_', '');
        return fieldName === heroKey;
    });

    if (!heroField) {
        console.warn(`Talents for hero "${heroName}" not found.`);
        return null;
    }

    const result = {};

    // Убираем имя героя из результата, просто возвращаем таланты
    heroField.value.fields.forEach(levelField => {
        const level = levelField.key.value;
        if (!result[level]) {
            result[level] = {};
        }

        levelField.value.fields.forEach(talentField => {
            const talentIndex = talentField.key.value;
            const talentDetails = (talentField.value.fields || []).map(talentDetail => {
                if (!talentDetail.value.fields) {
                    console.log(`No fields in talentDetail for talentIndex ${talentIndex} at level ${level} for hero ${heroKey}`);
                    return [];
                }
                return talentDetail.value.fields.reduce((acc, detail, index) => {
                    const getFieldName = (detail, index) => {
                        // Dynamic name generation based on the field's purpose and index
                        switch (index) {
                            case 0: return 'id';
                            case 1: return 'talentInfo';
                            case 2: return 'level';
                            case 3: return 'imagePath';
                            case 4: return 'relatedTalent';
                            default: return `field_${index}`;
                        }
                    };

                    if (detail.value && detail.value.fields) {
                        const subDetails = detail.value.fields.reduce((subAcc, subDetail, subIndex) => {
                            switch (subIndex) {
                                case 0:
                                    subAcc['relatedTalentName'] = (subDetail.value?.raw || subDetail.value?.value).replace(/\"/g, '');  // Clean up quotes
                                    break;
                                case 1:
                                    subAcc['requiredTalentLevel'] = subDetail.value?.raw || subDetail.value?.value;
                                    break;
                                default:
                                    subAcc[`subfield_${subIndex}`] = subDetail.value?.raw || subDetail.value?.value;
                            }
                            return subAcc;
                        }, {});

                        acc[getFieldName(detail, index)] = subDetails;
                    } else if (detail.value) {
                        const rawValue = detail.value.raw || detail.value.value;
                        acc[getFieldName(detail, index)] = rawValue.replace(/\"/g, '');  // Clean up quotes
                    } else if (detail.raw) {
                        acc[getFieldName(detail, index)] = detail.raw.replace(/\"/g, '');  // Clean up quotes
                    } else {
                        console.log(`Unhandled detail structure: ${JSON.stringify(detail)}`);
                    }
                    return acc;
                }, {});



            }).flat();
            
            // console.log(talentDetails)

            result[level][talentIndex] = replaceWords(talentDetails, replacements_heroes);
        });
    });

    return result; 
};


const getHeroTalents = () => {
    if (!herotalents) {
        loadHeroTalents();
    }
    return herotalents;
};

module.exports = {
    getHeroTalents,
    loadHeroTalentByName
};
