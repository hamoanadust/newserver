const db = require('./db');
const { execute_query } = require('./dao');
const { success_res, fail_res } = require('./tool');
const braintree = require("braintree");
const { braintree_config } = require('../config/config.json');
const moment = require('moment')

const gateway = braintree.connect({
    ...braintree_config,
    environment: braintree.Environment.Sandbox
});

const generate_token = data => {
    return new Promise((resolve, reject) => {
        gateway.clientToken.generate(data, (err, response) => {
            if (err) {
                return reject(err)
            }
            resolve(response.clientToken)
        })
    })
}

const sale = data => {
    const { amount, paymentMethodNonce, paymentMethodToken } = data
    return new Promise((resolve, reject) => {
        gateway.transaction.sale({
            amount,
            paymentMethodToken,
            paymentMethodNonce,
            options: {
                submitForSettlement: true
            }
        }, (err, result) => {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
}

const checkout_invoice = async data => {
    try {
        const { paymentMethodNonce, invoice_id, user, payment_method_id } = data
        const invoice = await execute_query('get_item_by_condition', { where: { whereand: { invoice_id, status: 'OUTSTANDING' } } }, 'invoice', db)
        if (!invoice || invoice.length === 0) throw new Error('No outstanding invoice is found')
        else if (Array.isArray(invoice_id) && invoice_id.length !== invoice.length) throw new Error('Some of the outstanding invoices are not found')
        const amount = invoice.reduce((r, e) => r + e.total_amount, 0)
        let payment = { amount }
        if (paymentMethodNonce) {
            payment.paymentMethodNonce = paymentMethodNonce
        } else if (payment_method_id) {
            const payment_methods = await execute_query('get_item_by_condition', { where: { whereand: { customer_id: user.customer_id, payment_method_id, status: 'ACTIVE' } } }, 'payment_method', db) 
            if (!payment_methods || payment_methods.length === 0) throw new Error('payment method not found')
            else payment.paymentMethodToken = payment_methods[0].token
        } else {
            const payment_methods = await execute_query('get_item_by_condition', { where: { whereand: { customer_id: user.customer_id, status: 'ACTIVE' } } }, 'payment_method', db) 
            if (!payment_methods || payment_methods.length === 0) throw new Error('payment method not found')
            payment.paymentMethodToken = payment_methods.find(e => e.is_default) ? payment_methods.find(e => e.is_default).token : payment_methods[0].token
        }
        if (!paymentMethodNonce && !payment.paymentMethodToken) throw new Error('no payment method is provided')
        const resp = await sale(payment)
        if (resp.success) {
            const invoice_item = await execute_query('get_item_by_condition', { where: { invoice_id } }, 'invoice_item', db )
            const season_id = invoice_item.map(e => e.season_id)
            // const seasons = await execute_query('get_item_by_condition', { where: { season_id } }, 'season', db)
            // const member_season_id = seasons.filter(s => s.holder_type === 'TENANT').map(s => s.season_id)
            await Promise.all([
                db.query(`update invoice set status = 'PAID' where invoice_id in (${invoice_id.toString()})`),
                db.query(`update season set status = 'ACTIVE' where season_id in (${season_id.toString()})`),
                db.query(`UPDATE member m join season s on s.carpark_id = m.carpark_id and s.holder_id = m.user_id set m.quota = m.quota - 1 where m.status = 'ACTIVE' and s.holder_type = 'TENANT' and s.season_id in (${season_id.toString()})`)
            ])
            return true
        } else {
            console.log(resp)
            throw new Error()
        }
    } catch(err) {
        return err
    }
}

const create_payment_method = data => {
    try {
        const { paymentMethodNonce, user } = data
        if (!user) throw new Error('user not found')
        else if (user.customer_id) return create_payment_method_to_customer(data)
        else return create_payment_method_with_new_customer(data)
    } catch(err) {
        return err
    }
}

const create_payment_method_with_new_customer = data => {
    let { paymentMethodNonce, user } = data
    return new Promise((resolve, reject) => {
        gateway.customer.create({
            firstName: user.username,
            lastName: user.name,
            company: user.company,
            email: user.email,
            phone: user.contact_number,
            paymentMethodNonce
        }, async (err, result) => {
            if (err) {
                reject(err);
            } else if (result.success) {
                const customer_id = result.customer.id
                try {
                    await Promise.all([
                        execute_query('update_item_by_id', { id: user.user_id, condition: { customer_id } }, 'user', db),
                        add_payment_method({ ...result.customer.paymentMethods[0], customer_id, is_default: true })
                    ])
                    resolve(success_res('new customer with payment method created'))
                } catch(er) {
                    reject(er)
                }
            } else {
                resolve(fail_res(result.message))
            }
        })
    })
}

const create_payment_method_to_customer = data => {
    let { paymentMethodNonce, user } = data
    return new Promise((resolve, reject) => {
        gateway.paymentMethod.create({
            customerId: user.customer_id,
            paymentMethodNonce
        }, async (err, result) => {
            if (err) {
                reject(err)
            } else if (result.success) {
                try {
                    await add_payment_method({ ...result.paymentMethod, customer_id: user.customer_id })
                    resolve(success_res('payment method added to existing customer'))
                } catch(er) {
                    reject(er)
                }
            } else {
                resolve(fail_res(result.message))
            }
        })
    })
}

const add_payment_method = data => {
    const { customer_id, token, cardType, maskedNumber, expirationDate, last4, is_default } = data
    const item = { customer_id, token, cardType, maskedNumber, expirationDate, last4, is_default, created_at: moment().format('YYYY-MM-DD'), updated_at: moment().format('YYYY-MM-DD') }
    return execute_query('create_item', item, 'payment_method', db)
}

const list_payment_method = async data => {
    try {
        const { user } = data
        const { customer_id } = user
        if (!customer_id) return []
        else return execute_query('get_item_by_condition', { where: { whereand: { customer_id, status: 'ACTIVE' } } }, 'payment_method', db)
    } catch (err) {
        return err
    }
}

const delete_payment_method = data => {
    try {
        const { payment_method_id, user } = data
        return execute_query('update_item_by_id', { condition: { status: 'INACTIVE' }, id: payment_method_id }, 'payment_method', db)
    } catch (err) {
        return err
    }
}

module.exports = {
    generate_token,
    create_payment_method,
    checkout_invoice,
    list_payment_method,
    delete_payment_method
}