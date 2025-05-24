const axios = require('axios');

// Вставьте свои Twitch App данные
const CLIENT_ID = 'sc69u696xrqfa4gbakbb0rzsp6l6bb';
const CLIENT_SECRET = '4djcdtig6viz4uukvukacpzw68yg5h';

exports.getTwitchFollows = async (req, res) => {
    const { username } = req.query; // имя пользователя приходит как параметр запроса (?username=...)

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        // 1. Получаем access_token
        const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });

        const accessToken = tokenRes.data.access_token;

        // 2. Получаем user ID по username
        const userRes = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-ID': CLIENT_ID
            },
            params: {
                login: username
            }
        });

        const user = userRes.data.data[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user.id;

        // 3. Получаем список подписок
        const followsRes = await axios.get('https://api.twitch.tv/helix/users/follows', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-ID': CLIENT_ID
            },
            params: {
                from_id: userId,
                first: 100 // максимум 100
            }
        });

        const followedChannels = followsRes.data.data.map(follow => ({
            to_name: follow.to_name,
            to_id: follow.to_id
        }));

        return res.json({
            username,
            followedCount: followsRes.data.total,
            followedChannels
        });

    } catch (error) {
        console.error('Error fetching Twitch follows:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to fetch data from Twitch API' });
    }
};

