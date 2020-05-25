const express = require('express')
const user_router = express.Router()
const bodyParser = require('body-parser')
const user = require('../services/user')
const { verify_user, verify_admin } = require('../services/auth')
const { success_res, fail_res } = require('../services/tool')

user_router.use(bodyParser.json())

user_router.route('/signup')
.post(async (req, res, next) => {
    try {
        req.data = await user.signup(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

user_router.route('/signin')
.post(async (req, res, next) => {
    try {
        req.data = await user.signin(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

user_router.route('/change_password')
.post(async (req, res, next) => {
    try {
        req.data = await user.change_password(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

user_router.route('/check_user_token')
.post(verify_user, (req, res, next) => {
    req.data = {}
    next()
})

user_router.route('/create_signup_otp')
.post(async (req, res, next) => {
    try {
        req.data = await user.create_signup_otp(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

user_router.route('/update_profile')
.post(verify_user, async (req, res, next) => {
    req.body.data.user = req.user
    req.data = await user.update_profile(req.body.data)
    next()
})

// user_router.route('/get_access_control')
// .post(verify_user, async (req, res, next) => {
//     let data = { ...req.body.data, user: req.user }
//     const resp = await user.get_access_control(data)
//     res.json(resp)
// })

// user_router.route('/get_menu')
// .post(verify_user, async (req, res, next) => {
//     let data = { ...req.body.data, user: req.user }
//     const resp = await user.get_menu(data)
//     res.json(resp)
// })

// user_router.route('/admin')
// .post(verify_admin, (req, res, next) => {
//     res.json(req.body)
// })

module.exports = {
    user_router
}