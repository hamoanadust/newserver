const express = require('express')
const vehicle_router = express.Router()
const bodyParser = require('body-parser')
const vehicle = require('../services/vehicle')
const { pass_user, verify_user, verify_admin } = require('../services/auth')

vehicle_router.use(bodyParser.json())

vehicle_router.route('/')
.get((req, res, next) => {
    res.json('vehicle router is serving')
})

vehicle_router.route('/test')
.post(async (req, res, next) => {
    res.json(req.body.data)
})

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

vehicle_router.route('/list_vehicle')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data = { user: req.user }
        req.data = await vehicle.list_vehicle(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

vehicle_router.route('/list_vehicle_for_admin')
.post(verify_admin, async (req, res, next) => {
    const resp = await vehicle.list_vehicle_for_admin(req.body.data)
    res.json(resp)
})

vehicle_router.route('/add_vehicle_for_admin')
.post(verify_admin, async (req, res, next) => {
    const resp = await vehicle.add_vehicle_for_admin(req.body.data)
    res.json(resp)
})

module.exports = {
    vehicle_router
}