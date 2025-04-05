const xml = require('xml');

const getPagesFromDB = async (sitemapCollection) => {
    try {
        const pages = await sitemapCollection.find({}).toArray();
        
        return pages.map(page => ({
            loc: page.loc,
            lastmod: page.lastmod,
            priority: page.priority, 
        }));
    } catch (error) {
        console.error('Ошибка при получении данных из MongoDB:', error);
        throw error;
    }
};

exports.getSitemap = async (req, res) => {
    try {
        const pages = await getPagesFromDB(req.app.locals.sitemap);
        
        const urls = pages.map(page => ({
            url: [
                { loc: page.loc },
                { lastmod: page.lastmod },
                { priority: page.priority }
            ]
        }));
        
        const sitemap = {
            urlset: [
                { _attr: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' } },
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
