const db = require('./db')
const { execute_query, prepare_where } = require('./dao')
const moment = require('moment')

const list_carpark = async data => {
    try {
        let { where = { status: 'ACTIVE' }, limit, offset, orderby, orderdirection, user } = data
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : ''
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`
        const offsetion = offset ? `offset ${offset}` : ''
        const user_id = user ? user.user_id : undefined
        const sql = `
        select * from (
            select c.*, 
                sr.season_rate_id, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, 
                mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status, 
                st.file_type as st_file_type, 
                m.member_id, m.user_id,
                f.file_id as st_file_id, f.user_id as st_user_id, f.name as st_filename, f.mimetype as st_mimetype, f.size as st_size
                from carpark c 
                left join season_rate sr using (carpark_id) 
                left join member_type mt using (member_type_id) 
                left join season_type st on st.season_type_id = sr.season_type 
                left join member m on (m.member_type_id = mt.member_type_id and m.user_id = ${db.escape(user_id)}) 
                left join file f on (f.file_type = st.file_type and f.user_id = ${db.escape(user_id)})
            where c.status = 'ACTIVE' and sr.status = 'ACTIVE') as result
        where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const resp = await db.query(sql)
        let result = []
        resp.forEach(r => {
            let exist = result.find(e => e.carpark_id === r.carpark_id)
            const { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id, st_file_id, st_user_id, st_filename, st_mimetype, st_size, ...carpark } = r
            let applicable = true
            if (member_type_id && !member_id) {
                applicable = false
            }
            if (st_file_type && !st_file_id) {
                applicable = false
            }
            const season_rate = { applicable, season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id, st_file_id, st_user_id, st_filename, st_mimetype, st_size }
            if (exist) {
                if (season_rate_id) exist.season_rate.push(season_rate)
            } else {
                result.push({ ...carpark, season_rate: season_rate_id ? [ season_rate ] : [] })
            }
        })
        return result
    } catch (err) {
        return err
    }
}

// const list_carpark = async data => {
//     try {
//         let { where = { whereand: { status: 'ACTIVE', rate_status: 'ACTIVE' } }, limit, offset, orderby, orderdirection } = data
//         const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : ''
//         const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`
//         const offsetion = offset ? `offset ${offset}` : ''
//         const sql = `select * from (select c.*, sr.season_rate_id, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status, st.file_type as st_file_type from carpark c left join season_rate sr using (carpark_id) left join member_type mt using (member_type_id) left join season_type st on st.season_type_id = sr.season_type where c.status = 'ACTIVE' and sr.status = 'ACTIVE') as result where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
//         const resp = await db.query(sql)
//         let result = []
//         resp.forEach(r => {
//             let exist = result.find(e => e.carpark_id === r.carpark_id)
//             const { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, ...carpark } = r
//             if (exist) {
//                 if (season_rate_id) exist.season_rate.push({ season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type })
//             } else {
//                 result.push({ ...carpark, season_rate: season_rate_id ? [ { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type } ] : [] })
//             }
//         })
//         return result
//     } catch (err) {
//         return err
//     }
// }

const get_carpark_detail = data => list_carpark({ where: { carpark_id: data.carpark_id } })

const get_my_carpark_detail = data => list_my_carpark({ where: { carpark_id: data.carpark_id }, user: data.user })

const list_all_carpark = () => list_carpark({})

