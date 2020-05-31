const fs = require('fs')
const path = require("path")

const upload = data => {
    try {
        const { files, user, body } = data
        if(!files) throw new Error('No file uploaded')
        const { file } = files
        const { user_id } = user
        const { carpark_id } = body
        const exist = fs.existsSync(path.join(__dirname, `/../uploads/${carpark_id}/${user_id}`))
        if (!exist) {
            console.log(path.join(__dirname, `/../uploads/${carpark_id}/${user_id}`))
            fs.mkdirSync(path.join(__dirname, `/../uploads/${carpark_id}/${user_id}`), { recursive: true })
            console.log('mkdir', `./uploads/${carpark_id}/${user_id}`)
        }
        file.mv(`./uploads/${carpark_id}/${user_id}/${file.name}`)
        return {
            name: file.name,
            mimetype: file.mimetype,
            size: file.size
        }
    } catch(err) {
        return err
    }
}

module.exports = {
    upload
}