const db = require('./db');
const { execute_query } = require('./dao');
const { success_res, fail_res } = require('./tool');
const braintree = require("braintree");
const { braintree_config } = require('../config/config.json');

const gateway = braintree.connect({
    ...braintree_config,
    environment: braintree.Environment.Sandbox
});

const generate_token = data => {
    return new Promise((resolve, reject) => {
        gateway.clientToken.generate(data, (err, response) => {
            if (err) {
                return reject(err);
            }
            resolve(response.clientToken);
        });
    });
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

const create_customer = data => {
    let { paymentMethodNonce, user } = data;
    if (!user) user = {};
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
                const customer_id = result.customer.id;
                const token = result.customer.token;
                try {
                    await execute_query('update_item_by_id', { id: user.user_id, condition: { customer_id, token } }, 'user', db);
                    resolve(success_res());
                } catch(er) {
                    reject(er)
                }
            } else {
                resolve(fail_res(result.message));
            }
        });
    });
}

const create_nonce = data => {
    const { clientToken } = data;
    return new Promise((resolve, reject) => {
        gateway.paymentMethodNonce.create(clientToken, (err, response) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(response.paymentMethodNonce.nonce);
        });
    });
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
    create_nonce,
    checkout,
    checkout_remember_customer,
    find_customer,
    find_payment_method,
    checkout_customer,
    create_customer
}