const db = require('./db')
const { execute_query } = require('./dao')
const moment = require('moment')

const list_carpark = data => {
    try {
        let { whereand, limit, offset, orderby, orderdirection } = data
        whereand = whereand || { carpark_id: { gt: 0 } }
        const condition = { where: { whereand }, limit, offset, orderby, orderdirection }
        return execute_query('get_item_by_condition', condition, 'carpark', db)
    } catch (err) {
        return err
    }
}

const list_all_carpark = () => execute_query('get_item_by_condition', { where: { carpark_id: { gt: 0 } }, limit: 'no' }, 'carpark', db)

const add_carpark = data => {
    try {
        let { carpark_name, carpark_code, address, postal_code, public_policy, billing_method, tenant_slot_total, tenant_slot_available, public_slot_total, public_slot_available, remarks, user } = data
        if (!carpark_name) throw new Error('carpark_name is required')
        if (!tenant_slot_total) throw new Error('tenant_slot_total is required')
        if (!public_slot_total) throw new Error('public_slot_total is required')
        public_policy = public_policy || 'ALLOW'
        billing_method = billing_method || 'CREDIT_CARD,PAYNOW,CHECK,GIRO'
        tenant_slot_available = tenant_slot_available || tenant_slot_total
        public_slot_available = public_slot_available || public_slot_total
        const item = { carpark_name, carpark_code, address, postal_code, public_policy, billing_method, tenant_slot_total, tenant_slot_available, public_slot_total, public_slot_available, remarks, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), status: 'ACTIVE' } 
        return execute_query('create_item', item, 'carpark', db)
    } catch (err) {
        return err
    }
}

const modify_carpark = async data => {
    try {
        const { carpark_id, carpark_name, carpark_code, address, postal_code, public_policy, billing_method, tenant_slot_total, tenant_slot_available, public_slot_total, public_slot_available, remarks, status, user } = data
        if (!carpark_id) throw new Error('carpark_id is required')
        const cpk = await execute_query('get_item_by_condition', { where: { carpark_id } }, 'carpark', db)
        if (!cpk || cpk.length === 0) throw new Error('carpark not found')
        const item = { condition: { carpark_name, carpark_code, address, postal_code, public_policy, billing_method, tenant_slot_total, tenant_slot_available, public_slot_total, public_slot_available, remarks, status, updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_by: user.username }, id: carpark_id }
        return execute_query('update_item_by_id', item, 'carpark', db)
    } catch (err) {
        return err
    }
}

const get_carpark_detail = data => {
    try {
        const { carpark_id } = data
        if (!carpark_id) throw new Error('carpark_id is required')
        const [carpark, season_rate] = await Promise.all([
            execute_query('get_item_by_condition', { where: { carpark_id } }, 'carpark', db),
            execute_query('get_item_by_condition', { where: { carpark_id } }, 'season_rate', db)
        ])
        return { ...carpark, season_rate }
    } catch (err) {
        return err
    }
}

const add_season_rate = data => {
    try {
        const { carpark_id, client_type, vehicle_type, rate, remarks, user } = data
        const item = { carpark_id, client_type, vehicle_type, rate, remarks, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('create_item', item, 'season_rate', db)
        return true
    } catch (err) {
        return err
    }
}

const modify_season_rate = data => {
    try {
        const { season_rate_id, client_type, vehicle_type, rate, remarks, status, user } = data
        const condition = { client_type, vehicle_type, rate, remarks, status, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('update_item_by_id', { id: season_rate_id, condition }, 'season_rate', db)
        return true
    } catch (err) {
        return err
    }
}

module.exports = {
    list_carpark,
    list_all_carpark,
    add_carpark,
    modify_carpark,
    get_carpark_detail,
    add_season_rate,
    modify_season_rate
}
