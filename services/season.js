const db = require('./db')
const { success_res, fail_res, fill_zero } = require('./tool')
const { execute_query } = require('./dao')
const moment = require('moment')

const find_season = async data => {
    try {
        const { card_type, card_number, vehicle_number, user } = data
        const condition = {
            where: {
                whereand: {
                    whereor: {
                        whereand: {card_type, card_number},
                        vehicle_number
                    },
                    holder_id: user.user_id
                }
            },
            limit: 1
        }
        const resp = await execute_query('get_item_by_condition', condition, 'season', db)
        return resp
    } catch (err) {
        return err
    }
}

const prepare_season_invoice_data_for_renew = data => {
    try {
        let { season_id, end_date, attn, invoice_number, invoice_date, user } = data
        if (!season_id) throw new Error('no season id')
        else if (!end_date) throw new Error('no end date')
        const szn = await execute_query('get_item_by_condition', { where: { season_id } }, 'season', db)
        if (!szn || szn.length === 0) throw new Error('no season')
        else if (moment(szn[0].end_date).isAfter(moment(end_date))) throw new Error('renew end date is before previous end date')
        const [carpark, season_rate] = await Promise.all([
            execute_query('get_item_by_condition', {where: {carpark_id: szn[0].carpark_id}}, 'carpark', db),
            execute_query('get_item_by_condition', {where: {whereand: {carpark_id: szn[0].carpark_id, vehicle_type: szn[0].vehicle_type, client_type: szn[0].holder_type, status: 'ACTIVE'}}, limit: 1}, 'season_rate', db)
        ])
        if (!carpark || carpark.length === 0) throw new Error('no carpark')
        if (!season_rate || season_rate.length === 0) throw new Error('no season rate')
        const { carpark_id, carpark_name, carpark_address } = carpark[0]
        attn = attn || 'system'
        invoice_date = invoice_date || moment().format('YYYY-MM-DD')
        const rate = season_rate[0].rate
        const months = moment(end_date).diff(moment(szn[0].end_date), 'month')
        const invoice_amount = months * rate

        const season_data = { end_date }
        const invoice_data = {invoice_number, invoice_date, invoice_type: 'RENEW', invoice_amount, attn, carpark_id, carpark_name, carpark_address, 
        buyer_id: holder_id, buyer_name: holder_name, buyer_company: holder_company, buyer_address: holder_address, buyer_email: holder_email, buyer_contact_number: holder_contact_number, 
        supplier_name, supplier_address, supplier_email, supplier_contact_number, supplier_fax, supplier_uen, supplier_rcb,
        status: 'OUTSTANDING', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), created_by: 'system', updated_by: 'system', months}
    
    } catch (err) {
        throw err
    }
}

const prepare_season_invoice_data = async data => {
    try {
        let { carpark_id, card_number, start_date, end_date, //required
            card_type, vehicle_type, holder_type, attn, invoice_number, invoice_date, vehicle_id, //optional wtth a default value
            vehicle_number, holder_id, holder_name, holder_company, holder_address, holder_contact_number, holder_email,//optional
            user } = data//from middleware
        console.log('user', user)
        //validation
        if (!carpark_id) throw new Error('no carpark id')
        else if (!card_number) throw new Error('no card number')
        else if (!start_date) throw new Error('no start date')
        else if (!end_date) throw new Error('no end date')
        else if (moment(start_date).isAfter(moment(end_date))) throw new Error('start date is after end date')
        //set default value
        card_type = card_type || 'IU'
        vehicle_type = vehicle_type || 'CAR'
        holder_type = holder_type || 'PUBLIC'
        //get carpark, season_rate, system_config, vehicle data
        const [carpark, season_rate, system_config, vehicle, holder_data] = await Promise.all([
            execute_query('get_item_by_condition', {where: {carpark_id}}, 'carpark', db),
            execute_query('get_item_by_condition', {where: {whereand: {carpark_id, vehicle_type, client_type: holder_type, status: 'ACTIVE'}}, limit: 1}, 'season_rate', db),
            execute_query('get_item_by_condition', {where: {type: 'COMPANY_INFO'}}, 'system_config', db),
            vehicle_id ? execute_query('get_item_by_condition', {where: {vehicle_id}}, 'vehicle', db) : undefined,
            holder_id ? execute_query('get_item_by_condition', {where: {user_id: holder_id}, limit: 1}, 'user', db) : undefined,
        ])
        const holder = holder_data && holder_data.length === 1 ? holder_data[0] : undefined
        //validation again
        if (!carpark || carpark.length === 0) throw new Error('no carpark')
        else if (!season_rate || season_rate.length === 0) throw new Error('no season rate')
        else if (!system_config) throw new Error('no system config')
        //set default value again
        attn = attn || 'system'
        invoice_date = invoice_date || moment().format('YYYY-MM-DD')
        vehicle_number = vehicle_number || (vehicle && vehicle.length === 1 ? vehicle[0].vehicle_number : '')
        holder_id = holder_id || (user ? user.user_id : undefined)
        holder_name = holder_name || (holder ? holder.name : undefined) || (user ? user.name : '')
        holder_company = holder_company || (holder ? holder.company : undefined) || (user ? user.company : '')
        holder_address = holder_address || (holder ? holder.address : undefined) || (user ? user.address : '')
        holder_contact_number = holder_contact_number || (holder ? holder.contact_number : undefined) || (user ? user.contact_number : '')
        holder_email = holder_email || (holder ? holder.email : undefined) || (user ? user.email : '')
        
        const supplier_name = system_config.find(e => e.config_key === 'name') ? system_config.find(e => e.config_key === 'name').config_value : ''
        const supplier_address = system_config.find(e => e.config_key === 'address') ? system_config.find(e => e.config_key === 'address').config_value : ''
        const supplier_email = system_config.find(e => e.config_key === 'email') ? system_config.find(e => e.config_key === 'email').config_value : ''
        const supplier_contact_number = system_config.find(e => e.config_key === 'contact_number') ? system_config.find(e => e.config_key === 'contact_number').config_value : ''
        const supplier_fax = system_config.find(e => e.config_key === 'fax') ? system_config.find(e => e.config_key === 'fax').config_value : ''
        const supplier_uen = system_config.find(e => e.config_key === 'uen') ? system_config.find(e => e.config_key === 'uen').config_value : ''
        const supplier_rcb = system_config.find(e => e.config_key === 'rcb') ? system_config.find(e => e.config_key === 'rcb').config_value : ''
        const carpark_name = carpark[0].carpark_name
        const carpark_address = carpark[0].address
        //calculate rate
        const rate = season_rate[0].rate
        const months = moment(end_date).diff(moment(start_date), 'month')
        const invoice_amount = months * rate
        //season and invoice data ready
        const season_data = { carpark_id, card_number, start_date, end_date, card_type, vehicle_type, holder_type, vehicle_id, vehicle_number, holder_id, holder_name, holder_company, holder_address, holder_contact_number, holder_email }
        const invoice_data = {invoice_number, invoice_date, invoice_type: 'NEW', invoice_amount, attn, carpark_id, carpark_name, carpark_address, 
            buyer_id: holder_id, buyer_name: holder_name, buyer_company: holder_company, buyer_address: holder_address, buyer_email: holder_email, buyer_contact_number: holder_contact_number, 
            supplier_name, supplier_address, supplier_email, supplier_contact_number, supplier_fax, supplier_uen, supplier_rcb,
            status: 'OUTSTANDING', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), created_by: 'system', updated_by: 'system', months}
        return {season_data, invoice_data}
    } catch (err) {
        throw err
    }
}

