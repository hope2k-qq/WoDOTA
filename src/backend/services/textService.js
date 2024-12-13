const fs = require('fs');
const path = require('path');

const replacements_heroes = require('../config/replacements_heroes');

const filePath = path.join(__dirname, '../assets', 'addon_russian.txt');

function parseAddonFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const allTextData = {};
        const heroesTalentsData = {};
        const generalTalentsData = {};

        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                let key = parts[0].trim();
                let value = parts.slice(1).join('"').trim();

                value = value.replace(/<\/?b>/g, '');

                const colorRegex = /<font color=['"]?([^'"]+)['"]?>(.*?)<\/font>/g;
                value = value.replace(colorRegex, (match, color, text) => {
                    return `{"text": "${text}", "color": "${color}"}`;
                });

                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');

                const addToData = (key, value) => {
                    for (const [originalKey, replacement] of Object.entries(replacements_heroes)) {
                        if (key.startsWith(`modifier_${originalKey}`)) {
                            key = key.replace(`modifier_${originalKey}`, `modifier_${replacement}`);
                            break;
                        }
                    }

                    allTextData[key] = value;

                    if (key.startsWith('modifier_')) {
                        const keyParts = key.split('_');

                        if (keyParts.length > 2) {
                            const heroName = keyParts.slice(1, -2).join('_');

                            if (!heroesTalentsData[heroName]) {
                                heroesTalentsData[heroName] = {};
                            }

                            heroesTalentsData[heroName][key] = value;
                        }
                    }

                    if (key.startsWith('woda_talent_')) {
                        generalTalentsData[key] = value;
                    }
                }

                addToData(key, value);
            }
        });

        allTextData['heroes_talents'] = heroesTalentsData;
        allTextData['general_talents'] = generalTalentsData;

        return { allTextData, heroesTalentsData, generalTalentsData };
    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}

let allTextData;
let heroesTalentsData;
let generalTalentsData;

try {
    ({ allTextData, heroesTalentsData, generalTalentsData } = parseAddonFile(filePath));
} catch (error) {
    console.error('Error:', error.message);
}

module.exports = {
    getAllData: () => allTextData,
    getHeroesData: () => heroesTalentsData,
    getGeneralTalentsData: () => generalTalentsData
};
