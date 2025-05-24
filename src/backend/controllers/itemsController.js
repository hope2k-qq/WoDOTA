const fs = require('fs');
const path = require('path');

function parseShopsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const shopItems = {};
    let currentCategory = null;

    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('"') && line.endsWith('"') && !line.includes('\t') && !line.includes('{') && !line.includes('}')) {
            const name = line.replace(/"/g, '');
            if (name !== 'dota_shops') {
                currentCategory = name;
                shopItems[currentCategory] = [];
            }
        }
        
        if (line.includes('"item"')) {
            const match = line.match(/"item"\s+"(.+?)"/);
            if (match && currentCategory) {
                shopItems[currentCategory].push(match[1]);
            }
        }
    }

    return { shop_items: shopItems };
}

exports.getShopItems = async (req, res) => {
    try {
        const filePath = path.join(__dirname, "../assets", 'shops.txt');
        const shopData = parseShopsFile(filePath);
        res.json(shopData);
    } catch (error) {
        console.error('Ошибка при получении предметов магазина:', error);
        res.status(500).send('Ошибка сервера');
    }
};
