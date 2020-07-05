const db = require('./db')
const moment = require('moment')
const { execute_query } = require('./dao')
const { hash, compare } = require('./encrypt')
const auth = require('./auth')
const { generate_random_integer } = require('./tool')
const { sendSMS } = require('./twilio')

const create_signup_otp = async data => {
    const { contact_number, phone_code } = data
    const value = generate_random_integer()
    await execute_query('create_item', { value, contact_number, otp_type: 'SIGNUP', status: 'NEW', updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }, 'otp', db)
    sendSMS({ body: `Your sign up OTP is ${value}`, phone: `+${phone_code}${contact_number}` })
    return value
}

const check_otp = async data => {
    const { otp, contact_number } = data
    const otp_data = await execute_query('get_item_by_condition', { where: { contact_number }, limit: 1, orderby: 'otp_id' }, 'otp', db)
    if (!otp_data || otp_data.length === 0) return { success: false, message: 'otp not exist' }
    else if (otp_data[0].status === 'EXPIRED') return { success: false, message: 'otp expired' }
    else if (otp_data[0].status === 'LOCK') return { success: false, message: '3 times wrong, otp expired' }
    else if (otp_data[0].value !== otp) {
        const status = otp_data[0].status === ('NEW' || 'VALID') ? '1-TIME-WRONG' : otp_data[0].status === '1-TIME-WRONG' ? '2-TIME-WRONG' : 'LOCK'
        const message = `otp incorrect, ${status === '1-TIME-WRONG' ? '2 times left' : status === '2-TIME-WRONG' ? '1 time left' : '3 times wrong, otp expired'}`
        await execute_query('update_item_by_id', { id: otp_data[0].otp_id, condition: { status } }, 'otp', db)
        return { success: false, message }
    } else {
        await execute_query('update_item_by_id', { id: otp_data[0].otp_id, condition: { status: 'VALID' } }, 'otp', db)
        return { success: true, message: 'otp valid' }
    }
}

const signup = async data => {
    try {
        const { username, password, company, contact_number, otp } = data
        const check = await check_otp({ otp, contact_number })
        if (!check.success) throw new Error(check.message)
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
                const { username, name, company, address, email, contact_number, phone_code, role } = exist[0]
                const token = auth.get_token({user_id: exist[0].user_id})
                return { username, name, company, address, email, contact_number, phone_code, role, token }
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

const reset_password = async data => {
    try {
        const { username } = data
        const exist = await execute_query('get_item', { condition: { username } }, 'user', db)
        if (exist.length === 0) {
            throw new Error('username does not exist')
        } else {
            const hashed = await hash('123456')
            await execute_query('update_item_by_id', { id: exist[0].user_id, condition: { password: hashed } }, 'user', db)
            return `password reset for user ${username}`
        }
    } catch (err) {
        return err
    }
}

const update_profile = async data => {
    try {
        const { name, company, email, contact_number, user } = data
        let condition = { name, company, email, contact_number }
        const resp = await execute_query('update_item_by_id', { id: user.user_id, condition }, 'user', db)
        return true
    } catch (err) {
        return err
    }
}

const list_user_for_admin = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection } = data
        where = where || { user_id: { gt: 0 } }
        const fields = ['user_id', 'username', 'name', 'email', 'company', 'contact_number', 'role', 'customer_id', 'announcement_dismiss', 'created_at', 'created_by']
        const user = await execute_query('get_item_by_condition', { fields, where, limit, offset, orderby, orderdirection }, 'user', db)
        return user
    } catch (err) {
        return err
    }
}

module.exports = {
    signup,
    signin,
    change_password,
    create_signup_otp,
    update_profile,
    reset_password,
    list_user_for_admin
}