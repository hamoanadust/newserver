const request = require('request');
const { chatapi } = require('../config/config.json');

const execute_command = req => {
    return new Promise((resolve, reject) => {
        request(req, (err, resp) => {
            if (err) reject(err);
            resolve(resp.body);
        })
    })
}

const req = {
    url,
    method,
    json: { chatId, phone, body }
}

let api = {}
api.payNowQR = data => {
    const { ExpiryDate, ReferenceText, Amount, QRCodeSize, ProxyType, ProxyValue } = data
    const params = { ExpiryDate, ReferenceText, Amount, QRCodeSize, ProxyType, ProxyValue }
    const url = 'https://api.ocbc.com:8243/transactional/paynowqr/1.0/payNowQR'

}

module.exports = {

}