const renew_season_with_invoice = async data => {
    try {

    } catch (err) {
        return err
    }
}

const add_season_with_invoice = async data => {
    try {
        let {season_data, invoice_data} = await prepare_season_invoice_data(data)
        console.log(season_data)
        console.log(invoice_data)
        const months = invoice_data.months
        delete invoice_data.months
        //to achieve transaction, use pool to get a connection
        return new Promise((resolve, reject) => {
            db.pool.getConnection((conn_err, connection) => {
                if (conn_err) {
                    reject(conn_err)
                } else {
                    connection.beginTransaction(trans_err => {
                        if (trans_err) {
                            reject(trans_err)
                        } else {//create season with season_data
                            connection.query('insert into season set ?', season_data, (season_err, season_created, fields) => {
                                if (season_err) {
                                    reject(season_err)
                                } else {//create invoice with invoice_data
                                    connection.query('insert into invoice set ?', invoice_data, (invoice_err, invoice_created, fields) => {
                                        if (invoice_err) {
                                            console.log('invoice err')
                                            reject(invoice_err)
                                        } else {
                                            //invoice_item data ready, create invoice item
                                            const invoice_item = { invoice_id: invoice_created.insertId, season_id: season_created.insertId, unit_price: invoice_data.invoice_amount, quantity: months, amount: invoice_data.invoice_amount, description:`new season ${months} months` }
                                            connection.query('insert into invoice_item set ?', invoice_item, (item_err, item_created, field) => {
                                                if (item_err) {
                                                    reject(item_err)
                                                } else if (invoice_data.invoice_number) {//if invoice_number provided, use it
                                                    //transaction commit
                                                    connection.commit(err => {
                                                        if (err) {
                                                            reject(err)
                                                        } else {
                                                            resolve({season_data, invoice_data, invoice_item})
                                                        }
                                                    })
                                                } else {
                                                    //if invoice_number not provided, generate it with invoice_id and current year
                                                    const invoice_number = `INV/${fill_zero(invoice_created.insertId)}/${moment().year()}`
                                                    connection.query('update invoice set invoice_number = ?', invoice_number, (item_err, item_created, field) => {
                                                        if (item_err) {
                                                            reject(item_err)
                                                        } else {//transaction commit
                                                            connection.commit(err => {
                                                                if (err) {
                                                                    reject(err)
                                                                } else {
                                                                    resolve({season_data, invoice_data: {...invoice_data, invoice_number}, invoice_item})
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }).catch(err => { return err })
    } catch (err) {
        return err
    }
}

const add_season = async data => {
    try {
        const {season_data} = await prepare_season_invoice_data(data)
        await execute_query('create_item', season_data, 'season', db)
        return season_data
    } catch (err) {
        return err
    }
}

const list_season = async data => {
    try {
        let { limit, offset, orderby, orderdirection, user } = data
        const condition = {where: {holder_id: user.user_id}, limit, offset, orderby, orderdirection}
        const resp = await execute_query('get_item_by_condition', condition, 'season', db)
        return resp
    } catch (err) {
        return err
    }
}

const list_season_for_admin = async data => {
    try {
        let { condition } = data
        if (!condition) condition = {where: {season_id: {gt: 0}}}
        const resp = await execute_query('get_item_by_condition', condition, 'season', db)
        return resp
    } catch (err) {
        console.log('list_season err')
        throw(err)
    }
}

module.exports = {
    find_season,
    add_season,
    add_season_with_invoice,
    renew_season_with_invoice,
    list_season,
    list_season_for_admin
}
