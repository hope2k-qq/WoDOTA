const fs = require('fs');
require('dotenv').config();
const path = require('path');
const textService = require('../services/textService');
const talentsService = require('../services/talentsService');
const abilitiesService = require('../services/abilitiesServise');
const abilitiesDataService = require('../services/abilitiesDataServise');
const getAllHeroesService = require('../services/getAllHeroesService');
const { getHeroAttributes } = require('../services/attributesService');

exports.getHeroes = (req, res) => {
    try {
        const heroesData = getAllHeroesService.getHeroesData();
        if (!heroesData || heroesData.length === 0) {
            return res.status(500).json({ error: 'Heroes data not available' });
        }
        
        const attributesFilePath = path.join(__dirname, '..', 'data', 'heroesAttributes.json');
        const rawAttributesData = fs.readFileSync(attributesFilePath, 'utf-8');
        const attributesData = JSON.parse(rawAttributesData);
        
        const attributesMap = attributesData.reduce((acc, { name, primary_attr, custom_hero }) => {
            acc[name] = {
                primary_attr: primary_attr || 'unknown',
                custom_hero: custom_hero || false
            };
            return acc;
        }, {});
        
        const heroesWithAttributes = heroesData.map(hero => ({
            name: hero,
            primary_attr: attributesMap[hero]?.primary_attr || 'unknown',
            custom_hero: attributesMap[hero]?.custom_hero || false
        }));
        
        heroesWithAttributes.sort((a, b) => a.name.localeCompare(b.name));

        res.json(heroesWithAttributes);
    } catch (error) {
        console.error('Error loading heroes data:', error);
        res.status(500).json({ error: 'Failed to load heroes data' });
    }
};


exports.getHeroAttribute = (req, res) => {
    const { name } = req.params;

    try {
        const attributesFilePath = path.join(__dirname, '..', 'data', 'heroesAttributes.json');
        const rawAttributesData = fs.readFileSync(attributesFilePath, 'utf-8');
        const attributesData = JSON.parse(rawAttributesData);
        
        const heroAttributes = attributesData.find(hero => hero.name === name);

        if (!heroAttributes) {
            return res.status(404).json({ error: `Hero with name ${name} not found` });
        }
        
        res.json({ primary_attr: heroAttributes.primary_attr });
    } catch (error) {
        console.error('Error loading hero attribute:', error);
        res.status(500).json({ error: 'Failed to load hero attribute' });
    }
};

