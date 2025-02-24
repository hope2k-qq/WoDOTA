const fs = require('fs');
const path = require('path');
const textService = require('../services/textService');
const talentsService = require('../services/talentsService');
const abilitiesService = require('../services/abilitiesServise');
const abilitiesDataService = require('../services/abilitiesDataServise');
const getAllHeroesService = require('../services/getAllHeroesService');
const { getHeroAttributes } = require('../services/attributesService');

exports.getHeroes = (req, res) => {
    try {
        // Получаем данные о героях
        const heroesData = getAllHeroesService.getHeroesData();

        if (!heroesData || heroesData.length === 0) {
            return res.status(500).json({ error: 'Heroes data not available' });
        }

        // Загружаем дополнительные атрибуты героев
        const attributesFilePath = path.join(__dirname, '..', 'data', 'heroesAttributes.json');
        const rawAttributesData = fs.readFileSync(attributesFilePath, 'utf-8');
        const attributesData = JSON.parse(rawAttributesData);

        // Создаем объект маппинга имен героев на их данные
        const attributesMap = attributesData.reduce((acc, { name, primary_attr, custom_hero }) => {
            acc[name] = {
                primary_attr: primary_attr || 'unknown',
                custom_hero: custom_hero || false
            };
            return acc;
        }, {});

        // Формируем массив героев с атрибутами
        const heroesWithAttributes = heroesData.map(hero => ({
            name: hero,
            primary_attr: attributesMap[hero]?.primary_attr || 'unknown',
            custom_hero: attributesMap[hero]?.custom_hero || false
        }));

        // Сортируем героев по имени
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
        const heroName = decodeURIComponent(req.params.id); // Имя героя
        const abilityNames = abilitiesService.getHeroAbilities()[heroName]; // Получаем список способностей героя
        const heroTalentsInformation = talentsService.loadHeroTalentByName(heroName);
        //console.log(heroTalentsInformation)
        const heroAttributes = getHeroAttributes(heroName);
        console.log(heroAttributes);
        

        if (!abilityNames) {
            return res.status(404).json({ error: `Abilities for hero ${heroName} not found` });
        }
        
        const heroData = textService.getHeroData(heroName, abilityNames);

        const heroTalentsDescription = heroData.heroTalentsData; // Таланты героя
        const heroAbilitiesData = heroData.abilitiesData; // Способности героя
        const abilitiesWithDetails = {};

        // Обрабатываем способности героя и собираем все доступные поля
        abilityNames.forEach(ability => {
            const abilityPrefix = `DOTA_Tooltip_ability_${ability}`;
            const abilityKeys = Object.keys(heroAbilitiesData).filter(key => key.startsWith(abilityPrefix));

            if (abilityKeys.length > 0) {
                abilitiesWithDetails[ability] = {};

                abilityKeys.forEach(key => {
                    let fieldName = key.replace(`${abilityPrefix}`, '').toLowerCase(); // Приводим ключ к нижнему регистру
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

                // Получаем дополнительные значения, связанные со способностью
                const abilityDetails = abilitiesDataService.getAbilityDetails(ability);
                // console.log(abilityDetails)
                abilitiesWithDetails[ability].values = abilityDetails || {};
            }
        });

        // Если нет данных о талантах и способностях, возвращаем ошибку
        if (!heroTalentsInformation && Object.keys(abilitiesWithDetails).length === 0) {
            return res.status(404).json({ error: `Hero ${heroName} not found or has no data` });
        }

        // Возвращаем данные о герое
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









