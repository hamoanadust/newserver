const express = require('express');
const invoice_router = express.Router();
const bodyParser = require('body-parser');
const db = require('../services/db');
const invoice = require('../services/invoice');
const { pass_user, verify_user, verify_admin } = require('../services/auth');

invoice_router.use(bodyParser.json());

invoice_router.route('/')
.get((req, res, next) => {
    res.json('invoice router is serving');
});

invoice_router.route('/test')
.post((req, res, next) => {
    res.json(req.body);
});


invoice_router.route('/find_invoice')
.post(verify_user, async (req, res, next) => {
    req.body.data.user = req.user;
    const resp = await invoice.find_invoice(req.body.data);
    res.json(resp);
});

invoice_router.route('/list_invoice')
.post(verify_user, async (req, res, next) => {
    req.body.data.user = req.user;
    const resp = await invoice.list_invoice(req.body.data);
    res.json(resp);
});

invoice_router.route('/create_invoice')
.post(verify_admin, async (req, res, next) => {
    req.body.data.admin = req.user;
    const resp = await invoice.create_invoice(req.body.data);
    res.json(resp);
});

invoice_router.route('/list_invoice_for_admin')
.post(verify_admin, async (req, res, next) => {
    const resp = await invoice.list_invoice_for_admin(req.body.data);
    res.json(resp);
});

module.exports = {
    invoice_router
};