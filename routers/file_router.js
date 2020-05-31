const express = require('express')
const fileUpload = require('express-fileupload')
const file_router = express.Router()
const file = require('../services/file')
const { verify_user, verify_admin } = require('../services/auth')

file_router.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 },
}))

file_router.route('/upload_file')
.post(verify_user, async (req, res, next) => {
    try {
        req.data = await file.upload_file(req)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

file_router.route('/list_file')
.post(verify_admin, async (req, res, next) => {
    try {
        req.data = await file.list_file(req.body.data)
        next()
    } catch (err) {
        req.data = err
        next()
    }
})

file_router.route('/download_file/:id')
.get(verify_admin, async (req, res, next) => {
    try {
        const file_id = req.params.id
        const resp = await file.download_file({ file_id })
        const { file_path, name } = resp
        res.download(file_path, name)
    } catch (err) {
        req.data = err
        next()
    }
})


module.exports = {
    file_router
}