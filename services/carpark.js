const db = require('./db')
const { execute_query, prepare_where } = require('./dao')
const moment = require('moment')

const list_carpark = async data => {
    try {
        let { where = { status: 'ACTIVE' }, limit, offset, orderby, orderdirection } = data
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : ''
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`
        const offsetion = offset ? `offset ${offset}` : ''
        const sql = `select * from (select c.*, sr.season_rate_id, sr.client_type, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status from carpark c left join season_rate sr using (carpark_id) left join member_type mt using (member_type_id)) as result where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const resp = await db.query(sql)
        let result = []
        resp.forEach(r => {
            let exist = result.find(e => e.carpark_id === r.carpark_id)
            const { season_rate_id, client_type, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, ...carpark } = r
            if (exist) {
                exist.season_rate.push({ season_rate_id, client_type, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status })
            } else {
                result.push({ ...carpark, season_rate: [ { season_rate_id, client_type, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status } ] })
            }
        })
        return result
    } catch (err) {
        return err
    }
}

const list_all_carpark = () => list_carpark({})

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
        const sql = `select * from (select c.*, sr.season_rate_id, sr.client_type, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status from carpark c left join season_rate sr using (carpark_id) left join member_type mt using (member_type_id)) as result where carpark_id = ${db.escape(carpark_id)}`
        const resp = await db.query(sql)
        let result, season_rate = []
        resp.forEach((r, i) => {
            const { season_rate_id, client_type, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, ...carpark } = r
            season_rate.push({ season_rate_id, client_type, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status })
            if (i === 0) {
                result = carpark
            }
        })
        result.season_rate = season_rate
        return result
    } catch (err) {
        return err
    }
}

const add_season_rate = async data => {
    try {
        const { carpark_id, client_type, vehicle_type, season_type, rate, member_type_id, remarks, user } = data
        const item = { carpark_id, client_type, vehicle_type, season_type, rate, member_type_id, remarks, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('create_item', item, 'season_rate', db)
        return true
    } catch (err) {
        return err
    }
}

const modify_season_rate = async data => {
    try {
        const { season_rate_id, client_type, vehicle_type, season_type, rate, member_type_id, remarks, status, user } = data
        const condition = { client_type, vehicle_type, season_type, rate, member_type_id, remarks, status, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
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
