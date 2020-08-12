const db = require('./db');
const { success_res, fail_res, fill_zero } = require('./tool');
const { execute_query, prepare_where } = require('./dao');
const moment = require('moment');
const async = require("async");

const find_invoice = async data => {
    try {
        const { invoice_id, invoice_number, order_number, user } = data;
        const condition = {
            where: {
                whereand: {
                    whereor: {
                        invoice_id,
                        invoice_number,
                        order_number
                    },
                    buyer_id: user.user_id
                }
            },
            limit: 1
        }
        const resp = await execute_query('get_item_by_condition', condition, 'invoice', db);
        return success_res(resp[0], resp[0] ? undefined : 'no invoice found');
    } catch (err) {
        console.log('find invoice err');
        throw(err);
    }
}

const list_all_invoice = async data => {
    try {
        let { user } = data
        const invoices = await execute_query('get_item_by_condition', { where: { whereand: { buyer_id: user.user_id, status: ['PAID', 'OUTSTANDING'] } } }, 'invoice', db)
        const sql = `select item.*, s.*, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code from invoice_item item left join season s using(season_id) left join carpark c using(carpark_id) where invoice_id in (${invoices.map(e => e.invoice_id).toString()})`
        const items = await db.query(sql)
        const resp = invoices.map(e => {
            return {
                ...e,
                invoice_items: items.filter(i => i.invoice_id === e.invoice_id)
            }
        })
        return resp
    } catch (err) {
        return err
    }
}

const list_invoice = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection, user } = data
        where = where || { whereand: { buyer_id: user.user_id } }
        where.whereand = where.whereand || { buyer_id: user.user_id }
        where.whereand.buyer_id = user.user_id
        const invoices = await execute_query('get_item_by_condition', { where, limit, offset, orderby, orderdirection }, 'invoice', db)
        const sql = `select item.*, s.*, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code from invoice_item item left join season s using(season_id) left join carpark c using(carpark_id) where invoice_id in (${invoices.map(e => e.invoice_id).toString()})`
        const items = await db.query(sql)
        const resp = invoices.map(e => {
            return {
                ...e,
                invoice_items: items.filter(i => i.invoice_id === e.invoice_id)
            }
        })
        return resp
    } catch (err) {
        return err
    }
}

const list_invoice_for_admin = async data => {
    try {
        let { where, limit, offset, orderby, orderdirection } = data
        const invoices = await execute_query('get_item_by_condition', { where, limit, offset, orderby, orderdirection }, 'invoice', db)
        const sql = `select item.*, s.*, c.carpark_name, c.carpark_code, c.address as carpark_address, c.postal_code from invoice_item item left join season s using(season_id) left join carpark c using(carpark_id) where invoice_id in (${invoices.map(e => e.invoice_id).toString()})`
        const items = await db.query(sql)
        const resp = invoices.map(e => {
            return {
                ...e,
                invoice_items: items.filter(i => i.invoice_id === e.invoice_id)
            }
        })
        return resp
    } catch (err) {
        return err
    }
}

