const express = require('express')
const app = express()
const http_server = require('http').createServer(app)
const body_parser = require('body-parser')
const path = require('path')
const { join } = require('path')

const { http_port } = require('./config/config.json')
const { cors_options } = require('./services/cors')
const { headers } = require('./services/headers')
const { result } = require('./services/result')
const { errors } = require('./services/errors')
const { announcement_router } = require('./routers/announcement_router')
const { braintree_router } = require('./routers/braintree_router')
const { carpark_router } = require('./routers/carpark_router')
const { invoice_router } = require('./routers/invoice_router')
const { request_router } = require('./routers/request_router')
const { season_router } = require('./routers/season_router')
const { user_router } = require('./routers/user_router')
const { vehicle_router } = require('./routers/vehicle_router')

app.use(cors_options)
app.use(headers)
app.use(body_parser.json({limit: '50mb'}))
app.use(body_parser.urlencoded({limit: '50mb', extended: true}))
app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, 'services')))

app.set('views', join(__dirname, 'views'))
app.set('view engine', 'pug')

app.get('/', (req, res, next) => next())
app.get('/success', (req, res, next) => {
  req.data = {obj: 'result'}
  next()
})
app.get('/error', () => { 
  throw(new Error('test error')) 
})
app.use('/announcement', announcement_router)
app.use('/bt', braintree_router)
app.use('/carpark', carpark_router)
app.use('/invoice', invoice_router)
app.use('/request', request_router)
app.use('/season', season_router)
app.use('/user', user_router)
app.use('/vehicle', vehicle_router)
app.use(result)
app.use(errors)

app.on('error', err => {
  console.log('ldfkjhgdlkjfhgldkfjhglkdfjhg')
})
  
http_server.listen(http_port, () => console.log(`Http server listening on port ${http_port}`))

