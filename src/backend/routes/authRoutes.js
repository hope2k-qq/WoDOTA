const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
    const token = req.cookies.jwtToken;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = user;
        next();
    });
}

router.get('/auth/steam', (req, res, next) => {
    passport.authenticate('steam', { session: false })(req, res, next);
});



router.get('/auth/steam/return', (req, res, next) => {
    passport.authenticate('steam', { session: false, failureRedirect: '/' }, (err, user) => {
        if (err) return next(err);
        if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=1`);
        req.user = user;
        authController.steamCallback(req, res);
    })(req, res, next);
});

router.get('/account', authenticateJWT, async (req, res) => {
    const usersCollection = req.app.locals.steam_users;
    const { steamId, displayName, photos } = req.user;

    try {
        const userFromDb = await usersCollection.findOne({ steamId });
        
        res.json({
            steamId,
            name: displayName,
            avatar: photos?.[2]?.value,
            settings: userFromDb?.settings || {},
        });
    } catch (err) {
        console.error('Error fetching user settings:', err);
        res.status(500).json({ error: 'Failed to load user settings' });
    }
});

router.post('/account/settings', authenticateJWT, async (req, res) => {
    const usersCollection = req.app.locals.steam_users;
    const { steamId } = req.user;
    const { language, showNumbers, showText, readNews  } = req.body;

    const updateFields = {};
    if (language !== undefined) updateFields.language = language;
    if (showNumbers !== undefined) updateFields['settings.showNumbers'] = showNumbers;
    if (showText !== undefined) updateFields['settings.showText'] = showText;
    if (readNews !== undefined) updateFields['settings.readNews'] = readNews;

    try {
        await usersCollection.updateOne(
            { steamId },
            { $set: updateFields },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

router.get('/account/news/read', authenticateJWT, async (req, res) => {
    const usersCollection = req.app.locals.steam_users;
    const { steamId } = req.user;

    try {
        const userFromDb = await usersCollection.findOne({ steamId });
        const readNews = userFromDb?.settings?.readNews || [];
        res.json({ readNews });
    } catch (err) {
        console.error('Error fetching readNews:', err);
        res.status(500).json({ error: 'Failed to load read news' });
    }
});


router.post('/auth/logout', (req, res) => {
    res.clearCookie('jwtToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
    });

    res.status(200).json({ message: 'Logged out successfully' });
});





module.exports = router;
