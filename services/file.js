const fs = require('fs')
const path = require("path")
const { generate_random_integer } = require('./tool')
const db = require('./db')
const { execute_query, prepare_where } = require('./dao')
const moment = require('moment')

const upload = async data => {
    try {
        const { files, user: { user_id } } = data
        if(!files) throw new Error('No file uploaded')
        const arr = []
        const index = [1,2,3,4,5]
        index.forEach(i => {
            if (files[`f${i}`] && data[`t${i}`]) {
                arr.push({ file: files[`f${i}`], file_type: data[`t${i}`] })
            }
        })
        if(arr.length === 0) throw new Error('please supply proper file and file_type')
        return Promise.all(arr.map(e => {
            const { file: { name, mimetype, size }, file_type } = e
            if (!fs.existsSync(path.join(__dirname, `/../../uploads/${user_id}`))) fs.mkdirSync(path.join(__dirname, `/../../uploads/${user_id}`), { recursive: true })
            const file_name = `${name}${generate_random_integer()}`
            const file_path = path.join(__dirname, `/../../uploads/${user_id}/`) + file_name
            e.file.mv(`./uploads/${user_id}/${file_name}`)
            return create_file({ file_name, name, mimetype, size, user_id, file_path, file_type })
        }))
    } catch(err) {
        throw err
    }
}

const upload_file = async data => {
    try {
        let { files, user, body: { t1, t2, t3, t4, t5 } } = data
        return upload({ files, user, t1, t2, t3, t4, t5 })
    } catch(err) {
        return err
    }
}

const upload_file_for_admin = async data => {
    try {
        return upload(data)
    } catch(err) {
        return err
    }
}


const create_file = async data => {
    try {
        const { file_name, name, mimetype, size, user_id, file_path, file_type } = data
        const item = { file_name, name, mimetype, size, user_id, file_path, file_type, status: 'ACTIVE', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
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
        return { name, file_name, file_path }
    } catch(err) {
        throw err
    }
}

const download_giro_form = async data => {
    try {
        const { file_id } = data
        const resp = await execute_query('get_item_by_condition', { where: { whereand: { file_id, file_type: 'GIRO_FORM' } } }, 'file', db)
        if (!resp || resp.length === 0) throw new Error('file not found')
        const { name, file_name, file_path } = resp[0]
        return { name, file_name, file_path }
    } catch(err) {
        throw err
    }
}

module.exports = {
    upload_file,
    list_file,
    download_file,
    download_giro_form,
    upload_file_for_admin
}