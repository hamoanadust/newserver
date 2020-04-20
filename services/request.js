const db = require('./db')
const { execute_query } = require('./dao')
const moment = require('moment')

const list_all_request = async data => {
    try {
        let { user } = data
        const condition = {where: {user_id: user.user_id}}
        const resp = await execute_query('get_item_by_condition', condition, 'request', db)
        return resp
    } catch (err) {
        return err
    }
}

const list_request = data => {
    try {
        let { whereand, limit, offset, orderby, orderdirection, user } = data
        if (whereand) whereand.user_id = user.user_id
        else whereand = { user_id: user.user_id }
        const condition = {where: { whereand }, limit, offset, orderby, orderdirection}
        return execute_query('get_item_by_condition', condition, 'request', db)
    } catch (err) {
        return err
    }
}

const add_request = async data => {
    try {
        const { request_type, season_id, vehicle_number, card_type, card_number, recurring_billing, remarks, effective_datetime, user } = data
        const szn = await execute_query('get_item_by_condition', { where: { whereand: { season_id, holder_id: user.user_id, status: 'ACTIVE' } } }, 'season', db)
        if (!szn || szn.length === 0) throw new Error('season not found')
        const item = { request_type, season_id, vehicle_number, card_type, card_number, recurring_billing, remarks, effective_datetime, status: 'PENDING', user_id: user.user_id }
        return execute_query('create_item', item, 'request', db)
    } catch (err) {
        return err
    }
}

const change_request_status = async data => {
    try {
        const { request_id, status, user } = data
        const request = await execute_query('get_item_by_condition', { where: { whereand: { request_id, user_id: user.user_id } } }, 'request', db)
        if (!request || request.length === 0) throw new Error('request not found')
        return execute_query('update_item_by_id', { condition: { status, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }, id: request_id }, 'request', db)
    } catch (err) {
        throw err
    }
}

const change_request_status_by_admin = async data => {
    try {
        const { request_id, status, user } = data
        const request = await execute_query('get_item_by_condition', { where: { request_id } }, 'request', db)
        if (!request || request.length === 0) throw new Error('request not found')
        return execute_query('update_item_by_id', { condition: { status, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }, id: request_id }, 'request', db)
    } catch (err) {
        throw err
    }
}

module.exports = {
    list_all_request,
    list_request,
    add_request,
    change_request_status,
    change_request_status_by_admin
}

