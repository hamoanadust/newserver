const cors = require('cors')

const whitelist = ['http://localhost:4201', 'http://localhost:4200', 'http://localhost:80', 'http://localhost:8080', 'http://biddit.sg:4000', undefined]

const option = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            console.log(origin)
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}

module.exports = {
    cors,
    cors_options: cors(option)
}