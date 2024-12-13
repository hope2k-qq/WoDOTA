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

const routes = require('./routes');

app.use('/', routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
