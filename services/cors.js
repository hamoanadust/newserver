const cors = require('cors');

const whitelist = ['https://rognerfung.github.io/tp-demo', 'http://localhost:4202', 'http://localhost:4201', 'http://localhost:80', undefined];

let corsOptions = {
    origin: (origin, callback) => {
        console.log(origin);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            console.log(origin);
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}

module.exports = {
    cors,
    corsWithOptions: cors(corsOptions)
}