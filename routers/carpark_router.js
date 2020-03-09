const express = require('express')
const carpark_router = express.Router()
const carpark = require('../services/carpark')

carpark_router.route('/list_carpark')
.post(async (req, res, next) => {
    try {
        req.data = await carpark.list_carpark(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

carpark_router.route('/list_all_carpark')
.get(async (req, res, next) => {
    try {
        req.data = await carpark.list_all_carpark()
        next()
    } catch (err) {
        throw err
    }
})

module.exports = {
    carpark_router
}