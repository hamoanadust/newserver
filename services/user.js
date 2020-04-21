const db = require('./db')
const moment = require('moment')
const { execute_query } = require('./dao')
const { hash, compare } = require('./encrypt')
const auth = require('./auth')
const { success_res, fail_res } = require('./tool')

const signup = async data => {
    try {
        const { username, password, company, contact_number } = data
        if (!username) throw new Error('no username')
        else if (!password) throw new Error('no password')
        const hashed = await hash(password)
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db)
        if (exist.length > 0) {
            throw new Error('username already existed')
        } else {
            const user = { username, password: hashed, role: 'client', company, contact_number, created_at: moment().format('YYYY-MM-DD HH:mm:ss'), created_by: 'system' }
            await execute_query('create_item', user, 'user', db)
            return { username, company, contact_number }
        }
    } catch (err) {
        return err
    }
}

const signin = async data => {
    try {
        const { username, password } = data
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db)
        if (exist.length === 0) {
            throw new Error('username does not exist')
        } else {
            const check = await compare(password, exist[0].password)
            if (check) {
                const token = auth.get_token({user_id: exist[0].user_id})
                return token
            } else {
                throw new Error('password incorrect')
            }
        }
    } catch (err) {
        return err
    }
}

const change_password = async data => {
    try {
        const { username, old_password, new_password } = data
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db)
        if (exist.length === 0) {
            throw new Error('username does not exist')
        } else {
            const check = await compare(old_password, exist[0].password)
            if (check) {
                const hashed = await hash(new_password)
                await execute_query('update_item_by_id', { id: exist[0].user_id, condition: { password: hashed } }, 'user', db)
                return {}
            } else {
                throw new Error('old password incorrect')
            }
        }
    } catch (err) {
        return err
    }
}

module.exports = {
    signup,
    signin,
    change_password
}