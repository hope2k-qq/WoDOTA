const xml = require('xml');

const getPagesFromDB = async (sitemapCollection) => {
    try {
        const pages = await sitemapCollection.find({}).toArray();

        return pages.map(page => ({
            loc: page.loc,
            lastmod: page.lastmod,
            priority: page.priority,
            alternate: page.alternate || []
        }));
    } catch (error) {
        console.error('Ошибка при получении данных из MongoDB:', error);
        throw error;
    }
};

exports.getSitemapLang = async (req, res, lang) => {
    try {
        const pages = await getPagesFromDB(req.app.locals.sitemap);

        const urls = pages.map(page => {
            const urlObj = [];
            if (page.alternate && page.alternate.length > 0) {
                const alternates = page.alternate.filter(alternate => alternate.lang === lang);
                
                if (alternates.length === 0) {
                    throw new Error(`No matching alternate for language: ${lang}`);
                }

                alternates.forEach(alternate => {
                    urlObj.push({
                        "loc": alternate.loc
                    });
                });
            }

            urlObj.push(
                { "lastmod": page.lastmod },
                { "priority": parseFloat(page.priority).toFixed(1) }
            );

            return { url: urlObj };
        });

        const sitemap = {
            urlset: [
                { _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9', 'xmlns:xhtml': 'http://www.w3.org/1999/xhtml' } },
                ...urls
            ]
        };
        res.header('Content-Type', 'application/xml');
        res.send(xml(sitemap, { declaration: true }));

    } catch (error) {
        console.error('Ошибка генерации sitemap:', error);
        res.status(400).send(`Ошибка: ${error.message}`);
    }
};


const languages = ['ru', 'uk', 'en', 'cs', 'x-default'];

exports.getSitemapIndex = async (req, res) => {
    try {
        const sitemapIndex = {
            sitemapindex: [
                { _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } },
                ...languages.map(lang => {
                    return {
                        sitemap: [
                            { loc: `https://wodota.pro/sitemap_${lang}.xml` },
                        ]
                    };
                })
            ]
        };
        
        res.header('Content-Type', 'application/xml');
        res.send(xml(sitemapIndex, { declaration: true }));

    } catch (error) {
        console.error('Ошибка генерации sitemapindex:', error);
        res.status(500).send('Ошибка сервера');
    }
};
