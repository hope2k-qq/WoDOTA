function extractAbilityValues(fileContent) {
    const itemsData = {};
    let match;
    const regex = /"(item_[^"]+)"\s*{([^{}]*({[^{}]*})*[^{}]*)}/gs;
    while ((match = regex.exec(fileContent)) !== null) {
        const itemName = match[1];
        const itemContent = match[2];
        const abilityCooldown = extractField(itemContent, 'AbilityCooldown');
        const abilityCastRange = extractField(itemContent, 'AbilityCastRange');
        const abilityValuesString = extractField(itemContent, 'AbilityValues', true);
        const abilityValues = abilityValuesString ? parseAbilityValues(abilityValuesString) : {};
        if (itemsData[itemName]) {
            if (!itemsData[itemName].copies) {
                itemsData[itemName].copies = [];
            }
            itemsData[itemName].copies.push({
                AbilityCooldown: abilityCooldown,
                AbilityCastRange: abilityCastRange,
                AbilityValues: abilityValues
            });
        } else {
            itemsData[itemName] = {
                AbilityCooldown: abilityCooldown,
                AbilityCastRange: abilityCastRange,
                AbilityValues: abilityValues
            };
        }
    }
    return itemsData;
}

function extractField(itemContent, fieldName, isObject = false) {
    const fieldRegex = isObject
        ? new RegExp(`"${fieldName}"\\s*{([\\s\\S]*?)}`, 'm')
        : new RegExp(`"${fieldName}"\\s*"([^"]+)"`, 'm');
    const fieldMatch = fieldRegex.exec(itemContent);

    return fieldMatch ? fieldMatch[1] : null;
}

function parseAbilityValues(abilityValuesString) {
    const abilityValues = {};
    const regexValues = /^\s*"([^"]+)"\s*"([^"]+)"\s*$/gm;
    let match;
    while ((match = regexValues.exec(abilityValuesString)) !== null) {
        const key = match[1];
        const value = match[2];
        abilityValues[key] = value;
    }
    return abilityValues;
}

function createPatchItems(itemsData, updatedItemsData) {
    const itemsPatch = {};

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
                itemsPatch[itemName] = itemPatch;
            }
        }
    }

    return itemsPatch;
}

module.exports = {
    extractAbilityValues,
    createPatchItems
};