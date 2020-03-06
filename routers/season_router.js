const express = require('express')
const season_router = express.Router()
const bodyParser = require('body-parser')
const db = require('../services/db')
const season = require('../services/season')
const { pass_user, verify_user, verify_admin } = require('../services/auth')

season_router.use(bodyParser.json())

season_router.route('/')
.get((req, res, next) => {
    req.body = 'season router is serving'
    next()
})

season_router.route('/test')
.post((req, res, next) => {
    next()
})


season_router.route('/find_season')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.find_season(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/add_season')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.add_season(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/add_season_with_invoice')
.post(pass_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.add_season_with_invoice(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/renew_season_with_invoice')
.post(verify_user, async (req, res, next) => {
    req.body.data.user = req.user
    const resp = await season.renew_season_with_invoice(req.body.data)
    res.json(resp)
})

season_router.route('/list_season')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.list_season(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/list_season_for_admin')
.post(verify_admin, async (req, res, next) => {
    const resp = await season.list_season_for_admin(req.body.data)
    res.json(resp)
})

module.exports = {
    season_router
}