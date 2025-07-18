const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.steamCallback = async (req, res) => {
    const user = req.user;

    if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=1`);
    }

    const steamId = user.id || user.identifier;
    const displayName = user.displayName;
    const photos = user.photos;

    const payload = {
        steamId,
        displayName,
        photos
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('jwtToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    try {
        const usersCollection = req.app.locals.steam_users;

        const existingUser = await usersCollection.findOne({ steamId });

        if (!existingUser) {
            await usersCollection.insertOne({
                steamId,
                displayName,
                avatar: photos?.[2]?.value || '',
                createdAt: new Date(),
                settings: {
                    showNumbers: true,
                    showText: true
                }
            });
            console.log(`Пользователь ${steamId} добавлен в steam_users`);
            
            return res.redirect(`${process.env.FRONTEND_URL}/`);
        }

        const lang = existingUser.settings?.language;
        const redirectUrl = lang ? `${process.env.FRONTEND_URL}/${lang}` : `${process.env.FRONTEND_URL}/`;

        return res.redirect(redirectUrl);

    } catch (err) {
        console.error('Error:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/`);
    }
};
