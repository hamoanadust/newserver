const express = require('express');
const carpark_router = express.Router();
const bodyParser = require('body-parser');
const carpark = require('../services/carpark');

carpark_router.use(bodyParser.json());

carpark_router.route('/')
.get((req, res, next) => {
    res.json('carpark router is serving');
});

carpark_router.route('/test')
.post(async (req, res, next) => {
    res.json(req.body.data);
});

carpark_router.route('/list_carpark')
.post(async (req, res, next) => {
    const resp = await carpark.list_carpark(req.body.data);
    res.json(resp);
});

carpark_router.route('/list_all_carpark')
.get(async (req, res, next) => {
    const resp = await carpark.list_all_carpark();
    res.json(resp);
});

module.exports = {
    carpark_router
};