const list_my_carpark = async data => {
    try {
        let { where = { whereand: { status: 'ACTIVE', rate_status: 'ACTIVE' } }, limit, offset, orderby, orderdirection, user: { user_id } } = data
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : ''
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`
        const offsetion = offset ? `offset ${offset}` : ''
        const sql = `select * from (select c.*, sr.season_rate_id, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status, st.file_type as st_file_type, m.member_id, m.user_id from carpark c left join season_rate sr using (carpark_id) left join member_type mt using (member_type_id) left join season_type st on st.season_type_id = sr.season_type left join member m using(member_type_id) where c.status = 'ACTIVE' and sr.status = 'ACTIVE') as result where (member_type_id is null or user_id = ${db.escape(user_id)}) and (${prepare_where(where, db)}) ${order} ${limitation} ${offsetion}`
        const resp = await db.query(sql)
        let result = []
        resp.forEach(r => {
            let exist = result.find(e => e.carpark_id === r.carpark_id)
            const { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id, ...carpark } = r
            if (exist) {
                if (season_rate_id) exist.season_rate.push({ season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id })
            } else {
                result.push({ ...carpark, season_rate: season_rate_id ? [ { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id } ] : [] })
            }
        })
        return result
    } catch (err) {
        return err
    }
}

const add_carpark = data => {
    try {
        let { carpark_name, carpark_code, address, postal_code, public_policy = 'ALLOW', billing_method = 'CREDIT_CARD,PAYNOW,CHECK', allow_giro = 1, allow_auto_renew = 1, remarks, giro_form_id, allow_prorate, start_date, end_date, user } = data
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

// const get_carpark_detail = async data => {
//     try {
//         const { carpark_id } = data
//         if (!carpark_id) throw new Error('carpark_id is required')
//         const sql = `select * from (select c.*, sr.season_rate_id, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status, st.file_type as st_file_type from carpark c left join season_rate sr using (carpark_id) left join member_type mt using (member_type_id) left join season_type st on st.season_type_id = sr.season_type) as result where carpark_id = ${db.escape(carpark_id)} and status = 'ACTIVE' and rate_status = 'ACTIVE'`
//         const resp = await db.query(sql)
//         let result, season_rate = []
//         resp.forEach((r, i) => {
//             const { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, ...carpark } = r
//             if (season_rate_id) season_rate.push({ season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type })
//             if (i === 0) {
//                 result = carpark
//             }
//         })
//         result.season_rate = season_rate
//         return result
//     } catch (err) {
//         return err
//     }
// }

// const get_my_carpark_detail = async data => {
//     try {
//         const { carpark_id, user: { user_id } } = data
//         if (!carpark_id) throw new Error('carpark_id is required')
//         const sql = `select * from (select c.*, sr.season_rate_id, sr.vehicle_type, sr.season_type, sr.rate, sr.updated_at as rate_updated_at, sr.updated_by as rate_updated_by, sr.status as rate_status, sr.remarks as rate_remarks, mt.member_type_id, mt.file_type, mt.quota, mt.available, mt.status as member_type_status, st.file_type as st_file_type, m.member_id, m.user_id from carpark c left join season_rate sr using (carpark_id) left join member_type mt using (member_type_id) left join season_type st on st.season_type_id = sr.season_type left join member m using(member_type_id)) as result where carpark_id = ${db.escape(carpark_id)} and status = 'ACTIVE' and rate_status = 'ACTIVE' and (member_type_id is null or user_id = ${db.escape(user_id)})`
//         const resp = await db.query(sql)
//         let result, season_rate = []
//         resp.forEach((r, i) => {
//             const { season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id, ...carpark } = r
//             if (season_rate_id) season_rate.push({ season_rate_id, vehicle_type, season_type, rate, rate_updated_at, rate_updated_by, rate_status, rate_remarks, member_type_id, file_type, quota, available, member_type_status, st_file_type, member_id, user_id })
//             if (i === 0) {
//                 result = carpark
//             }
//         })
//         result.season_rate = season_rate
//         return result
//     } catch (err) {
//         return err
//     }
// }

const add_season_rate = async data => {
    try {
        const { carpark_id, vehicle_type, season_type, rate, member_type_id, remarks, user } = data
        const item = { carpark_id, vehicle_type, season_type, rate, member_type_id, remarks, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('create_item', item, 'season_rate', db)
        return true
    } catch (err) {
        return err
    }
}

const modify_season_rate = async data => {
    try {
        const { season_rate_id, vehicle_type, season_type, rate, member_type_id, remarks, status, user } = data
        const condition = { vehicle_type, season_type, rate, member_type_id, remarks, status, updated_by: user.username, updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('update_item_by_id', { id: season_rate_id, condition }, 'season_rate', db)
        return true
    } catch (err) {
        return err
    }
}

const add_season_type = async data => {
    try {
        const { season_type_id, file_type } = data
        const item = { season_type_id, file_type, status: 'ACTIVE', created_at: moment().format('YYYY-MM-DD HH:mm:ss'),updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }
        await execute_query('create_item', item, 'season_type', db)
        return true
    } catch (err) {
        return err
    }
}

const list_season_type = async data => {
    try {
        const condition = { where: { status: 'ACTIVE' } }
        const resp = await execute_query('get_item_by_condition', condition, 'season_type', db)
        return resp
    } catch (err) {
        return err
    }
}


module.exports = {
    list_carpark,
    list_all_carpark,
    list_my_carpark,
    add_carpark,
    modify_carpark,
    get_carpark_detail,
    get_my_carpark_detail,
    add_season_rate,
    modify_season_rate,
    add_season_type,
    list_season_type
}