const create_invoice = async data => {
    try {
        let { invoice_number, invoice_date, invoice_type, attn, carpark_id, carpark_name, carpark_address, buyer_id, buyer_name, buyer_company, buyer_address, buyer_email, buyer_contact_number, invoice_item, admin } = data;
        if (!invoice_item || invoice_item.length === 0) return fail_res('no invoice item');
        if (invoice_item.some(e => !e.season_id || !e.unit_price || !e.quantity)) return fail_res('all invoice item must have season id, unit price and quantity');
        const [system_config, carpark, buyer] = await Promise.all([
            execute_query('get_item_by_condition', {where: {type: 'COMPANY_INFO'}}, 'system_config', db),
            carpark_id ? execute_query('get_item_by_condition', {where: {carpark_id}}, 'carpark', db) : undefined,
            buyer_id ? execute_query('get_item_by_condition', {where: {user_id: buyer_id}}, 'user', db) : undefined,
        ]);
        if (!system_config) return fail_res('no system config');
        invoice_item.forEach(e => e.amount = e.unit_price * e.quantity);
        invoice_type = invoice_type === 'RENEW' ? 'RENEW' : 'NEW';
        attn = attn || 'system';
        invoice_date = invoice_date || moment().format('YYYY-MM-DD');
        invoice_amount = invoice_item.reduce((t, e) => t + e.amount, 0);
        const total_amount = invoice_amount*1.07;
        carpark_name = carpark_name || (carpark && carpark[0] ? carpark[0].carpark_name : '');
        carpark_address = carpark_address || (carpark && carpark[0] ? carpark[0].address : '');
        buyer_name = buyer_name || (buyer && buyer[0] ? buyer[0].name : '');
        buyer_company = buyer_company || (buyer && buyer[0] ? buyer[0].company : '');
        buyer_address = buyer_address || (buyer && buyer[0] ? buyer[0].address : '');
        buyer_email = buyer_email || (buyer && buyer[0] ? buyer[0].email : '');
        buyer_contact_number = buyer_contact_number || (buyer && buyer[0] ? buyer[0].contact_number : '');
        const supplier_name = system_config.find(e => e.config_key === 'name') ? system_config.find(e => e.config_key === 'name').config_value : '';
        const supplier_address = system_config.find(e => e.config_key === 'address') ? system_config.find(e => e.config_key === 'address').config_value : '';
        const supplier_email = system_config.find(e => e.config_key === 'email') ? system_config.find(e => e.config_key === 'email').config_value : '';
        const supplier_contact_number = system_config.find(e => e.config_key === 'contact_number') ? system_config.find(e => e.config_key === 'contact_number').config_value : '';
        const supplier_fax = system_config.find(e => e.config_key === 'fax') ? system_config.find(e => e.config_key === 'fax').config_value : '';
        const supplier_uen = system_config.find(e => e.config_key === 'uen') ? system_config.find(e => e.config_key === 'uen').config_value : '';
        const supplier_rcb = system_config.find(e => e.config_key === 'rcb') ? system_config.find(e => e.config_key === 'rcb').config_value : '';
        
        const invoice_data = { invoice_number, invoice_date, invoice_type, attn, invoice_amount, total_amount,
            carpark_id, carpark_name, carpark_address, 
            buyer_id, buyer_name, buyer_company, buyer_address, buyer_email, buyer_contact_number,
            supplier_name, supplier_address, supplier_email, supplier_contact_number, supplier_fax, supplier_uen, supplier_rcb,
            status: 'OUTSTANDING', created_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), created_by: admin.username, updated_by: admin.username
        }
        return new Promise((resolve, reject) => {
            db.pool.getConnection((conn_err, connection) => {
                if (conn_err) reject(conn_err);
                connection.beginTransaction(async trans_err => {
                    if (trans_err) reject(trans_err);
                    try {
                        //create invoice with invoice_data
                        connection.query('insert into invoice set ?', invoice_data, async (invoice_err, invoice_created, fields) => {
                            if (invoice_err) throw(invoice_err);
                            try {
                                //invoice_item data ready, create invoice item
                                invoice_item.forEach(e => {e.invoice_id = invoice_created.insertId; e.description = `${invoice_data.invoice_type} season ${e.quantity} months`});
                                await async.map(invoice_item, (item, cb) => {
                                    connection.query('insert into invoice_item set ?', item, (item_err, item_created, field) => {
                                        if (item_err) throw(item_err);
                                        cb(null, item);
                                    })
                                });
                                try {
                                    //if invoice_number provided, use it
                                    if (invoice_number) {
                                        //transaction commit
                                        connection.commit(err => {
                                            if (err) throw(err);
                                            resolve({invoice_data, invoice_item});
                                        });
                                    } else {
                                        //if invoice_number not provided, generate it with invoice_id and current year
                                        invoice_number = `INV/${fill_zero(invoice_created.insertId)}/${moment().year()}`;
                                        connection.query('update invoice set invoice_number = ?', invoice_number, (item_err, item_created, field) => {
                                            if (item_err) throw(item_err);
                                            //transaction commit
                                            connection.commit(err => {
                                                if (err) throw(err);
                                                resolve({invoice_data: {...invoice_data, invoice_number}, invoice_item});
                                            });
                                        });
                                    }
                                } catch(err) {
                                    console.log('update invoice number err', err);
                                    throw(err);
                                }
                            } catch(err) {
                                console.log('invoice item err', err);
                                throw(err);
                            }
                        });
                    } catch(err) {
                        //catch all db operation errors and rollback
                        connection.rollback(() => {
                            console.log('invoice err', err);
                            reject(err);
                        })
                    }
                })
            })
        });
    } catch (err) {
        console.log('add invoice err', err);
        return fail_res(err);
    }
}


module.exports = {
    find_invoice,
    list_all_invoice,
    list_invoice,
    list_invoice_for_admin,
    create_invoice,
}
