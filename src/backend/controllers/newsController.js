const fs = require("fs");
const path = require("path");

exports.getNews = (req, res) => {
    const filePath = path.join(__dirname, "../data/newsSiteData.json");

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Ошибка при загрузке новостей" });
        }
        res.json(JSON.parse(data));
    });
};
