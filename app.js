const express = require('express');
const app = express();
const server = require('http').createServer(app);
const cors = require('cors');
const path = require('path');
const { join } = require('path');
const bodyParser = require('body-parser');
const config = require('./config/config.json');
const web_port = config.web_port;
const { braintree_router } = require('./routers/braintree_router');
const { carpark_router } = require('./routers/carpark_router');
const { invoice_router } = require('./routers/invoice_router');
const { season_router } = require('./routers/season_router');
const { user_router } = require('./routers/user_router');
const { vehicle_router } = require('./routers/vehicle_router');
const fs = require('fs');
const { corsWithOptions } = require('./services/cors');


app.use(corsWithOptions);
// const staticRoot = join(__dirname, 'services');

// app.use(express.static(staticRoot));
// const html = fs.readFileSync( __dirname + '/index.html' );
// res.json({html: html.toString(), data: obj});

// require('./services/io')(io);
// copy_entire_movement();

// let whitelist = ['http://localhost:4200','http://localhost:80'];
// let corsOptions = {
//     origin: (origin, callback)=>{
//         if (whitelist.indexOf(origin) !== -1) {
//             callback(null, true)
//         } else {
//             callback(new Error('Not allowed by CORS'))
//         }
//     },credentials: true
// }
// app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    next();
});

//follow security advice by expressjs
app.disable('x-powered-by');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'services')));

// app.use('/admin', admin_router);

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'pug');

// app.get('*', (req, res) => { 
//     const clientToken = 'test token';
//     res.render('checkouts/new', {
//         clientToken
//     });
// })

app.use((err, req, res, next) => {
    console.error('catcing err');
    console.error(err);
    res.send(err.stack);
});

app.get('/', (req, res, next) => res.json(req.params))
app.use('/bt', braintree_router);
app.use('/carpark', carpark_router);
app.use('/invoice', invoice_router);
app.use('/season', season_router);
app.use('/user', user_router);
app.use('/vehicle', vehicle_router);

server.listen(web_port, () => console.log(`Web server listening on port ${web_port}`));

