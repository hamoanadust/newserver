const fs = require('fs')
const path = require("path")
const { generate_random_integer } = require('./tool')
const db = require('./db')
const { execute_query, prepare_where } = require('./dao')
const moment = require('moment')

const upload_file = async data => {
    try {
        const { files, user, body } = data
        if(!files) throw new Error('No file uploaded')
        const { file } = files
        const { user_id } = user
        let { carpark_id, file_type } = body
        file_type = file_type || 'TENANT_FILE'
        const { name, mimetype, size } = file
        
        if (!fs.existsSync(path.join(__dirname, `/../uploads/${carpark_id}`))) fs.mkdirSync(path.join(__dirname, `/../uploads/${carpark_id}`), { recursive: true })
        if (!fs.existsSync(path.join(__dirname, `/../uploads/${carpark_id}/${user_id}`))) fs.mkdirSync(path.join(__dirname, `/../uploads/${carpark_id}/${user_id}`), { recursive: true })
        const file_name = `${name}${generate_random_integer()}`
        const file_path = path.join(__dirname, `/../uploads/${carpark_id}/${user_id}`) + file_name
        file.mv(`./uploads/${carpark_id}/${user_id}/${file_name}`)
        const createFile = await create_file({ file_name, name, mimetype, size, carpark_id, user_id, file_path, file_type })
        return createFile
    } catch(err) {
        return err
    }
}

const create_file = async data => {
    try {
        const { file_name, name, mimetype, size, carpark_id, user_id, file_path, file_type } = data
        const item = { file_name, name, mimetype, size, carpark_id, user_id, file_path, file_type, status: 'ACTIVE', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        const file = await execute_query('create_item', item, 'file', db)
        return { ...item, file_id: file.insertId }
    } catch(err) {
        throw err
    }
}

const list_file = async data => {
    try {
        const { where, limit, offset, orderby, orderdirection } = data
        const files = await execute_query('get_item_by_condition', { where, limit, offset, orderby, orderdirection }, 'file', db)
        return files
    } catch(err) {
        return err
    }
}

const download_file = async data => {
    try {
        const { file_id } = data
        const resp = await execute_query('get_item_by_condition', { where: { file_id } }, 'file', db)
        if (!resp || resp.length === 0) throw new Error('file not found')
        const { name, file_name, file_path } = resp[0]
        console.log(name, file_name, file_path)
        return { name, file_name, file_path }
    } catch(err) {
        return err
    }
}

module.exports = {
    upload_file,
    list_file,
    download_file
}