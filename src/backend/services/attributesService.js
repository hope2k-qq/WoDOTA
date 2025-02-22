const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

// Обратная замена (изменяет имя обратно в исходное)
function reverseHeroReplacements(heroName) {
    const originalHeroName = Object.keys(replacements_heroes).find(key => replacements_heroes[key] === heroName);
    return originalHeroName || heroName;
}

// Парсинг основных атрибутов героя
function parseHeroAttributes(content, heroName) {
    const heroBlockRegex = new RegExp(`"npc_dota_hero_${heroName}"\\s*\\{([\\s\\S]*?)\\}`, 'g');
    const heroBlockMatch = heroBlockRegex.exec(content);

    if (!heroBlockMatch) {
        throw new Error(`Hero "${heroName}" not found in file`);
    }

    const heroBlock = heroBlockMatch[0];
    const attributeRegex = /"(AttributeBaseStrength|AttributeStrengthGain|AttributeBaseAgility|AttributeAgilityGain|AttributeBaseIntelligence|AttributeIntelligenceGain|AttributePrimary|MovementSpeed|AttackRange|AttackRate|BaseAttackSpeed|AttackDamageMin|AttackDamageMax|ArmorPhysical|StatusHealth|StatusMana|StatusManaRegen|StatusHealthRegen)"\s*"([^"]+)"/g;

    const attributes = {};
    let match;

    while ((match = attributeRegex.exec(heroBlock)) !== null) {
        const [_, key, value] = match;
        attributes[key] = value;
    }

    return attributes;
}

