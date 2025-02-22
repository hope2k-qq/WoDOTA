const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/ping', (req, res) => {
    res.status(200).send('hope2k 22.02.2025 OK OK');
});

const routes = require('./routes');

app.use('/', routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
