const axios = require('axios');

exports.getSubscribers = async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
            new URLSearchParams({
                itemcount: 1,
                'publishedfileids[0]': '2880603428'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const details = response.data?.response?.publishedfiledetails?.[0];

        if (details) {
            return res.json({ subscriptions: details.subscriptions });
        } else {
            return res.status(404).json({ message: 'Кастомка не найдена' });
        }
    } catch (error) {
        console.error('Ошибка при запросе к Steam API:', error.message);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
};
