const express = require('express')
const fileUpload = require('express-fileupload')
const file_router = express.Router()
const file = require('../services/file')
const { verify_user, verify_admin } = require('../services/auth')

file_router.use(fileUpload({
    createParentPath: true,
    // limits: { fileSize: 50 * 1024 * 1024 },
}))

file_router.route('/upload')
.post(async (req, res, next) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            })
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let file = req.files.file
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            file.mv('./uploads/' + file.name);

            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: file.name,
                    mimetype: file.mimetype,
                    size: file.size
                }
            })
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