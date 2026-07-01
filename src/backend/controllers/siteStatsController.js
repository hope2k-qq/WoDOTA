let cachedSiteStats = null;
let updating = false;

const updateSiteStats = async (steam_data_players, steam_users) => {
    if (updating) return;
    updating = true;

    try {
        console.log('Fetching fresh site stats');

        const playersCount = await steam_data_players.countDocuments();
        const usersCount = await steam_users.countDocuments();

        const playersRounded = Math.floor(playersCount / 500) * 500;

        cachedSiteStats = {
            players: `${playersRounded}+`,
            authorized: usersCount
        };

        console.log('Site stats updated');
    } catch (error) {
        console.error('Error fetching site stats:', error.message);
    } finally {
        updating = false;
    }
};

const getSiteStats = async (req, res) => {
    try {
        if (!cachedSiteStats) {
            await updateSiteStats(req.app.locals.steam_data_players, req.app.locals.steam_users);
        }

        res.json(cachedSiteStats || { players: '0+', authorized: 0 });
    } catch (error) {
        console.error('Error in getSiteStats:', error.message);
        res.status(500).json({ error: 'Failed to fetch site stats' });
    }
};

module.exports = {
    updateSiteStats,
    getSiteStats
};
