const fs = require('fs').promises;
const path = require('path');

exports.readJsonFile = async (filePath) => {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
};
