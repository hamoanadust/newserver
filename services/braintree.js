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

const checkout = async data => {
    try {
        const { paymentMethodNonce, invoice_id } = data
        console.log('data', data)
        const invoice = await execute_query('get_item_by_condition', { where: { invoice_id } }, 'invoice', db)
        console.log(invoice)
        const amount = invoice.reduce((r, e) => r + e.total_amount, 0)
        return new Promise((resolve, reject) => {
            gateway.transaction.sale({
                amount,
                paymentMethodNonce,
                options: {
                    // submitForSettlement: true
                }
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                console.log(result);
                resolve(result);
            });
        });

    } catch(err) {
        return err
    }
}

const sale = data => {
    const { amount, paymentMethodNonce, token } = data
    // if (token) paymentMethodNonce = undefined
    return new Promise((resolve, reject) => {
        gateway.transaction.sale({
            amount,
            token,
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
        const { paymentMethodNonce, invoice_id, user } = data
        console.log('data', data)
        const invoice = await execute_query('get_item_by_condition', { where: { whereand: { invoice_id, status: 'OUTSTANDING' } } }, 'invoice', db)
        if (!invoice || invoice.length === 0) throw new Error('No outstanding invoice is found')
        else if (Array.isArray(invoice_id) && invoice_id.length !== invoice.length) throw new Error('Some of the outstanding invoices are not found')
        const amount = invoice.reduce((r, e) => r + e.total_amount, 0)
        let payment = { amount }
        if (paymentMethodNonce) {
            payment.paymentMethodNonce = paymentMethodNonce
            console.log('pay by nonce', paymentMethodNonce)
        } else {
            const sql = `select p.token, p.is_default from user u left join payment_method p using (customer_id) where u.user_id = ${db.escape(user.user_id)}`
            console.log(sql)
            const tokens = await db.query(sql)
            console.log(tokens)
            payment.token = tokens.length === 1 ? tokens[0] : tokens.find(e => e.is_default)
            console.log('pay by token', payment.token)
        }
        if (!paymentMethodNonce && !payment.token) throw new Error('no payment method is provided')
        const resp = await sale(payment)
        if (resp.success) {
            console.log(resp)
            const invoice_item = await execute_query('get_item_by_condition', { where: { invoice_id } }, 'invoice_item', db )
            const season_id = invoice_item.map(e => e.season_id)
            await Promise.all([
                execute_query('update_item_by_id', { condition: { status: 'PAID' }, id: invoice_id }, 'invoice', db),
                execute_query('update_item_by_id', { condition: { status: 'ACTIVE' }, id: season_id }, 'season', db)
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

const create_customer = data => {
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
                console.log(result);
                const customer_id = result.customer.id
                console.log(result.customer.paymentMethods)
                try {
                    await Promise.all([
                        execute_query('update_item_by_id', { id: user.user_id, condition: { customer_id } }, 'user', db),
                        create_payment_method({ ...result.customer.paymentMethods[0], customer_id, is_default: true })
                    ])
                    resolve(success_res())
                } catch(er) {
                    reject(er)
                }
            } else {
                resolve(fail_res(result.message))
            }
        })
    })
}

const create_payment_method = data => {
    const { customer_id, token, cardType, maskedNumber, expirationDate, last4, is_default } = data
    const item = { customer_id, token, cardType, maskedNumber, expirationDate, last4, is_default, created_at: moment().format('YYYY-MM-DD'), updated_at: moment().format('YYYY-MM-DD') }
    return execute_query('create_item', item, 'payment_method', db)
}

const checkout_remember_customer = data => {
    const { paymentMethodNonce, amount } = data;
    return new Promise((resolve, reject) => {
        gateway.transaction.sale({
            amount,
            paymentMethodNonce,
            options: {
                // submitForSettlement: true
            }
        }, (err, result) => {
            if (err) {
                return reject(err);
            }
            console.log(result);
            gateway.customer.create({
                firstName: "Charity",
                lastName: "Smith",
                paymentMethodNonce
            }, (err, result) => {
                console.log(result.success);
                // true
              
                // console.log(result.customer.id);
                // e.g 160923
              
                // console.log(result.customer.paymentMethods[0].token);
                // e.g f28wm
                resolve(result);
            });
        });
    });
}

const checkout_customer = data => {
    // const { paymentMethodNonce, amount } = data;
    return new Promise((resolve, reject) => {
        gateway.transaction.sale({
            amount: 101,
            paymentMethodToken: 'jj9psq',
            options: {
                // submitForSettlement: true
            }
        }, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

const find_customer = data => {
    // const { user } = data;
    // const { user_id } = user;
    const user_id = '646203706';
    return new Promise((resolve, reject) => {
        gateway.customer.find(user_id, (err, customer) => {
            if (err) reject(err);
            resolve(customer);
        });
    });
}

const find_payment_method = data => {
    // const { user } = data;
    // const { user_id } = user;
    const token = 'jj9psq';
    return new Promise((resolve, reject) => {
        gateway.paymentMethod.find(token, (err, paymentMethod) => {
            if (err) reject(err);
            resolve(paymentMethod);
        });
    });
}

module.exports = {
    generate_token,
    // create_nonce,
    // checkout,
    // checkout_remember_customer,
    // find_customer,
    // find_payment_method,
    // checkout_customer,
    create_customer,
    checkout_invoice
}