exports.getHeroData = (req, res) => {
    try {
        const heroName = decodeURIComponent(req.params.id);
        const abilityNames = abilitiesService.getHeroAbilities()[heroName];
        const heroTalentsInformation = talentsService.loadHeroTalentByName(heroName);
        const heroAttributes = getHeroAttributes(heroName);
        

        if (!abilityNames) {
            return res.status(404).json({ error: `Abilities for hero ${heroName} not found` });
        }
        
        const heroData = textService.getHeroData(heroName, abilityNames);
        
        const heroTalentsDescription = heroData.heroTalentsData;
        const heroAbilitiesData = heroData.abilitiesData; 
        const abilitiesWithDetails = {};
        abilityNames.forEach(ability => {
            const abilityPrefix = `DOTA_Tooltip_ability_${ability}`;
            const abilityKeys = Object.keys(heroAbilitiesData).filter(key => key.startsWith(abilityPrefix));

            if (abilityKeys.length > 0) {
                abilitiesWithDetails[ability] = {};

                abilityKeys.forEach(key => {
                    let fieldName = key.replace(`${abilityPrefix}`, '').toLowerCase();
                    if (fieldName === '_custom' || fieldName === '') {
                        abilitiesWithDetails[ability]['name'] = heroAbilitiesData[key];
                    } else if (fieldName.startsWith('_custom_')) {
                        const cleanedFieldName = fieldName.replace('_custom_', '');
                        abilitiesWithDetails[ability][cleanedFieldName] = heroAbilitiesData[key];
                    } else if (fieldName.startsWith('_')) {
                        const cleanedFieldName = fieldName.replace('_', '');
                        abilitiesWithDetails[ability][cleanedFieldName] = heroAbilitiesData[key];
                    } else {
                        abilitiesWithDetails[ability][fieldName] = heroAbilitiesData[key];
                    }
                });

                const abilityDetails = abilitiesDataService.getAbilityDetails(ability);

                function formatValues(obj) {
                    const formattedObj = {};
                    for (const key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) {
                            let value = obj[key];

                            if (typeof value === "object" && value !== null && "value" in value) {
                                value = value.value;
                            }

                            if (typeof value === "string") {
                                let formattedValue = value
                                    .split(" ")
                                    .map(part => {
                                        let num = parseFloat(part);
                                        if (!isNaN(num)) {
                                            return Number.isInteger(num) ? num.toFixed(0) : num.toString();
                                        }
                                        return part;
                                    });
                                
                                formattedValue = [...new Set(formattedValue)].join(" ");

                                formattedObj[key] = formattedValue;
                            } else {
                                formattedObj[key] = value;
                            }
                        }
                    }
                    return formattedObj;
                }

                function formatNumbersInObject(obj) {
                    const formattedObj = {};
                    for (const key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) {
                            let value = obj[key];

                            if (typeof value === "object" && value !== null && "value" in value) {
                                value = value.value;
                            }

                            if (typeof value === "string") {
                                let formattedValue = value
                                    .split(" ")
                                    .map(part => {
                                        const num = parseFloat(part);
                                        return !isNaN(num) && Number.isInteger(num) ? num.toFixed(0) : part;
                                    })
                                    .join(" ");
                                formattedObj[key] = formattedValue;
                            } else {
                                formattedObj[key] = value;
                            }
                        }
                    }
                    return formattedObj;
                }

                const formattedAbilityDetails = formatNumbersInObject(abilityDetails);

                function mergeValues(abilityData, formattedDetails) {
                    const result = { descriptions: {}, values: {} };

                    Object.entries(formattedDetails).forEach(([key, value]) => {
                        let normalValue = abilityData[key];
                        if (!normalValue && key.endsWith("width")) {
                            const lengthKey = key.replace("width", "length");
                            normalValue = abilityData[lengthKey];
                        }

                        if (typeof normalValue !== "string") {
                            normalValue = "";
                        }

                        if (!normalValue || normalValue === "0" || normalValue === "0%") {
                            return;
                        }

                        let prefix = "";
                        if (normalValue.startsWith("%")) {
                            prefix = "%";
                            normalValue = normalValue.slice(1).trim();
                        }

                        const valueArray = value.toString().split(" ").map(num => `${num.trim()}${prefix}`);
                        const uniqueValues = Array.from(new Set(valueArray)).filter(val => val !== "0" && val !== "0%" && val);

                        if (uniqueValues.length > 0) {
                            result.descriptions[key] = normalValue;
                            result.values[key] = uniqueValues.join(" / ");
                        }
                    });

                    return result;
                }
                
                abilitiesWithDetails[ability].values = formatValues(abilityDetails) || {};
                abilitiesWithDetails[ability].valuesInfo = mergeValues(abilitiesWithDetails[ability], formattedAbilityDetails);
            }
        });
        if (!heroTalentsInformation && Object.keys(abilitiesWithDetails).length === 0) {
            return res.status(404).json({ error: `Hero ${heroName} not found or has no data` });
        }
        
        res.json({
            talents_information: heroTalentsInformation || null,
            talents_description: heroTalentsDescription || null,
            abilities: abilitiesWithDetails,
            characteristics: heroAttributes || null,
        });
    } catch (error) {
        console.error('Error loading hero data:', error);
        res.status(500).json({ error: 'Failed to load hero data' });
    }
};

