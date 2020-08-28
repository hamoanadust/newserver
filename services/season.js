const db = require('./db')
const { success_res, fail_res, fill_zero } = require('./tool')
const { execute_query, prepare_where } = require('./dao')
const moment = require('moment')
const { checkout_invoice } = require('./braintree')

const find_season = async data => {
    try {
        const { season_id, user } = data
        if (!season_id) return new Error('season_id is required')
        const condition = {
            where: {
                whereand: {
                    season_id,
                    holder_id: user.user_id
                }
            },
            limit: 1
        }
        const resp = await execute_query('get_item_by_condition', condition, 'season', db)
        if (resp && resp.length === 1) return resp[0]
        else return new Error('Season not found')
    } catch (err) {
        return err
    }
}

const create_season = async data => {
    try {
        let { carpark_id, card_type, card_number, start_date, end_date, first_start_date, season_type = 'NORMAL', vehicle_number, vehicle_type, holder_id, holder_name, holder_company, holder_email, holder_contact_number, holder_address, holder_type, file_id, created_by, first_season_id, giro } = data
      
        const item = { carpark_id, card_type, card_number, start_date, end_date, first_start_date, season_type, vehicle_number, vehicle_type, holder_id, holder_name, holder_company, holder_email, holder_contact_number, holder_address, holder_type, file_id, created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), created_by, updated_by: created_by, first_season_id, is_latest: true }
        const [carpark, season_rate] = await Promise.all([
            execute_query('get_item_by_condition', {where: {carpark_id}}, 'carpark', db),
            execute_query('get_item_by_condition', {where: {whereand: {carpark_id, vehicle_type, season_type, status: 'ACTIVE'}}, limit: 1}, 'season_rate', db),
        ])
        if (!carpark || carpark.length === 0) throw new Error('no carpark')
        else if (moment(carpark[0].start_date).isAfter(moment(start_date))) throw new Error('start date is before carpark start date')
        else if (moment(end_date).isAfter(moment(carpark[0].end_date))) throw new Error('end date is after carpark end date')
        else if (!season_rate || season_rate.length === 0) throw new Error('no season rate')
        const { carpark_name, carpark_code, address: carpark_address, postal_code, allow_prorate, allow_giro, giro_form_id } = carpark[0]

        const unit_price = season_rate[0].rate
        let quantity
        if (allow_prorate) {
            const firstPart = moment(start_date).endOf('month').diff(moment(start_date), 'day')/moment(start_date).endOf('month').diff(moment(start_date).startOf('month'), 'day')
            const secondPart = moment(end_date).startOf('month').diff(moment(start_date).startOf('month'), 'month')
            quantity = +(firstPart + secondPart).toFixed(2)
        } else {
            quantity = moment(end_date).startOf('month').diff(moment(start_date).startOf('month'), 'month') + 1
        }
        const amount = unit_price * quantity
        const description = `${first_season_id ? 'Renew' : 'Purchase new'} season for ${quantity} ${quantity === 1 ? 'month' : 'months'}`
        const season = await execute_query('create_item', item, 'season', db)
        if (!season) throw new Error('create season fail')
        const season_id = season.insertId
        if (!first_season_id) {
            first_season_id = season_id
            await execute_query('update_item_by_id', { id: season_id, condition: { first_season_id } }, 'season', db)
        }
        if (allow_giro && giro) {
            await execute_query('create_item', { season_id, giro_form_id, status: 'SUBMITTED', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss') }, 'giro', db)
        }
        return { ...item, unit_price, quantity, amount, description, season_id, carpark_name, carpark_code, carpark_address, postal_code, first_season_id, invoice_item: { unit_price, quantity, amount, description, season_id } }
    } catch(err) {
        throw err
    }
}

const create_invoice = async data => {
    try {
        let { invoice_items, invoice_type, attn, buyer_id, buyer_name, buyer_company, buyer_email, buyer_contact_number, buyer_address, created_by } = data
        const system_config = await execute_query('get_item_by_condition', {where: {type: 'COMPANY_INFO'}}, 'system_config', db)
        if (!system_config) throw new Error('no system config')
        const supplier_name = system_config.find(e => e.config_key === 'name') ? system_config.find(e => e.config_key === 'name').config_value : ''
        const supplier_address = system_config.find(e => e.config_key === 'address') ? system_config.find(e => e.config_key === 'address').config_value : ''
        const supplier_email = system_config.find(e => e.config_key === 'email') ? system_config.find(e => e.config_key === 'email').config_value : ''
        const supplier_contact_number = system_config.find(e => e.config_key === 'contact_number') ? system_config.find(e => e.config_key === 'contact_number').config_value : ''
        const supplier_fax = system_config.find(e => e.config_key === 'fax') ? system_config.find(e => e.config_key === 'fax').config_value : ''
        const supplier_uen = system_config.find(e => e.config_key === 'uen') ? system_config.find(e => e.config_key === 'uen').config_value : ''
        const supplier_rcb = system_config.find(e => e.config_key === 'rcb') ? system_config.find(e => e.config_key === 'rcb').config_value : ''
        const invoice_amount = invoice_items.reduce((s, e) => s + e.amount, 0)
        const total_amount = invoice_amount * 1.07
        const invoice_date = moment().format('YYYY-MM-DD')
        attn = attn || 'system'
        const status = 'OUTSTANDING'
        const created_at = moment().format('YYYY-MM-DD HH:mm:ss')
        const item = { invoice_date, invoice_amount, total_amount, status, supplier_name, supplier_address, supplier_email, supplier_contact_number, supplier_fax, supplier_uen, supplier_rcb, invoice_type, attn, buyer_id, buyer_name, buyer_company, buyer_email, buyer_contact_number, buyer_address, created_by, updated_by: created_by, created_at, updated_at: created_at }
        const invoice = await execute_query('create_item', item, 'invoice', db)
        if (!invoice) throw new Error('invoice create fail')
        const invoice_id = invoice.insertId
        // const invoice_number = `INV/${fill_zero(invoice_id)}/${moment().year()}`
        const order_number = `ODR/${fill_zero(invoice_id)}/${moment().year()}`
        invoice_items = invoice_items.map(e => {
            return { ...e, invoice_id }
        })
        await Promise.all([
            execute_query('update_item_by_id', { id: invoice_id, condition: { order_number } }, 'invoice', db),
            ...invoice_items.map(e => execute_query('create_item', e, 'invoice_item', db))
        ])
        return { ...item, order_number, invoice_id }
    } catch(err) {
        throw err
    }
}

const add_season_with_invoice = async data => {
    try {
        let { carpark_id, card_number, start_date, end_date, //required
            card_type = 'IU', vehicle_type = 'CAR', season_type = 'NORMAL', attn = 'system', vehicle_id, created_by,  //optional with a default value
            vehicle_number, holder_id, holder_name, holder_company, holder_address, holder_contact_number, holder_email, giro, //optional
            user } = data//from middleware
        if (!carpark_id) throw new Error('no carpark id')
        else if (!card_number) throw new Error('no card number')
        else if (!start_date) throw new Error('no start date')
        else if (!end_date) throw new Error('no end date')
        else if (moment(start_date).isAfter(moment(end_date))) throw new Error('start date is after end date')
        else if (moment(end_date).endOf('month').format('YYYY-MM-DD')!==moment(end_date).format('YYYY-MM-DD')) {
            throw new Error('end date must be end of month')
        } else if (moment(start_date).date() >= 15 && moment(end_date).diff(moment(start_date), 'month') < 1) {
            throw new Error('start date after 15, end date must be at least the end of the next month')
        }
        holder_id = holder_id || (user ? user.user_id : undefined)
        const [vehicle, holder_data, member_data] = await Promise.all([
            vehicle_id ? execute_query('get_item_by_condition', { where: { vehicle_id } }, 'vehicle', db) : undefined,
            holder_id ? execute_query('get_item_by_condition', { where: { user_id: holder_id }, limit: 1 }, 'user', db) : undefined,
            holder_id ? db.query(`select mt.*, m.user_id, m.file_id from member_type mt left join member m using (member_type_id) where mt.carpark_id = ${db.escape(carpark_id)} and m.user_id = ${db.escape(holder_id)} and mt.status = 'ACTIVE' and m.status = 'ACTIVE' and mt.available > 0`) : undefined
        ])
        const holder_type = member_data && member_data[0] ? 'MEMBER' : 'PUBLIC'
        const holder = holder_data && holder_data.length === 1 ? holder_data[0] : undefined
        vehicle_number = vehicle_number || (vehicle && vehicle.length === 1 ? vehicle[0].vehicle_number : '')
        
        holder_name = holder_name || (holder ? holder.name : undefined) || (user ? user.name : '')
        holder_company = holder_company || (holder ? holder.company : undefined) || (user ? user.company : '')
        holder_address = holder_address || (holder ? holder.address : undefined) || (user ? user.address : '')
        holder_contact_number = holder_contact_number || (holder ? holder.contact_number : undefined) || (user ? user.contact_number : '')
        holder_email = holder_email || (holder ? holder.email : undefined) || (user ? user.email : '')
        created_by = created_by || holder_name
        let season_data = { carpark_id, card_number, start_date, end_date, first_start_date: start_date, card_type, vehicle_type, season_type, holder_type, vehicle_number, holder_id, holder_name, holder_company, holder_address, holder_contact_number, holder_email, created_by, giro }
        //special season type requires upload file before___________________________________________________________
        if (season_type !== 'NORMAL') {
            const sstype = await execute_query('get_item_by_condition', { where: { whereand: { status: 'ACTIVE', season_type_id: season_type } } }, 'season_type', db)
            console.log(sstype)
            if (sstype && sstype.length > 0) {
                console.log('special season type, need to upload file')
                sstype[0].file_type
                const checkfile = await execute_query('get_item_by_condition', { where: { whereand: { user_id: holder_id, status: 'ACTIVE', file_type: sstype[0].file_type } } }, 'file', db)
                if (!checkfile || checkfile.length === 0) throw new Error(`file ${sstype[0].file_type} is required`)
                else season_data.file_id = checkfile[0].file_id
            }
        }
        //_________________________________________________________________________________________________________
        
        const season = await create_season(season_data)
        if (!season) throw new Error('create season fail')
        const invoice_items = [season.invoice_item]
        const invoice_data = { invoice_items, invoice_type: 'NEW', attn, buyer_id: holder_id, buyer_name: holder_name, buyer_company: holder_company, buyer_email: holder_email, buyer_contact_number: holder_contact_number, buyer_address: holder_address, created_by }
        const invoice = await create_invoice(invoice_data)
        return { invoice, season, invoice_item: season.invoice_item }
    } catch (err) {
        return err
    }
}

const renew_season_with_invoice = async data => {
    try {
        let { season_id, end_date, attn, user } = data
        if (!season_id) throw new Error('no season id')
        else if (!end_date) throw new Error('no renew end date')
        else if (!moment(end_date).isValid()) throw new Error('renew end date is not valid')
        else if (moment(end_date).isBefore(moment())) throw new Error('renew end date is in the past')
        const szn = await execute_query('get_item_by_condition', { where: { season_id } }, 'season', db)
        if (!szn || szn.length === 0) throw new Error('no season')
        else if (moment(end_date).format('DD/MM/YYYY') !== moment(end_date).endOf('month').format('DD/MM/YYYY')) throw new Error('renew end date must be end of a month')
        else if (moment(end_date).format('DD/MM/YYYY') === moment(szn[0].end_date).endOf('month').format('DD/MM/YYYY')) throw new Error('renew end date cannot be the same with previous end date')
        else if (moment(end_date).isBefore(moment(szn[0].end_date))) throw new Error('renew end date is before previous end date')
        const season = await create_season({ ...szn[0], first_start_date: moment(szn[0].first_start_date).format('YYYY-MM-DD'), start_date: moment(szn[0].end_date).add(1, 'day').format('YYYY-MM-DD'), end_date, renew: true, created_by: user.username })
        if (!season) throw new Error('create season fail')
        const invoice_items = [season.invoice_item]
        const invoice_data = { invoice_items, invoice_type: 'RENEW', attn, buyer_id: user.user_id, buyer_name: user.name, buyer_company: user.company, buyer_email: user.email, buyer_contact_number: user.contact_number, buyer_address: user.address, created_by: user.username, first_season_id: season_id }
        const invoice = await create_invoice(invoice_data)
        return { invoice, season, invoice_item: season.invoice_item }
    } catch(err) {
        return err
    }
}

const renew_season_batch = async data => {
    try {
        const { seasons, user } = data
        const whereand = { holder_id: user.user_id, season_id: seasons.map(e => e.season_id) }
        const condition = { where: { whereand } }
        let szns = await execute_query('get_item_by_condition', condition, 'season', db)
        szns.forEach(e => {
            let end_date = seasons.find(s => s.season_id === e.season_id).end_date
            if (moment(end_date).format('DD/MM/YYYY') !== moment(end_date).endOf('month').format('DD/MM/YYYY')) throw new Error('renew end date must be end of a month')
            else if (moment(end_date).format('DD/MM/YYYY') === moment(e.end_date).endOf('month').format('DD/MM/YYYY')) throw new Error('renew end date cannot be the same with previous end date')
            else if (moment(end_date).isBefore(moment(e.end_date))) throw new Error('renew end date is before previous end date')
            e.start_date = moment(e.end_date).add(1, 'day').format('YYYY-MM-DD')
            e.end_date = moment(end_date).format('YYYY-MM-DD')
            e.created_by = user.username
            e.first_start_date = moment(e.first_start_date).format('YYYY-MM-DD')
            e.first_season_id = e.season_id
        })
        const new_seasons = await Promise.all(szns.map(e => create_season(e)))
        const invoice_items = new_seasons.map(e => e.invoice_item)
        const invoice_data = { invoice_items, invoice_type: 'RENEW', buyer_id: user.user_id, buyer_name: user.name, buyer_company: user.company, buyer_email: user.email, buyer_contact_number: user.contact_number, buyer_address: user.address, created_by: user.username }
        const invoice = await create_invoice(invoice_data)
        return { invoice, invoice_items }
    } catch (err) {
        return err
    }
}

const add_season_by_admin = async data => {
    try {
        const { carpark_id, start_date, end_date, card_number, vehicle_number, card_type, vehicle_type, season_type = 'NORMAL', attn, user_id, user, giro } = data
        const [holder, member] = await Promise.all([
            execute_query('get_item_by_condition', { where: { user_id }, limit: 1 }, 'user', db),
            db.query(`select mt.*, m.user_id, m.file_id from member_type mt left join member m using (member_type_id) where mt.carpark_id = ${db.escape(carpark_id)} and m.user_id = ${db.escape(user_id)} and mt.status = 'ACTIVE' and m.status = 'ACTIVE' and mt.available > 0`)
        ])
        if (!holder && holder.length === 0) throw new Error('user not found')
        const holder_type = member && member[0] ? 'MEMBER' : 'PUBLIC'
        const holder_id = user_id
        const holder_name = holder[0].name
        const holder_address = holder[0].address
        const holder_company = holder[0].company
        const holder_contact_number = holder[0].contact_number
        const holder_email = holder[0].email
        const created_by = user.username
        const item = { carpark_id, start_date, end_date, card_number, vehicle_number, card_type, vehicle_type, season_type, holder_type, attn, holder_id, holder_name, holder_address, holder_company, holder_contact_number, holder_email, created_by, giro }
        const resp = await add_season_with_invoice(item)
        return resp
    } catch (err) {
        return err
    }
}

const add_season_by_admin_batch = async data => {
    try {
        const { seasons, user } = data
        const resp = await Promise.all(seasons.map(e => add_season_by_admin({ ...e, user })))
        return resp.map(e => { 
            return e instanceof Error ? { error: e.message } : e
        })
    } catch (err) {
        return err
    }
}

const list_all_season = async data => {
    try {
        const { holder_id } = data
        const sql = `select s.*, c.carpark_name, c.carpark_code, c.address, c.postal_code, c.public_policy, c.billing_method, c.allow_giro, c.allow_auto_renew, c.status as carpark_status, c.remarks, c.giro_form_id, item.invoice_item_id, item.unit_price, item.quantity, item.amount, item.invoice_id, item.description, item.*, f.file_type, f.name as filename, f.mimetype, f.size, sr.rate, sr.status as rate_status, sr.remarks as rate_remarks from season s left join carpark c using(carpark_id) left join invoice_item item using (season_id) left join file f using (file_id) left join season_rate sr on (sr.carpark_id = c.carpark_id && sr.vehicle_type = s.vehicle_type && sr.season_type = s.season_type) where s.holder_id = ${db.escape(holder_id)} and s.status in ('NEW', 'ACTIVE') and s.is_latest = true`
        const season = await db.query(sql)
        // let result = []
        // season.forEach(s => {
        //     const idx = result.findIndex(r => r.card_number === s.card_number && r.first_start_date === s.first_start_date)
        //     if (idx !== -1) {
        //         if (result[idx].end_date < s.end_date) result.splice(idx, 1, s)
        //     } else {
        //         result.push(s)
        //     }
        // })
        return season
    } catch (err) {
        return err
    }
}

const set_auto_renew = async data => {
    try {
        const { season_id, auto_renew, user } = data
        if (!user.customer_id) throw new Error('Cannot set auto renew, there is no payment method saved')
        const [payment_method, carpark] = await Promise.all([
            execute_query('get_item_by_condition', { where: { whereand: { customer_id: user.customer_id, is_default: true } } }, 'payment_method', db),
            db.query(`select c.allow_auto_renew from season s left join carpark c using(carpark_id) where s.season_id = ${db.escape(season_id)} and c.allow_auto_renew = true`)
        ])
        if (!payment_method || payment_method.length === 0) throw new Error('Cannot set auto renew, there is no payment method saved')
        if (!carpark || carpark.length === 0) throw new Error('Auto renew is not allowed in this carpark')
        await execute_query('update_item_by_id', { condition: { auto_renew }, id: season_id }, 'season', db)
        return true
    } catch (err) {
        return err
    }
}

const auto_renew = async data => {
    try {
        const { user } = data
        const sql = `select s.season_id, s.first_season_id, s.first_start_date, s.end_date as old_end_date, u.user_id, u.customer_id, u.name, u.email, u.contact_number, u.customer_id, p.token, p.payment_method_id from season s left join user u on s.holder_id = u.user_id right join payment_method p on (u.customer_id = p.customer_id and p.status = 'ACTIVE' and p.is_default = true) where s.auto_renew = true and s.status = 'ACTIVE' and s.holder_id is not null and u.customer_id is not null and MONTH(s.end_date) = MONTH(NOW()) and s.is_latest = true`
        let szns = await db.query(sql)
        console.log(szns)
        if (!szns || szns.length === 0) throw new Error('no season to auto renew')
        const seasons = szns.map(e => { 
            return { 
                season_id: e.season_id,
                first_season_id: e.first_season_id,
                payment_method_id: e.payment_method_id, 
                end_date: moment(e.end_date).startOf('month').add(1, 'month').endOf('month').format('YYYY-MM-DD'),
                first_start_date: moment(e.first_start_date).format('YYYY-MM-DD'),
                attn: 'AUTO RENEW',
                user: {
                    user_id: e.user_id,
                    name: e.name, 
                    company: e.company, 
                    email: e.email, 
                    contact_number: e.contact_number,
                    address: e.address,
                    customer_id: e.customer_id
                }
            } 
        })
        console.log(seasons)
        const renewal = await Promise.all(seasons.map(e => renew_season_with_invoice(e)))
        console.log(renewal)
        // await Promise.all(renewal.map(e => set_auto_renew({ season_id: e.season, auto_renew: true, user: seasons.find(s => s.season_id === e.season.first_season_id) })))
        const items = renewal.map(e => {
            let item = seasons.find(s => s.season_id === e.season.first_season_id)
            return {
                invoice_id: e.invoice.invoice_id,
                payment_method_id: item.payment_method_id,
                user: item.user,
                season_id: e.season.season_id,
                auto_renew: true
            }
        })
        const setAutoRenew = await Promise.all(items.map(e => set_auto_renew(e)))
        console.log(setAutoRenew)
        const check = await Promise.all(items.map(e => checkout_invoice(e)))
        return check.map(e => e instanceof Error ? e.message : e)
    } catch (err) {
        return err
    }
}

const list_season = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection, user } = data
        where = where || { whereand: { holder_id: user.user_id } }
        where.whereand = where.whereand || { holder_id: user.user_id }
        where.whereand.holder_id = user.user_id
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select s.*, c.carpark_name, c.carpark_code, c.address, c.postal_code, c.public_policy, c.billing_method, c.allow_giro, c.allow_auto_renew, c.status as carpark_status, c.remarks, c.giro_form_id, item.invoice_item_id, item.unit_price, item.quantity, item.amount, item.invoice_id, item.description, item.*, f.file_type, f.name as filename, f.mimetype, f.size, sr.rate, sr.status as rate_status, sr.remarks as rate_remarks from season s left join carpark c using(carpark_id) left join invoice_item item using (season_id) left join file f using (file_id) left join season_rate sr on (sr.carpark_id = c.carpark_id && sr.vehicle_type = s.vehicle_type && sr.season_type = s.season_type) where s.is_latest = true and ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const season = await db.query(sql)
        // let result = []
        // season.forEach(s => {
        //     const idx = result.findIndex(r => r.card_number === s.card_number && moment(r.first_start_date).format('YYYY-MM-DD') === moment(s.first_start_date).format('YYYY-MM-DD'))
        //     if (idx !== -1) {
        //         if (result[idx].end_date < s.end_date) result.splice(idx, 1, s)
        //     } else {
        //         result.push(s)
        //     }
        // })
        return season
    } catch (err) {
        return err
    }
}

