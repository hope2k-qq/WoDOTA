const fs = require('fs');
const path = require('path');

function extractItems() {
    const filePath = path.join(__dirname, '../assets', 'shop_items_information.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const itemNames = ['Items_Five', 'Items_pets', 'Items_emblems', 'Items_tips', 'Items_Backround'];

    const itemConfigs = {
        Items_Five: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_pets: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_emblems: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_tips: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
        Items_Backround: {
            properties: ['id', 'currency', 'value', 'icon', 'localizationKey'],
        },
    };

    const cleanRawData = (rawData) => {
        return rawData
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\s*[\r\n]+\s*/g, '\n')
            .trim();
    };

    const createItemObject = (arr, itemName) => {
        const config = itemConfigs[itemName];
        const itemObject = {};

        config.properties.forEach((prop, index) => {
            itemObject[prop] = arr[index].toString();
        });

        if (itemName === 'Items_pets') {
            itemObject.icon = itemObject.localizationKey.replace(/^pet_/, '');
        }

        return itemObject;
    };

    const parseItems = (itemName) => {
        const regex = new RegExp(`var\\s+${itemName}\\s*=\\s*(\\[[\\s\\S]*?\\]);?\\s*$`, 'gm');
        const match = regex.exec(fileContent);
        if (match) {
            try {
                let rawData = cleanRawData(match[1]);
                rawData = rawData
                    .replace(/'/g, '"')
                    .replace(/,\s*$/, '')
                    .replace(/,\s*]/g, ']')
                    .replace(/\b(true|false|null)\b/g, (match) => match);

                if (rawData.trim() !== '[]') {
                    const parsedData = JSON.parse(rawData);

                    const filteredData = parsedData.filter(arr => {
                        return !(
                            (arr[1] === 'coin' && arr[2] === '99999') ||
                            arr[2] === '0'
                        );
                    });
                    
                    return filteredData.map(arr => createItemObject(arr, itemName));
                } else {
                    console.warn(`Empty array ${itemName}, nothing will be extracted.`);
                }
            } catch (error) {
                console.error(`Error parsing JSON for ${itemName}:`, error);
            }
        } else {
            console.log(`Failed to extract data for ${itemName}.`);
        }
        return [];
    };

    const items = {};
    itemNames.forEach(itemName => {
        items[itemName] = parseItems(itemName);
    });

    return items;
}

module.exports = {
    extractItems
};
