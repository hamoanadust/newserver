const express = require('express')
const member_router = express.Router()
const bodyParser = require('body-parser')
const member = require('../services/member')
const { verify_user, verify_admin } = require('../services/auth')

member_router.use(bodyParser.json())

member_router.route('/apply_member')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await member.apply_member(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

member_router.route('/list_member')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await member.list_member(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

member_router.route('/approve_member')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await member.approve_member(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

member_router.route('/list_member_for_admin')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await member.list_member_for_admin(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

member_router.route('/create_member_batch')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await member.create_member_batch(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

member_router.route('/remove_member_batch')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await member.remove_member_batch(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

module.exports = {
    member_router
}