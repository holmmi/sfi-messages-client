const express = require('express');
const router = express.Router();
const client = require('./SoapClient');

router.get('/tila', async function(req, res, next) {
    try {
        let result = await client.getServiceStatus();
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});

router.get('/asiakas/:tunnus', async function(req, res, next) {
    try {
        let result = await client.getCustomer(req.params.tunnus);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/laheta', async function(req, res, next) {
    try {
        let result = await client.sendMessage();
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;