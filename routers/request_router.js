const express = require('express')
const request_router = express.Router()
const request = require('../services/request')
const { pass_user, verify_user, verify_admin } = require('../services/auth')

request_router.route('/list_all_request')
.get(verify_user, async (req, res, next) => {
    try {
        req.data = await request.list_all_request({ user: req.user })
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/list_request')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.list_request(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/add_request')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.add_request(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/cancel_request')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.change_request_status({ ...req.body.data, status: 'CANCELLED' })
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/delete_request')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.change_request_status({ ...req.body.data, status: 'DELETED' })
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/approve_request')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.change_request_status_by_admin({ ...req.body.data, status: 'APPROVED' })
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/reject_request')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.change_request_status_by_admin({ ...req.body.data, status: 'REJECTED' })
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

request_router.route('/effect_request')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await request.effect_request(req.body.data)
        console.log('req data', req.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

module.exports = {
    request_router
}