const express = require('express');
const http = require('http');

const app = express();
const soapRouter = require('./soapRouter');

app.use('/api/ws/', soapRouter);
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

const server = http.createServer(app);
server.listen(80);