const fs = require('fs')

const upload = data => {
    try {
        const { files, user, body } = data
        if(!files) throw new Error('No file uploaded')
        const { file } = files
        const { user_id } = user
        const { carpark_id } = body
        const exist = fs.existsSync(`./uploads/${carpark_id}/${user_id}`)
        if (!exist) {
            console.log('mkdir', `./uploads/${carpark_id}/${user_id}`)
            fs.mkdirSync(`./uploads/${carpark_id}/${user_id}`)
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