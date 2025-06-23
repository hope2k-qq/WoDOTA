const textService = require('../services/textService');
const path = require('path');
const fs = require('fs');

function parseAddonFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        const jsonData = {};
        lines.forEach(line => {
            const parts = line.split('"').filter(str => str.trim() !== '');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('"').trim();

                value = value.replace(/<\/?b>/g, '');

                const colorRegex = /<font color=['"]?([^'"]+)['"]?>(.*?)<\/font>/g;
                value = value.replace(colorRegex, (match, color, text) => {
                    return `{ "text": "${text}", "color": "${color}" }`;
                });

                value = value.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n');

                jsonData[key] = value;
            }
        });

        return jsonData;
    } catch (error) {
        console.error('Error reading or parsing file:', error.message);
        throw new Error('Failed to read or parse file');
    }
}

exports.getAllData = (req, res) => {
    const filePath = path.join(__dirname, '..', 'assets', 'addon_russian.txt');
    try {
        const jsonData = parseAddonFile(filePath);
        res.json(jsonData);
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getGeneralTalentsData = (req, res, lang) => {
    const jsonData = textService.getGeneralTalentsData(lang);
    if (jsonData) {
        res.json(jsonData);
    } else {
        res.status(500).json({ error: 'Data not available' });
    }
};