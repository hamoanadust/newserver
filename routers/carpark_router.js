const express = require('express')
const carpark_router = express.Router()
const carpark = require('../services/carpark')
const { pass_user, verify_user, verify_admin } = require('../services/auth')

carpark_router.route('/list_carpark')
.post(async (req, res, next) => {
    try {
        req.data = await carpark.list_carpark(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/list_all_carpark')
.get(async (req, res, next) => {
    try {
        req.data = await carpark.list_all_carpark()
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/list_my_carpark')
.post(verify_user, async (req, res, next) => {
    try {
        req.data = await carpark.list_my_carpark()
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/add_carpark')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.add_carpark(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/modify_carpark')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.modify_carpark(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/get_carpark_detail')
.post(async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.get_carpark_detail(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/get_my_carpark_detail')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.get_my_carpark_detail(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/add_season_rate')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.add_season_rate(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/modify_season_rate')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.modify_season_rate(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/add_season_type')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.add_season_type(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

carpark_router.route('/list_season_type')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await carpark.list_season_type(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

module.exports = {
    carpark_router
}