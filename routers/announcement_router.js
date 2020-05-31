const express = require('express')
const announcement_router = express.Router()
const bodyParser = require('body-parser')
const announcement = require('../services/announcement')
const { verify_user, verify_admin } = require('../services/auth')

announcement_router.use(bodyParser.json())

announcement_router.route('/get_announcement')
.post(verify_user, async (req, res, next) => {
    req.body = req.body || {}
    req.body.data = req.body.data || {}
    req.body.data.user = req.user
    req.data = await announcement.get_announcement(req.body.data)
    next()
})

announcement_router.route('/dismiss_announcement')
.post(verify_user, async (req, res, next) => {
    req.body = req.body || {}
    req.body.data = req.body.data || {}
    req.body.data.user = req.user
    req.data = await announcement.dismiss_announcement(req.body.data)
    next()
})

announcement_router.route('/create_announcement_active')
.post(verify_admin, async (req, res, next) => {
    req.body.data.user = req.user
    req.data = await announcement.create_announcement_active(req.body.data)
    next()
})

announcement_router.route('/create_announcement_inactive')
.post(verify_admin, async (req, res, next) => {
    req.body.data.user = req.user
    req.data = await announcement.create_announcement_inactive(req.body.data)
    next()
})

announcement_router.route('/active_announcement')
.post(verify_admin, async (req, res, next) => {
    req.body.data.user = req.user
    req.data = await announcement.active_announcement(req.body.data)
    next()
})

announcement_router.route('/inactive_announcement')
.post(verify_admin, async (req, res, next) => {
    req.body.data.user = req.user
    req.data = await announcement.inactive_announcement(req.body.data)
    next()
})

announcement_router.route('/list_announcement')
.post(verify_admin, async (req, res, next) => {
    req.body.data.user = req.user
    req.data = await announcement.list_announcement(req.body.data)
    next()
})

module.exports = {
    announcement_router
}