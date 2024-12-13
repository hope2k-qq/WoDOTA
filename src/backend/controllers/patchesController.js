const fs = require('fs');
const path = require('path');

// Функция для извлечения данных из файла
function extractTalentData(fileContent) {
    const regex = /"([^"]+)"\s+"([^"]+)"/g;
    const data = {};
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
        const key = match[1];
        const value = match[2];
        data[key] = value;
    }
    return data;
}

// Функция для сравнения данных и создания патча
function createPatch(originalData, updatedData) {
    const patch = {
        generalTalents: {}, // Категория "Общие таланты"
        heroes: {}          // Категория "Герои"
    };

    for (const key in originalData) {
        const originalValue = originalData[key];
        const updatedValue = updatedData[key];

        if (!updatedValue || originalValue === updatedValue) {
            continue; // Пропускаем, если значение не изменилось
        }

        if (key.startsWith('woda_talent_')) {
            // Добавляем в "Общие таланты"
            patch.generalTalents[key] = {
                old: originalValue,
                new: updatedValue
            };
        } else if (key.startsWith('modifier_') && key.endsWith('_0')) {
            // Добавляем в "Герои"
            patch.heroes[key] = {
                old: originalValue,
                new: updatedValue
            };
        }
    }

    return patch;
}

// Контроллер для получения патчей
exports.getPatches = async (req, res) => {
    try {
        // Пути к файлам в папке assets
        const originalFilePath = path.join(__dirname, '../assets/addon_russian.txt');
        const updatedFilePath = path.join(__dirname, '../assets/addon_russian2.txt');

        // Чтение файлов
        const originalContent = fs.readFileSync(originalFilePath, 'utf-8');
        const updatedContent = fs.readFileSync(updatedFilePath, 'utf-8');

        // Извлечение данных
        const originalData = extractTalentData(originalContent);
        const updatedData = extractTalentData(updatedContent);

        // Создание патча
        const patch = createPatch(originalData, updatedData);

        // Отправка патча в ответе
        res.status(200).json({
            success: true,
            message: 'Patch successfully generated',
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
