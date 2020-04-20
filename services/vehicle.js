const db = require('./db')
const moment = require('moment')
const { execute_query } = require('./dao')

const get_vehicle_by_condition = async data => {
    try {
        const { condition } = data
        const resp = await execute_query('get_item_by_condition', condition, 'vehicle', db)
        return resp
    } catch (err) {
        throw(err)
    }
}

const list_all_vehicle = async data => {
    try {
        let { user } = data
        const condition = {where: {user_id: user.user_id}}
        const resp = await get_vehicle_by_condition({condition})
        return resp
    } catch (err) {
        return err
    }
}

const list_vehicle = async data => {
    try {
        let { whereand, limit, offset, orderby, orderdirection, user } = data
        if (whereand) whereand.user_id = user.user_id
        else whereand = { user_id: user.user_id }
        const condition = {where: { whereand }, limit, offset, orderby, orderdirection};
        const resp = await get_vehicle_by_condition({condition})
        return resp
    } catch (err) {
        return err
    }
}

const list_vehicle_for_admin = async data => {
    try {
        let { condition } = data
        if (!condition) condition = {where: {vehicle_id: {gt: 0}}}
        const resp = await get_vehicle_by_condition({condition})
        return resp
    } catch (err) {
        return err
    }
}

const add_vehicle = async data => {
    try {
        let { vehicle_number, vehicle_type, card_number, card_type, user } = data
        const { user_id } = user
        const condition = {where: {whereand: {vehicle_number, user_id}}}
        const exist_vehicle = await get_vehicle_by_condition({condition})
        if (exist_vehicle && exist_vehicle.length > 0) {
            throw new Error('vehicle already exist')
        } else {
            vehicle_type = vehicle_type || 'CAR'
            card_type = card_type || 'IU'
            const item = { vehicle_number, vehicle_type, card_number, card_type, user_id }
            await execute_query('create_item', item, 'vehicle', db)
            return {}
        }
    } catch (err) {
        return err
    }
}

const add_vehicle_for_admin = async data => {
    try {
        let { vehicle_number, vehicle_type, card_number, card_type, user_id } = data
        if (!vehicle_number || !card_number || !user_id) throw new Error('vehicle number, card number and user id are required')
        const condition = {where: {whereand: {vehicle_number, user_id}}}
        const exist_vehicle = await get_vehicle_by_condition({condition})
        if (exist_vehicle && exist_vehicle.length > 0) {
            throw new Error('vehicle already exist')
        } else {
            vehicle_type = vehicle_type || 'CAR'
            card_type = card_type || 'IU'
            const item = { vehicle_number, vehicle_type, card_number, card_type, user_id }
            await execute_query('create_item', item, 'vehicle', db)
            return {}
        }
    } catch (err) {
        return err
    }
}

module.exports = {
    get_vehicle_by_condition,
    list_all_vehicle,
    list_vehicle,
    list_vehicle_for_admin,
    add_vehicle,
    add_vehicle_for_admin
}
