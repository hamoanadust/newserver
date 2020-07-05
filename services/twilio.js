const { twilio: { accountSid, authToken, senderPhone: from } } = require('../config/config.json')
const client = require('twilio')(accountSid, authToken)

const sendSMS = data => {
    const { body, phone: to } = data
    return client.messages
        .create({ body, from, to })
        .then(message => console.log('sms sent', message.sid))
}

module.exports = {
    sendSMS
}