exports.getAllHeroesData = (req, res, lang) => {
    try {
        const allHeroNames = getAllHeroesService.getHeroesData();
        const allHeroesData = {};

        allHeroNames.forEach(heroName => {
            const abilityNames = abilitiesService.getHeroAbilities()[heroName];
            const heroTalentsInformation = talentsService.loadHeroTalentByName(heroName);
            const heroAttributes = getHeroAttributes(heroName);
            
            if (!abilityNames) {
                return;
            }

            const heroData = textService.getHeroData(heroName, abilityNames, lang);
            const heroTalentsDescription = heroData.heroTalentsData;
            const heroAbilitiesData = heroData.abilitiesData;
            const abilitiesWithDetails = {};

            abilityNames.forEach(ability => {
                const abilityPrefix = `dota_tooltip_ability_${ability}`;
                const abilityKeys = Object.keys(heroAbilitiesData).filter(key => key.startsWith(abilityPrefix));

                if (abilityKeys.length > 0) {
                    abilitiesWithDetails[ability] = {};

                    abilityKeys.forEach(key => {
                        let fieldName = key.replace(`${abilityPrefix}`, '').toLowerCase();
                        if (fieldName === '_custom' || fieldName === '') {
                            abilitiesWithDetails[ability]['name'] = heroAbilitiesData[key];
                        } else if (fieldName.startsWith('_custom_')) {
                            const cleanedFieldName = fieldName.replace('_custom_', '');
                            abilitiesWithDetails[ability][cleanedFieldName] = heroAbilitiesData[key];
                        } else if (fieldName.startsWith('_')) {
                            const cleanedFieldName = fieldName.replace('_', '');
                            abilitiesWithDetails[ability][cleanedFieldName] = heroAbilitiesData[key];
                        } else {
                            abilitiesWithDetails[ability][fieldName] = heroAbilitiesData[key];
                        }
                    });

                    const abilityDetails = abilitiesDataService.getAbilityDetails(ability);

                    function formatValues(obj) {
                        const formattedObj = {};
                        for (const key in obj) {
                            if (Object.hasOwnProperty.call(obj, key)) {
                                let value = obj[key];

                                if (typeof value === "object" && value !== null && "value" in value) {
                                    value = value.value;
                                }

                                if (typeof value === "string") {
                                    let formattedValue = value
                                        .split(" ")
                                        .map(part => {
                                            let num = parseFloat(part);
                                            if (!isNaN(num)) {
                                                return Number.isInteger(num) ? num.toFixed(0) : num.toString();
                                            }
                                            return part;
                                        });

                                    formattedValue = [...new Set(formattedValue)].join(" ");
                                    formattedObj[key] = formattedValue;
                                } else {
                                    formattedObj[key] = value;
                                }
                            }
                        }
                        return formattedObj;
                    }

                    function formatNumbersInObject(obj) {
                        const formattedObj = {};
                        for (const key in obj) {
                            if (Object.hasOwnProperty.call(obj, key)) {
                                let value = obj[key];

                                if (typeof value === "object" && value !== null && "value" in value) {
                                    value = value.value;
                                }

                                if (typeof value === "string") {
                                    let formattedValue = value
                                        .split(" ")
                                        .map(part => {
                                            const num = parseFloat(part);
                                            return !isNaN(num) && Number.isInteger(num) ? num.toFixed(0) : part;
                                        })
                                        .join(" ");
                                    formattedObj[key] = formattedValue;
                                } else {
                                    formattedObj[key] = value;
                                }
                            }
                        }
                        return formattedObj;
                    }

                    const formattedAbilityDetails = formatNumbersInObject(abilityDetails);

                    function mergeValues(abilityData, formattedDetails) {
                        const result = { descriptions: {}, values: {} };

                        Object.entries(formattedDetails).forEach(([key, value]) => {
                            let normalValue = abilityData[key];
                            if (!normalValue && key.endsWith("width")) {
                                const lengthKey = key.replace("width", "length");
                                normalValue = abilityData[lengthKey];
                            }

                            if (typeof normalValue !== "string") {
                                normalValue = "";
                            }

                            if (!normalValue || normalValue === "0" || normalValue === "0%") {
                                return;
                            }

                            let prefix = "";
                            if (normalValue.startsWith("%")) {
                                prefix = "%";
                                normalValue = normalValue.slice(1).trim();
                            }

                            const valueArray = value.toString().split(" ").map(num => `${num.trim()}${prefix}`);
                            const uniqueValues = Array.from(new Set(valueArray)).filter(val => val !== "0" && val !== "0%" && val);

                            if (uniqueValues.length > 0) {
                                result.descriptions[key] = normalValue;
                                result.values[key] = uniqueValues.join(" / ");
                            }
                        });

                        return result;
                    }

                    abilitiesWithDetails[ability].values = formatValues(abilityDetails) || {};
                    abilitiesWithDetails[ability].valuesInfo = mergeValues(abilitiesWithDetails[ability], formattedAbilityDetails);
                }
            });
            
            if (!heroTalentsInformation && Object.keys(abilitiesWithDetails).length === 0) {
                return;
            }

            allHeroesData[heroName] = {
                talents_information: heroTalentsInformation || null,
                talents_description: heroTalentsDescription || null,
                abilities: abilitiesWithDetails,
                characteristics: heroAttributes || null
            };
        });

        const filePath = path.join(__dirname, `heroesData_${lang}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allHeroesData, null, 2), 'utf8');

        res.json(allHeroesData);
    } catch (error) {
        console.error('Error loading all heroes data:', error);
        res.status(500).json({ error: 'Failed to load all heroes data' });
    }
};


exports.getAllHeroesDataJson = (req, res, lang) => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, `heroesData_${lang}.json`), 'utf8'));
    res.json(jsonData);
};

// exports.getAllHeroesDataJson = (req, res) => {
//     const filePath = path.join(__dirname, 'heroesData.json');
//
//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             return res.status(500).json({ error: 'Ошибка при чтении файла' });
//         }
//
//         try {
//             const jsonData = JSON.parse(data);
//             res.json(jsonData);
//         } catch (parseError) {
//             res.status(500).json({ error: 'Ошибка парсинга JSON' });
//         }
//     });
// };

const { v4: uuidv4 } = require('uuid');

const base62 = require('base62');


exports.createHeroBuild = async (req, res) => {
    const { heroName, currentTalentLevels, upgradeOrder, buildName, buildDescription } = req.body;

    if (!heroName || !currentTalentLevels || !upgradeOrder || !buildName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const uuid = uuidv4();
    
    let shortId = uuid.replace(/-/g, '').slice(0, 10);
    
    shortId = shortId.replace(/\d/g, '');
    
    while (shortId.length < 10) {
        const randomChar = Math.random() < 0.5
            ? String.fromCharCode(97 + Math.floor(Math.random() * 26)) 
            : String.fromCharCode(65 + Math.floor(Math.random() * 26));

        shortId += randomChar;
    }

    const buildsCollection = req.app.locals.db;
    
    const existingBuild = await buildsCollection.findOne({ id: shortId });

    if (existingBuild) {
        shortId = uuidv4().replace(/-/g, '').slice(0, 10).replace(/\d/g, '');
        while (shortId.length < 10) {
            const randomChar = Math.random() < 0.5
                ? String.fromCharCode(97 + Math.floor(Math.random() * 26))
                : String.fromCharCode(65 + Math.floor(Math.random() * 26));

            shortId += randomChar;
        }
    }
    
    const buildData = {
        id: shortId,
        heroName,
        currentTalentLevels,
        upgradeOrder,
        buildName: buildName,
        buildDescription: buildDescription || '',
        createdAt: new Date(),
    };
    const domen = process.env.DOMEN;
    
    buildsCollection.insertOne(buildData)
        .then(result => {
            res.json({ link: `${domen}/hero-build/${shortId}` });
        })
        .catch(error => {
            console.error("Error inserting build:", error);
            res.status(500).json({ error: 'Failed to save build' });
        });
};





exports.getHeroBuild = (req, res) => {
    const { id } = req.params; 
    const buildsCollection = req.app.locals.db; 
    
    buildsCollection.findOne({ id: id })
        .then(build => {
            if (!build) {
                return res.status(404).json({ error: 'Build not found' });
            }
            res.json(build);
        })
        .catch(error => {
            console.error("Error fetching build:", error);
            res.status(500).json({ error: 'Failed to fetch build' });
        });
};








