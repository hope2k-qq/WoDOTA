const fs = require('fs');
const path = require('path');

// Функция для извлечения данных из блока AbilityValues, включая "AbilityCooldown" и "AbilityCastRange"
function extractAbilityValues(fileContent) {
    // Регулярное выражение для извлечения имени предмета и значений, если они существуют
    const regex = /"(item_[^"]+)"\s*:\s*{([^}]*)}/g;
    //const regex = /"(item_[^"]+)"\s*:\s*{[^}]*?"AbilityValues"\s*:\s*{([^}]+)}/g;

    const itemsData = {};
    let match;

    // Ищем все совпадения в содержимом
    while ((match = regex.exec(fileContent)) !== null) {
        const itemName = match[1]; // Имя предмета
        const itemContent = match[2]; // Содержимое предмета

        const abilityCooldown = extractField(itemContent, 'AbilityCooldown');
        const abilityCastRange = extractField(itemContent, 'AbilityCastRange');
        console.log('abilityCastRange:', abilityCastRange);
        const abilityValuesString = extractField(itemContent, 'AbilityValues', true);
        console.log('AbilityValuesString:', abilityValuesString);
        const abilityValues = abilityValuesString ? parseAbilityValues(abilityValuesString) : {};
        console.log('AbilityValues:', JSON.stringify(abilityValues, null, 2));
        // Сохраняем результат в объект
        itemsData[itemName] = {
            AbilityCooldown: abilityCooldown,
            AbilityCastRange: abilityCastRange,
            AbilityValues: abilityValues
        };
    }
    return itemsData;
}

// Функция для извлечения значения конкретного поля
function extractField(itemContent, fieldName, isObject = false) {
    // Регулярное выражение для извлечения содержимого
    const fieldRegex = new RegExp(`"${fieldName}"\\s*:\\s*${isObject ? '\\{(.*?)\\}' : '"([^"]*)"'}`); // флаг 's' для захвата многократных строк
    console.log(fieldRegex);  // Выведем регулярное выражение для отладки
    console.log(itemContent); // Печать содержимого, с которым мы работаем

    // Ищем первое совпадение
    const fieldMatch = fieldRegex.exec(itemContent);

    // Если совпадение найдено, возвращаем его
    return fieldMatch ? fieldMatch[1] : null;
}


// Функция для парсинга значений внутри AbilityValues
function parseAbilityValues(abilityValuesString) {
    const abilityValues = {};
    const regexValues = /"([^"]+)"\s*:\s*"([^"]+)"/g;
    let match;

    // Ищем все значения внутри AbilityValues
    while ((match = regexValues.exec(abilityValuesString)) !== null) {
        const key = match[1]; // Имя свойства (например, debuff_increase)
        const value = match[2]; // Значение свойства

        // Добавляем в объект
        abilityValues[key] = value;
    }
    return abilityValues;
}

// Основной обработчик для генерации патча
exports.getPatches = async (req, res) => {
    try {
        const itemsFilePath = path.join(__dirname, '../assets/npc_items_custom.txt');
        const updatedItemsFilePath = path.join(__dirname, '../assets/npc_items_custom2.txt');

        const itemsContent = fs.readFileSync(itemsFilePath, 'utf-8');
        const updatedItemsContent = fs.readFileSync(updatedItemsFilePath, 'utf-8');

        const itemsData = extractAbilityValues(itemsContent);
        const updatedItemsData = extractAbilityValues(updatedItemsContent);

        const patch = createPatch(itemsData, updatedItemsData);

        res.status(200).json({
            success: true,
            message: 'Patch successfully generated for AbilityValues',
            patch
        });
    } catch (err) {
        console.error('Error generating patch:', err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while generating the patch',
            error: err.message
        });
    }
};

// Функция для создания патча для AbilityValues
function createPatch(itemsData, updatedItemsData) {
    const patch = {
        items: {}
    };

    for (const itemName in itemsData) {
        const originalValues = itemsData[itemName];
        const updatedValues = updatedItemsData[itemName];

        if (originalValues && updatedValues) {
            const itemPatch = {};

            if (originalValues.AbilityCooldown !== updatedValues.AbilityCooldown) {
                itemPatch.AbilityCooldown = {
                    old: originalValues.AbilityCooldown,
                    new: updatedValues.AbilityCooldown
                };
            }

            if (originalValues.AbilityCastRange !== updatedValues.AbilityCastRange) {
                itemPatch.AbilityCastRange = {
                    old: originalValues.AbilityCastRange,
                    new: updatedValues.AbilityCastRange
                };
            }

            const abilityValuesPatch = {};
            for (const key in originalValues.AbilityValues) {
                const originalValue = originalValues.AbilityValues[key];
                const updatedValue = updatedValues.AbilityValues[key];

                if (originalValue !== updatedValue) {
                    abilityValuesPatch[key] = {
                        old: originalValue,
                        new: updatedValue
                    };
                }
            }

            if (Object.keys(abilityValuesPatch).length > 0) {
                itemPatch.AbilityValues = abilityValuesPatch;
            }

            if (Object.keys(itemPatch).length > 0) {
                patch.items[itemName] = itemPatch;
            }
        }
    }

    return patch;
}
