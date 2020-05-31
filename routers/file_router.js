const express = require('express')
const fileUpload = require('express-fileupload')
const file_router = express.Router()
// const file = require('../services/file')
const { verify_user, verify_admin } = require('../services/auth')

file_router.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 },
}))

file_router.route('/upload')
.post(veryfy_user, async (req, res, next) => {
    try {
        console.log(req.body)
        if(!req.files) throw new Error('No file uploaded')
        let file = req.files.file
        console.log(file.name)
        const arr = file.name.split('_')
        console.log(arr)
        file.mv(`./${arr[0]}/${req.user.user_id}/${arr[1]}`)
        req.data = {
            name: file.name,
            mimetype: file.mimetype,
            size: file.size
        }
        next()
    } catch (err) {
        req.data = err
        next()
    }
})


module.exports = {
    file_router
}