// Обновленная версия функции parseAdditionalHeroAttributes с проверкой на дублирование
function parseAdditionalHeroAttributes(content, heroName, existingAttributes = {}) {
    const heroBlockStartRegex = new RegExp(`"npc_dota_hero_${heroName}"\\s*\\{`, "gm");
    const startMatch = heroBlockStartRegex.exec(content);

    if (!startMatch) {
        throw new Error(`Hero "${heroName}" not found in npc_heroes.txt`);
    }

    let blockStartIndex = startMatch.index;
    let bracketCount = 1;
    let blockEndIndex = blockStartIndex + startMatch[0].length;

    while (bracketCount > 0 && blockEndIndex < content.length) {
        if (content[blockEndIndex] === '{') {
            bracketCount++;
        } else if (content[blockEndIndex] === '}') {
            bracketCount--;
        }
        blockEndIndex++;
    }

    const heroBlock = content.slice(blockStartIndex, blockEndIndex);
    const additionalAttributesRegex = /"(AttributeBaseStrength|AttributeStrengthGain|AttributeBaseAgility|AttributeAgilityGain|AttributeBaseIntelligence|AttributeIntelligenceGain|AttributePrimary|MovementSpeed|AttackRange|AttackRate|BaseAttackSpeed|AttackDamageMin|AttackDamageMax|ArmorPhysical|StatusHealth|StatusMana|StatusManaRegen|StatusHealthRegen)"\s*"([^"]+)"/g;

    const additionalAttributes = {
        BaseAttackSpeed: "100",
        StatusHealth: "120",
        StatusMana: "75",
        StatusManaRegen: "0",
        StatusHealthRegen: "0.25"
    };

    let match;

    while ((match = additionalAttributesRegex.exec(heroBlock)) !== null) {
        const [_, key, value] = match;

        // Используем значение из existingAttributes, если оно есть, иначе добавляем из heroBlock
        if (!existingAttributes.hasOwnProperty(key)) {
            additionalAttributes[key] = value;
        } else {
            additionalAttributes[key] = existingAttributes[key];
        }
    }

    return additionalAttributes;
}
function processAttributes(baseAttributes, additionalAttributes) {
    const {
        AttributeBaseStrength = "0",
        AttributeBaseAgility = "0",
        AttributeBaseIntelligence = "0",
        AttributePrimary = "DOTA_ATTRIBUTE_STRENGTH"
    } = baseAttributes;

    const {
        StatusHealth = "0",
        StatusMana = "0",
        StatusManaRegen = "0",
        StatusHealthRegen = "0",
        AttackDamageMin = "0",
        AttackDamageMax = "0",
        ArmorPhysical = "0",
        BaseAttackSpeed = "100",
        AttackRate = "0",
        // Прочие атрибуты, которые нам не нужны для расчетов
        ...otherAttributes
    } = additionalAttributes;

    // Преобразование строк в числа для расчетов
    const baseStrength = parseFloat(AttributeBaseStrength);
    const baseAgility = parseFloat(AttributeBaseAgility);
    const baseIntelligence = parseFloat(AttributeBaseIntelligence);
    const statusHealth = parseFloat(StatusHealth);
    const statusMana = parseFloat(StatusMana);
    const statusManaRegen = parseFloat(StatusManaRegen);
    const statusHealthRegen = parseFloat(StatusHealthRegen);
    const attackDamageMin = parseFloat(AttackDamageMin);
    const attackDamageMax = parseFloat(AttackDamageMax);
    const armorPhysical = parseFloat(ArmorPhysical);
    const baseAttackSpeed = parseFloat(BaseAttackSpeed);
    const attackRate = parseFloat(AttackRate);

    // Определение основного атрибута героя
    let primaryAttributeValue;
    switch (AttributePrimary) {
        case "DOTA_ATTRIBUTE_STRENGTH":
            primaryAttributeValue = baseStrength;
            break;
        case "DOTA_ATTRIBUTE_AGILITY":
            primaryAttributeValue = baseAgility;
            break;
        case "DOTA_ATTRIBUTE_INTELLECT":
            primaryAttributeValue = baseIntelligence;
            break;
        case "DOTA_ATTRIBUTE_ALL":
            primaryAttributeValue = (baseStrength + baseAgility + baseIntelligence) * 0.6;
            break;
        default:
            primaryAttributeValue = 0;
    }

    // Вычисление параметров с округлением и корректировкой
    const calculatedAttributes = {
        health: (statusHealth + baseStrength * 22).toString(),
        mana: (statusMana + baseIntelligence * 12).toString(),
        manaregen: (Math.round((statusManaRegen + baseIntelligence * 0.05) * 10) / 10).toFixed(1),  // округление до 1 знака после запятой
        healthregen: (Math.round((statusHealthRegen + baseStrength * 0.1) * 10) / 10).toFixed(1),  // округление до 1 знака после запятой
        attackdamagemin: Math.floor(attackDamageMin + primaryAttributeValue).toString(),  // округление вниз
        attackdamagemax: Math.floor(attackDamageMax + primaryAttributeValue).toString(),  // округление вниз
        armorphysical: (armorPhysical + baseAgility / 6).toFixed(1),  // округление до 1 знака после запятой
        baseattackspeed: Math.floor(baseAttackSpeed + baseAgility).toString(),  // округление до целого числа
        attackrate: attackRate.toFixed(1)  // округление до 1 знака после запятой
    };

    // Преобразование значений manaregen и healthregen для округления до ближайшего 0.1
    calculatedAttributes.manaregen = (Math.round(parseFloat(calculatedAttributes.manaregen) * 10) / 10).toFixed(1);
    calculatedAttributes.healthregen = (Math.round(parseFloat(calculatedAttributes.healthregen) * 10) / 10).toFixed(1);

    // Убираем лишние десятичные знаки для AttributeIntelligenceGain и других аналогичных атрибутов
    otherAttributes.AttributeIntelligenceGain = parseFloat(otherAttributes.AttributeIntelligenceGain).toFixed(1);
    otherAttributes.AttributeStrengthGain = parseFloat(otherAttributes.AttributeStrengthGain).toFixed(1);
    otherAttributes.AttributeAgilityGain = parseFloat(otherAttributes.AttributeAgilityGain).toFixed(1);

    const toLowerCaseKeys = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
        );
    };

    return {
        ...toLowerCaseKeys(otherAttributes),
        ...calculatedAttributes
    };
}





// Объединённый функционал
function getHeroAttributes(heroName) {
    try {
        const mainFilePath = path.join(__dirname, '../assets', 'npc_heroes_custom.txt');
        const mainFileContent = fs.readFileSync(mainFilePath, 'utf-8');

        const additionalFilePath = path.join(__dirname, '../assets', 'npc_heroes.txt');
        const additionalFileContent = fs.readFileSync(additionalFilePath, 'utf-8');

        const originalHeroName = reverseHeroReplacements(heroName);

        const baseAttributes = parseHeroAttributes(mainFileContent, originalHeroName);

        // Передаем baseAttributes в качестве параметра для исключения повторных атрибутов
        const additionalAttributes = parseAdditionalHeroAttributes(additionalFileContent, originalHeroName, baseAttributes);

        // Обработка и объединение данных
        return processAttributes(baseAttributes, additionalAttributes);
    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}

module.exports = { getHeroAttributes };
