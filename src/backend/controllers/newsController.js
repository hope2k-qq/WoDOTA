const fs = require("fs");
const path = require("path");

exports.getNews = (req, res, lang) => {
    const filePath = path.join(__dirname, "../data", `news_${lang}.json`);
    
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ error: `Ошибка при загрузке новостей для языка: ${lang}` });
        }
        res.json(JSON.parse(data));
    });
};

