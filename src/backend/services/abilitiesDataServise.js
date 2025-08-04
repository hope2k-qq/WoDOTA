const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

const abilitiesDataService = {
    getAbilityDetails: (abilityName) => {
        let originalHeroName = abilityName.split('_')[0];
        let updatedAbilityName = abilityName;
        
        for (const [oldName, newName] of Object.entries(replacements_heroes)) {
            if (updatedAbilityName.startsWith(newName)) {
                updatedAbilityName = updatedAbilityName.replace(newName, oldName);
                originalHeroName = oldName;
                break;
            }
        }

        const primaryFilePath = path.resolve(__dirname, '../assets/npc_abilities_custom.txt');
        const secondaryFilePath = path.resolve(__dirname, '../assets/npc_dota_hero_medusa.txt');

        let abilityDetails = findAbilityDetails(primaryFilePath, updatedAbilityName);
        if (!abilityDetails) {
            abilityDetails = findAbilityDetails(primaryFilePath, abilityName);
        }

        if (!abilityDetails) {
            abilityDetails = findAbilityDetails(secondaryFilePath, updatedAbilityName);
        }

        if (!abilityDetails) {
            abilityDetails = findAbilityDetails(secondaryFilePath, abilityName);
        }

        if (!abilityDetails) {
            return null;
        }

        return abilityDetails;
    },
};

const findAbilityDetails = (filePath, abilityName) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const abilityRegex = new RegExp(`"${abilityName}(_custom)?"\\s*{[^}]*?"AbilityValues"\\s*{`, 'gs');
        let match = fileContent.match(abilityRegex);
        let abilityValuesBlock = null;

        if (match) {
            const startIndex = fileContent.indexOf(match[0]) + match[0].length - 1;
            abilityValuesBlock = extractNestedBlock(fileContent, startIndex);
        } else {
            const fallbackRegex = new RegExp(`"${abilityName}(_custom)?"\\s*{`, 'gs');
            match = fileContent.match(fallbackRegex);

            if (!match) {
                return null;
            }
        }
        
        const extraFields = extractExtraFields(fileContent, abilityName);
        
        const abilityData = abilityValuesBlock ? parseBlock(abilityValuesBlock) : {};

        return { ...abilityData, ...extraFields };
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return null;
    }
};


// Extract extra fields for a specific ability
const extractExtraFields = (fileContent, abilityName) => {
    const extraFields = {};

    // Список разрешённых полей в нижнем регистре
    const allowedFields = [
        "abilitycooldown",
        "abilitycastrange",
        "abilitymanacost",
        "abilitychanneltime",
        "abilityduration",
    ];

    // Регулярка для поиска блока способности
    const abilityBlockRegex = new RegExp(`"${abilityName}(_custom)?"\\s*{([^}]*)}`, 'gs');
    const abilityBlockMatch = abilityBlockRegex.exec(fileContent);

    if (!abilityBlockMatch) {
        console.error(`Блок для способности "${abilityName}" не найден.`);
        return extraFields; // Если блок не найден, возвращаем пустой объект
    }

    // Извлекаем весь блок способности
    const abilityBlock = abilityBlockMatch[0];

    // Регулярка для извлечения любых пар "ключ - значение"
    const fieldRegex = /"([^"]+)"\s+"([^"]+)"/g;
    let match;

    while ((match = fieldRegex.exec(abilityBlock)) !== null) {
        const field = match[1].trim().toLowerCase();
        const value = match[2].trim().toLowerCase();

        // Добавляем только разрешённые поля
        if (allowedFields.includes(field)) {
            extraFields[field] = value; // Можно: `value.toLowerCase()` для lowercase значений
        }
    }

    return extraFields;
};





const extractNestedBlock = (text, startIndex) => {
    let openBraces = 0;
    let inQuotes = false;
    let escapeNext = false;
    let blockStart = startIndex;
    let blockContent = '';

    for (let i = blockStart; i < text.length; i++) {
        const char = text[i];

        if (char === '\\' && !escapeNext) {
            escapeNext = true;
            continue;
        }

        if (char === '"' && !escapeNext) {
            inQuotes = !inQuotes;
        }
        escapeNext = false;

        if (!inQuotes) {
            if (char === '{') {
                openBraces++;
            } else if (char === '}') {
                openBraces--;
                if (openBraces === 0) {
                    return blockContent.trim();
                }
            }
        }

        if (openBraces > 0) {
            blockContent += char;
        }
    }
    return null;
};
const parseBlock = (block) => {
    const result = {};
    const regex = /"([^"]+)"\s*({[^}]*}|".*?")/gs;

    for (const match of block.matchAll(regex)) {
        const key = match[1].toLowerCase();
        const valueBlock = match[2].trim();

        if (valueBlock.startsWith('{')) {
            result[key] = parseBlock(valueBlock.slice(1, -1));
        } else {
            result[key] = valueBlock.replace(/^"|"$/g, '');
        }
    }

    return result;
};

module.exports = abilitiesDataService;
