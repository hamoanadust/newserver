const db = require('./db')
const moment = require('moment')
const { execute_query } = require('./dao')
const { hash, compare } = require('./encrypt')
const auth = require('./auth')
const { generate_random_integer } = require('./tool')

const create_signup_otp = async data => {
    const { contact_number } = data
    const value = generate_random_integer()
    await execute_query('create_item', { value, contact_number, otp_type: 'SIGNUP', status: 'NEW', updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }, 'otp', db)
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

const get_announcement = async data => {
    try {
        const { user } = data
        const { user_id } = user

        const condition = { where: { status: 'ACTIVE' }, orderby: 'announcement_id', orderdirection: 'desc', limit: 1 }
        const [announcement, userData] = await Promise.all([
            execute_query('get_item_by_condition', condition, 'announcement', db),
            execute_query('get_item_by_condition', { where: { user_id } }, 'user', db)
        ]) 
        return userData[0].announcement_dismiss || !announcement || announcement.length === 0 ? [] : announcement[0]
    } catch (err) {
        return err
    }
}

const dismiss_announcement = async data => {
    try {
        const { user } = data
        let condition = { announcement_dismiss: true }
        const resp = await execute_query('update_item_by_id', { id: user.user_id, condition }, 'user', db)
        return true
    } catch (err) {
        return err
    }
}

const create_announcement_inactive = async data => {
    try {
        const { content } = data
        const announcement = await execute_query('create_item', { content }, 'announcement', db)
        return { announcement_id: announcement.insertId }
    } catch (err) {
        return err
    }
}

const create_announcement_active = async data => {
    try {
        const { content } = data
        const announcement = await create_announcement_inactive({ content })
        const { announcement_id } = announcement
        const activation = await active_announcement({ announcement_id })
        return activation
    } catch (err) {
        return err
    }
}

const active_announcement = async data => {
    try {
        const { announcement_id } = data
        await Promise.all([
            execute_query('update_item_by_id', { where: { status: 'ACTIVE' }, condition: { status: 'INACTIVE' } }, 'announcement', db),
            execute_query('update_item_by_id', { where: { announcement_dismiss: true }, condition: { announcement_dismiss: false } }, 'user', db)
        ])
        const resp = await execute_query('update_item_by_id', { id: announcement_id, condition: { status: 'ACTIVE' } }, 'announcement', db)
        return true
    } catch (err) {
        return err
    }
}

const inactive_announcement = async data => {
    try {
        const { announcement_id } = data
        const resp = await execute_query('update_item_by_id', { id: announcement_id, condition: { status: 'INACTIVE' } }, 'announcement', db)
        return true
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
    get_announcement,
    dismiss_announcement,
    create_announcement_inactive,
    create_announcement_active,
    active_announcement,
    inactive_announcement
}