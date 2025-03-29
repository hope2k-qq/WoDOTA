const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

const allowedTokens = ['your-secure-token'];

// app.use((req, res, next) => {
//     const token = req.headers['authorization'];
//
//     if (!allowedTokens.includes(token)) {
//         return res.status(403).json({ message: 'Не авторизован' }); 
//     }
//
//     next(); 
// });

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

MongoClient.connect(uri)
    .then(client => {
        console.log("Connected to MongoDB");
        
        const db = client.db('BuildDB');
        app.locals.db = db.collection('builds');
    })
    .catch(error => {
        console.error("Error connecting to MongoDB:", error);
    });
app.get('/ping', (req, res) => {
    res.status(200).send('hope2k 22.02.2025 OK OK');
});

const routes = require('./routes');

app.use('/', routes);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
