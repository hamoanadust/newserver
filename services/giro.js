const db = require('./db')
const { execute_query, prepare_where } = require('./dao')
const { fill_zero } = require('./tool')
const moment = require('moment')

const add_giro_form = async data => {
    try {
        const { form_name, bank_name } = data
        const resp = await execute_query('create_item', { form_name, bank_name }, 'giro_form', db)
        return resp
    } catch(err) {
        throw err
    }
}

const list_giro = async data => {
    try {
        const { where = { giro_status: ['ACTIVE', 'SUBMITTED', 'PENDING'] }, limit, offset, orderby, orderdirection } = data
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select * from (select g.giro_id, g.giro_number, g.account_number, g.giro_form_id, g.status as giro_status, g.created_at as giro_created_at, g.updated_at as giro_updated_at, gm.form_name, gm.bank_name, s.*, sr.rate from giro g left join giro_form gm using (giro_form_id) left join season s using (season_id) left join season_rate sr on (s.carpark_id = sr.carpark_id && s.vehicle_type = sr.vehicle_type && s.season_type = sr.season_type)) as result where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const resp = await db.query(sql)
        return resp
    } catch(err) {
        throw err
    }
}

const update_giro = async data => {
    try {
        const { giro_id, giro_number, account_number, giro_form_id, status } = data
        if (!giro_id) throw new Error('no giro_id')
        const resp = await execute_query('update_item_by_id', { id: giro_id, condition: { giro_number, account_number, giro_form_id, status } }, 'giro', db)
        return resp
    } catch(err) {
        throw err
    }
}

const giro_success = async data => {
    try {
        let { season_id, amount, quantity = 1, description } = data
        const find_season = await execute_query('get_item_by_condition', { where: { season_id } }, 'season', db)
        if (!find_season || find_season.length === 0) throw new Error('season not found')
        const { carpark_id, end_date, holder_id: buyer_id, holder_name: buyer_name, holder_company: buyer_company, holder_contact_number: buyer_contact_number, holder_address: buyer_address, holder_email: buyer_email } = find_season[0]
        description = description || `Renew season for ${quantity} month by GIRO`
        let total_amount = amount
        let unit_price = amount / quantity
        let invoice_amount = amount / 1.07
        if (Number.isInteger(total_amount)) total_amount = total_amount.toFixed(2)
        if (Number.isInteger(unit_price)) unit_price = unit_price.toFixed(2)
        if (Number.isInteger(invoice_amount)) invoice_amount = invoice_amount.toFixed(2)
        const sql1 = `select invoice_number from invoice where status = 'PAID' and SUBSTRING(invoice_number, -4, 4) = YEAR(CURDATE()) order by SUBSTRING(invoice_number, 5, 6) desc limit 1`
        const [last_invoice, carpark, system_config] = await Promise.all([
            db.query(sql1), 
            db.query(`select * from carpark where carpark_id = ${db.escape(carpark_id)}`),
            execute_query('get_item_by_condition', {where: {type: 'COMPANY_INFO'}}, 'system_config', db)
        ])
        if (!system_config) throw new Error('no system config')
        const supplier_name = system_config.find(e => e.config_key === 'name') ? system_config.find(e => e.config_key === 'name').config_value : ''
        const supplier_address = system_config.find(e => e.config_key === 'address') ? system_config.find(e => e.config_key === 'address').config_value : ''
        const supplier_email = system_config.find(e => e.config_key === 'email') ? system_config.find(e => e.config_key === 'email').config_value : ''
        const supplier_contact_number = system_config.find(e => e.config_key === 'contact_number') ? system_config.find(e => e.config_key === 'contact_number').config_value : ''
        const supplier_fax = system_config.find(e => e.config_key === 'fax') ? system_config.find(e => e.config_key === 'fax').config_value : ''
        const supplier_uen = system_config.find(e => e.config_key === 'uen') ? system_config.find(e => e.config_key === 'uen').config_value : ''
        const supplier_rcb = system_config.find(e => e.config_key === 'rcb') ? system_config.find(e => e.config_key === 'rcb').config_value : ''
        const last_invoice_number_count = last_invoice[0] ? parseInt(last_invoice[0].invoice_number.slice(4, 10)) : 1
        const invoice_number = `INV/${fill_zero(last_invoice_number_count + 1)}/${moment().year()}`
        const inv = { invoice_number, invoice_type: 'RENEW', invoice_amount, buyer_id, buyer_name, buyer_company, buyer_contact_number, buyer_address, buyer_email, total_amount, carpark_id, carpark_name: carpark[0].carpark_name, carpark_address: carpark[0].address, created_by: 'GIRO', updated_by: 'GIRO', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), invoice_date: moment().format('YYYY-MM-DD'), attn: 'GIRO', supplier_name, supplier_address, supplier_email, supplier_contact_number, supplier_fax, supplier_uen, supplier_rcb }
        const creat_inv = await execute_query('create_item', inv, 'invoice', db)
        const { insertId: invoice_id } = creat_inv
        const inv_item = { season_id, invoice_id, unit_price, quantity, amount, description }
        const create_item = await execute_query('create_item', inv_item, 'invoice_item', db)
        const condition = { end_date: moment(end_date).startOf('month').add(quantity, 'month').endOf('month').format('YYYY-MM-DD') }
        const update_season = await execute_query('update_item_by_id', { id: season_id, condition }, 'season', db)
        return update_season
    } catch(err) {
        throw err
    }
}

module.exports = {
    add_giro_form,
    list_giro,
    giro_success,
    update_giro,

}