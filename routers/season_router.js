const express = require('express')
const season_router = express.Router()
const season = require('../services/season')
const giro = require('../services/giro')
const { pass_user, verify_user, verify_admin } = require('../services/auth')

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

season_router.route('/add_season_by_admin')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.add_season_by_admin(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/add_season_by_admin_batch')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.add_season_by_admin_batch(req.body.data)
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
    try {
        req.body.data.user = req.user
        req.data = await season.renew_season_with_invoice(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/renew_season_batch')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.renew_season_batch(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/list_all_season')
.get(verify_user, async (req, res, next) => {
    try {
        req.data = await season.list_all_season({ holder_id: req.user.user_id })
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/list_season')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data = req.body.data || {}
        req.body.data.user = req.user
        req.data = await season.list_season(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/terminate_season')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data = req.body.data || {}
        req.body.data.user = req.user
        req.data = await season.terminate_season(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/terminate_season_batch')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data = req.body.data || {}
        req.body.data.user = req.user
        req.data = await season.terminate_season_batch(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/list_season_for_admin')
.post(verify_admin, async (req, res, next) => {
    try {
        req.data = await season.list_season_for_admin(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/auto_renew')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.auto_renew(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/set_auto_renew')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await season.set_auto_renew(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/add_giro_form')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await giro.add_giro_form(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/list_giro')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await giro.list_giro(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/giro_success')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await giro.giro_success(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

season_router.route('/update_giro')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await giro.update_giro(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

module.exports = {
    season_router
}