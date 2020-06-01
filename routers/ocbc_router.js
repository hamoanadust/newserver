const express = require('express')
const ocbc_router = express.Router()
const bodyParser = require('body-parser')
const ocbc = require('../services/ocbc')
const { verify_user, verify_admin } = require('../services/auth')

ocbc_router.use(bodyParser.json())

ocbc_router.route('/paynow_qr')
.post(async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await ocbc.paynow_qr(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

module.exports = {
    ocbc_router
}