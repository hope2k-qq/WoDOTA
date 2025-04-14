const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
const { updateVotesData } = require('./controllers/votesController');
const { updateDataSequentially } = require('./controllers/leaderboardController');
const { updateDataSequentiallyTournament } = require('./controllers/tournamentsController');

// const allowedTokens = ['your-secure-token'];

// app.use((req, res, next) => {
//     const token = req.headers['authorization'];
//
//     if (!allowedTokens.includes(token)) {
//         return res.status(403).json({ message: 'Не авторизован' }); 
//     }
//
//     next(); 
// });

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Не разрешено по CORS'), false);
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const uri = process.env.MONGODB_URI;

const startServer = async () => {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        const db = client.db('BuildDB');
        app.locals.db = db.collection('builds');
        app.locals.sitemap = db.collection('sitemap');
        
        const routes = require('./routes');
        app.use('/', routes);
        
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);

            setInterval(async () => {
                await updateVotesData(app.locals.sitemap);
            }, 5 * 60 * 1000);
            // setInterval(async () => {
            //     await updateDataSequentially(app.locals.sitemap);
            // }, 10 * 60 * 1000);
            // setInterval(async () => {
            //     await updateDataSequentiallyTournament(app.locals.sitemap);
            // }, 999 * 60 * 1000);
            async function runSequentially() {
                try {
                    await updateVotesData(app.locals.sitemap);
                    // await updateDataSequentially(app.locals.sitemap);
                    // await updateDataSequentiallyTournament(app.locals.sitemap)
                } catch (err) {
                    console.error("Ошибка при выполнении операций:", err);
                }
            }
            runSequentially();
        });
        
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

(async () => {
    try {
        await startServer();
    } catch (error) {
        console.error("Error starting the server:", error);
    }
})();

app.get('/ping', (req, res) => {
    res.status(200).send('hope2k 22.02.2025 OK OK');
});

module.exports = app;
