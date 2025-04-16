const xml = require('xml');

const getPagesFromDB = async (sitemapCollection) => {
    try {
        const pages = await sitemapCollection.find({}).toArray();

        return pages.map(page => ({
            loc: page.loc,
            lastmod: page.lastmod,
            priority: page.priority,
            alternate: page.alternate || []  // Fetching the alternate hreflang URLs if they exist
        }));
    } catch (error) {
        console.error('Ошибка при получении данных из MongoDB:', error);
        throw error;
    }
};

exports.getSitemap = async (req, res) => {
    try {
        const pages = await getPagesFromDB(req.app.locals.sitemap);

        const urls = pages.map(page => {
            const urlObj = [
                { loc: page.loc },
                { lastmod: page.lastmod },
                { priority: parseFloat(page.priority).toFixed(1) }
            ];

            // Add alternate hreflang URLs if they exist
            if (page.alternate && page.alternate.length > 0) {
                const alternates = page.alternate.map(alternate => ({
                    "xhtml:link": {
                        _attr: { rel: 'alternate', hreflang: alternate.hreflang, href: alternate.href }
                    }
                }));
                urlObj.push(...alternates);
            }

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
        res.status(500).send('Ошибка сервера');
    }
};
