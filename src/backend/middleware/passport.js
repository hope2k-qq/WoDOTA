const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
require('dotenv').config();

passport.use(new SteamStrategy({
    returnURL: `${process.env.BACKEND_URL}/auth/steam/return`,
    realm: `${process.env.BACKEND_URL}`,
    apiKey: process.env.STEAM_API_KEY
}, (identifier, profile, done) => {
    profile.identifier = identifier;
    return done(null, profile);
}));

module.exports = passport;