const list_season_for_admin = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection } = data
        where = where || { season_id: { gt: 0 } }
        const order = orderby ? `order by ${orderby} ${orderdirection || 'desc'}` : '';
        const limitation = limit === 'no' ? '' : `limit ${limit || '100'}`;
        const offsetion = offset ? `offset ${offset}` : '';
        const sql = `select s.*, c.carpark_name, c.carpark_code, c.address, c.postal_code, c.public_policy, c.billing_method, c.allow_giro, c.allow_auto_renew, c.status as carpark_status, c.remarks, c.giro_form_id, item.invoice_item_id, item.unit_price, item.quantity, item.amount, item.invoice_id, item.description, item.*, f.file_type, f.name as filename, f.mimetype, f.size from season s left join carpark c using(carpark_id) left join invoice_item item using (season_id) left join file f using (file_id) where ${prepare_where(where, db)} ${order} ${limitation} ${offsetion}`
        const season = await db.query(sql)
        return season
    } catch (err) {
        return err
    }
}

const terminate_season = async data => {
    try {
        const { season_id, user } = data
        const condition = { status: 'TERMINATED' }
        const szn = await execute_query('get_item_by_condition', { where: { whereand: { holder_id: user.user_id, season_id } } }, 'season', db)
        if (!szn || szn.length === 0) throw new Error('season not found')
        const resp = await execute_query('update_item_by_id', { condition, where: { first_season_id: szn[0].first_season_id } }, 'season', db)
        return resp
    } catch (err) {
        return err
    }
}

const terminate_season_batch = async data => {
    try {
        const { seasons, user } = data
        const resp = await Promise.all(seasons.map(s => terminate_season({ season_id: s.season_id, user })))
        return resp.map(e => { 
            return e instanceof Error ? { error: e.message } : e
        })
    } catch (err) {
        return err
    }
}

module.exports = {
    find_season,
    add_season_by_admin,
    add_season_by_admin_batch,
    add_season_with_invoice,
    renew_season_with_invoice,
    list_all_season,
    list_season,
    list_season_for_admin,
    terminate_season,
    terminate_season_batch,
    renew_season_batch,
    auto_renew,
    set_auto_renew
}

