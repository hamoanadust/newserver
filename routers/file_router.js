const express = require('express')
const fileUpload = require('express-fileupload')
const file_router = express.Router()
const file = require('../services/file')
const { verify_user, verify_admin } = require('../services/auth')

file_router.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 },
}))

file_router.route('/upload')
.post(verify_user, async (req, res, next) => {
    try {
        req.data = await file.upload(req)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})


module.exports = {
    file_router
}