const express = require('express')
const vehicle_router = express.Router()
const vehicle = require('../services/vehicle')
const { verify_user, verify_admin } = require('../services/auth')

vehicle_router.route('/add_vehicle')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await vehicle.add_vehicle(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

vehicle_router.route('/list_all_vehicle')
.get(verify_user, async (req, res, next) => {
    try {
        req.data = await vehicle.list_all_vehicle({ user: req.user })
        next()
    } catch (err) {
        throw err
    }
})

vehicle_router.route('/list_vehicle')
.post(verify_user, async (req, res, next) => {
    try {
        req.data = await vehicle.list_vehicle({ user: req.user })
        next()
    } catch (err) {
        throw err
    }
})

vehicle_router.route('/remove_vehicle')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await vehicle.remove_vehicle(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

vehicle_router.route('/list_vehicle_for_admin')
.post(verify_admin, async (req, res, next) => {
    try {
        req.data = await vehicle.list_vehicle_for_admin(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

vehicle_router.route('/add_vehicle_for_admin')
.post(verify_admin, async (req, res, next) => {
    try {
        req.data = await vehicle.add_vehicle_for_admin(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

module.exports = {
    vehicle_router
}