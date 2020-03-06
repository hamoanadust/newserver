const db = require('./db');
const { execute_query } = require('./dao');
const moment = require('moment');

let carpark, stations, tariffs, public_holidays;

//functions
const clear_cache = () => {
    carpark = undefined;
    stations = undefined;
    tariffs = undefined;
    public_holidays = undefined;
}

const get_carpark = async () => {
    console.log('carpark get called');
    try {
        const resp = await execute_query('get_item', {}, 'carpark', db);
        return resp[0];
    } catch (err) {
        console.log('get_carpark err', err);
        throw(err);
    }
}

const get_stations = async () => {
    console.log('get_stations get called');
    try {
        const resp = await execute_query('get_items', {}, 'station_related', db);
        return resp;
    } catch (err) {
        console.log('get_stations err', err);
        throw(err);
    }
}

const get_tariffs = async () => {
    console.log('get tariffs get called!');
    try {
        const resp = await execute_query('get_items', {status: 'ACTIVE'}, 'tariff', db);
        return resp;
    } catch (err) {
        console.log('get_tariffs err', err);
        throw(err);
    }
}

const get_public_holidays = async () => {
    console.log('ph get called');
    try {
        const year = moment().format('YYYY');
        const resp = await execute_query('get_items', {year}, 'public_holiday', db);
        return resp;
    } catch (err) {
        console.log('get_public_holidays err', err);
        throw(err);
    }
}

//middlewares for http request
const mid_carpark = async (req, res, next) => {
    carpark = carpark || await get_carpark();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.carpark = carpark;
    next();
}

const mid_stations = async (req, res, next) => {
    stations = stations || await get_stations();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.stations = stations;
    next();
}

const mid_tariffs = async (req, res, next) => {
    tariffs = tariffs || await get_tariffs();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.tariffs = tariffs;
    next();
}

const mid_public_holidays = async (req, res, next) => {
    public_holidays = public_holidays || await get_public_holidays();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.public_holidays = public_holidays;
    next();
}

//middlewares for tcp requests
const io_carpark = async (req, next) => {
    carpark = carpark || await get_carpark();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.carpark = carpark;
    next();
}

const io_stations = async (req, next) => {
    stations = stations || await get_stations();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.stations = stations;
    next();
}

const io_tariffs = async (req, next) => {
    tariffs = tariffs || await get_tariffs();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.tariffs = tariffs;
    next();
}

const io_public_holidays = async (req, next) => {
    public_holidays = public_holidays || await get_public_holidays();
    req.body = req.body || {};
    req.body.data = req.body.data || {};
    req.body.data.public_holidays = public_holidays;
    next();
}

module.exports = {
    clear_cache,
    mid_carpark,
    mid_stations,
    mid_tariffs,
    mid_public_holidays,
    io_carpark,
    io_stations,
    io_tariffs,
    io_public_holidays,
    get_carpark, 
    get_stations, 
    get_tariffs, 
    get_public_holidays
}