require('dotenv').config();

const PASSWORD = process.env.PASSWORD;

const checkPassword = (req, res, next) => {
    const password = req.query.password;

    if (password !== PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Invalid password' });
    }

    next();
};

module.exports = checkPassword;
