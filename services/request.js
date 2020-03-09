const db = require('./db')
const { success_res, fail_res, fill_zero } = require('./tool')
const { execute_query } = require('./dao')
const moment = require('moment')

const list_request = async data => {
    try {
        let { whereand, limit, offset, orderby, orderdirection, user } = data
        if (whereand) whereand.user_id = user.user_id
        else whereand = { user_id: user.user_id }
        const condition = {where: { whereand }, limit, offset, orderby, orderdirection}
        const resp = await execute_query('get_item_by_condition', condition, 'request', db)
        return resp
    } catch (err) {
        return err
    }
}

const add_request = async data => {
    try {
        const { request_type, season_id, vehicle_number, card_type, card_number, recurring_billing, remarks, effective_datetime, user } = data
        const item = { request_type, season_id, vehicle_number, card_type, card_number, recurring_billing, remarks, effective_datetime, status: 'PENDING', user_id: user.user_id }
        const resp = await execute_query('create_item', item, 'request', db)
        return resp
    } catch (err) {
        return err
    }
}

const change_request_status = async data => {
    try {
        const { request_id, status, user } = data
        const request = await execute_query('get_item_by_condition', { where: { whereand: { request_id, user_id: user.user_id } } }, 'request', db)
        if (!request || request.length === 0) throw new Error('request not found')
        const resp = await execute_query('update_item_by_id', { condition: { status }, id: request_id }, 'request', db)
        return resp
    } catch (err) {
        throw err
    }
}

const change_request_status_by_admin = async data => {
    try {
        const { request_id, status } = data
        const resp = await execute_query('update_item_by_id', { condition: { status }, id: request_id }, 'request', db)
        return resp
    } catch (err) {
        throw err
    }
}

const cancel_request = data => {
    try {
        return change_request_status({...data, status: 'CANCELLED'})
    } catch (err) {
        return err
    }
}

const delete_request = data => {
    try {
        return change_request_status({...data, status: 'DELETED'})
    } catch (err) {
        return err
    }
}

module.exports = {
    list_request,
    add_request,
    change_request_status,
    change_request_status_by_admin,
    cancel_request,
    delete_request
}

