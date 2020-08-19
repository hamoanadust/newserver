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
        let { carpark_name, carpark_code, address, postal_code, public_policy = 'ALLOW', billing_method = 'CREDIT_CARD,PAYNOW,CHECK', allow_giro, allow_auto_renew, remarks, giro_form_id, allow_prorate, start_date, end_date, user } = data
        if (!carpark_name) throw new Error('carpark_name is required')
        else if (!start_date) throw new Error('start_date is required')
        else if (!end_date) throw new Error('end_date is required')
        else if (moment(start_date).isAfter(moment(end_date))) throw new Error('start date is after end date')
        // allow_auto_renew = allow_auto_renew || false
        // allow_giro = allow_giro || false
        // allow_prorate = allow_prorate || false
        const item = { carpark_name, carpark_code, address, postal_code, public_policy, billing_method, allow_giro, allow_auto_renew, remarks, giro_form_id, allow_prorate, start_date, end_date, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), status: 'ACTIVE' } 
        return execute_query('create_item', item, 'carpark', db)
    } catch (err) {
        return err
    }
}

const modify_carpark = async data => {
    try {
        const { carpark_id, carpark_name, carpark_code, address, postal_code, public_policy, billing_method, allow_giro, allow_auto_renew, remarks, giro_form_id, allow_prorate, start_date, end_date, status, user } = data
        if (!carpark_id) throw new Error('carpark_id is required')
        const cpk = await execute_query('get_item_by_condition', { where: { carpark_id } }, 'carpark', db)
        if (!cpk || cpk.length === 0) throw new Error('carpark not found')
        const item = { condition: { carpark_name, carpark_code, address, postal_code, public_policy, billing_method, allow_giro, allow_auto_renew, remarks, giro_form_id, allow_prorate, start_date, end_date, status, updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_by: user.username }, id: carpark_id }
        return execute_query('update_item_by_id', item, 'carpark', db)
    } catch (err) {
        return err
    }
}

const get_carpark_detail = async data => {
    try {
        const { carpark_id } = data
        if (!carpark_id) throw new Error('carpark_id is required')
        const [carpark, season_rate] = await Promise.all([
            execute_query('get_item_by_condition', { where: { carpark_id } }, 'carpark', db),
            execute_query('get_item_by_condition', { where: { carpark_id } }, 'season_rate', db)
        ])
        return { ...carpark[0], season_rate }
    } catch (err) {
        return err
    }
}

const add_season_rate = async data => {
    try {
        const { carpark_id, client_type, vehicle_type, season_type, rate, total_lot, available_lot, remarks, user } = data
        const item = { carpark_id, client_type, vehicle_type, season_type, rate, total_lot, available_lot, remarks, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('create_item', item, 'season_rate', db)
        return true
    } catch (err) {
        return err
    }
}

const modify_season_rate = async data => {
    try {
        const { season_rate_id, client_type, vehicle_type, season_type, rate, total_lot, available_lot, remarks, status, user } = data
        const condition = { client_type, vehicle_type, season_type, rate, total_lot, available_lot, remarks, status, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
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
