const fetch = require('node-fetch')

const execute_command = req => {
    const { url, method, json } = req
    console.log(req)
    return fetch(url, { method, body: JSON.stringify(json), headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer 82e8f0db39251223929e43c7e0a235b3' } }).then(res => res.json())
}

const paynow_qr = data => {
    const { ExpiryDate, ReferenceText, Amount, QRCodeSize, ProxyType, ProxyValue } = data
    const req = {
        url: 'https://api.ocbc.com:8243/transactional/paynowqr/1.0/payNowQR',
        method: 'POST',
        json: { ExpiryDate, ReferenceText, Amount, QRCodeSize, ProxyType, ProxyValue }
    }
    return execute_command(req)
}

const callback = data => {
    console.log(data)
    return data
}

module.exports = {
    paynow_qr,
    callback
}