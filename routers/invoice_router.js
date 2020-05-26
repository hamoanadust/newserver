const express = require('express');
const invoice_router = express.Router();
const bodyParser = require('body-parser');
const db = require('../services/db');
const invoice = require('../services/invoice');
const { pass_user, verify_user, verify_admin } = require('../services/auth');

invoice_router.use(bodyParser.json());

invoice_router.route('/find_invoice')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await invoice.find_invoice(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

invoice_router.route('/list_all_invoice')
.get(verify_user, async (req, res, next) => {
    try {
        req.data = await invoice.list_all_invoice({ user: req.user })
        next()
    } catch (err) {
        throw err
    }
})

invoice_router.route('/list_invoice')
.post(verify_user, async (req, res, next) => {
    try {
        req.body.data.user = req.user
        req.data = await invoice.list_invoice(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

invoice_router.route('/create_invoice')
.post(verify_admin, async (req, res, next) => {
    try {
        req.body.data.admin = req.user
        req.data = await invoice.create_invoice(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

invoice_router.route('/list_invoice_for_admin')
.post(verify_admin, async (req, res, next) => {
    try {
        req.data = await invoice.list_invoice_for_admin(req.body.data)
        next()
    } catch (err) {
        throw err
    }
})

module.exports = {
    invoice_router
}