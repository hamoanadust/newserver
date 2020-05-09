const express = require('express');
const braintree_router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const { generate_token, checkout } = require('../services/braintree');
const { pass_user, verify_user, verify_admin } = require('../services/auth');
const bt = require('../services/braintree');

braintree_router.use(bodyParser.json());

braintree_router.get('/save_customer', async (req, res) => {
    const clientToken = await bt.generate_token({});
    res.render('checkouts/save_customer', {
        clientToken
    });
});

braintree_router.get('/create_checkout', async (req, res) => {
    const clientToken = await bt.generate_token({});
    res.render('checkouts/create_checkout', {
        clientToken
    });
});

braintree_router.route('/test')
.post((req, res, next) => {
    res.json(req.body);
});

braintree_router.route('/generate_token')
.post(async (req, res, next) => {
    const resp = await generate_token({});
    res.json(resp);
});

braintree_router.route('/checkout')
.post(async (req, res, next) => {
    req.data = await bt.checkout(req.body.data)
    next()
});

braintree_router.route('/checkout_remember_customer')
.post(async (req, res, next) => {
    console.log(req.body);
    const { paymentMethodNonce, amount } = req.body;
    const resp = await bt.checkout_remember_customer({ paymentMethodNonce, amount });
    console.log(resp);
    res.json('success');
});

braintree_router.route('/find_customer')
.post(async (req, res, next) => {
    const resp = await bt.find_customer(req.body.data);
    res.json(resp);
});

braintree_router.route('/find_payment_method')
.post(async (req, res, next) => {
    const resp = await bt.find_payment_method(req.body.data);
    res.json(resp);
});
  
braintree_router.route('/checkout_customer')
.post(async (req, res, next) => {
    const resp = await bt.checkout_customer(req.body.data);
    res.json(resp);
});
  
braintree_router.route('/create_customer')
.post(pass_user, async (req, res, next) => {
    const { paymentMethodNonce } = req.body;
    const resp = await bt.create_customer({ paymentMethodNonce, user: req.user });
    console.log(resp);
    res.json(resp);
});

module.exports = {
    braintree_router
};