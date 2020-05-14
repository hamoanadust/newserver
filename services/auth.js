const passport = require('passport')
const db = require('./db')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwt = require('jsonwebtoken')
const config = require('../config/config.json')

const get_token = user => {
    return jwt.sign(user, config.secretKey, { expiresIn: 604800 })
}

let opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
opts.secretOrKey = config.secretKey

passport.use('user', new JwtStrategy(opts,
    async (jwt_payload, done) => {
        console.log('jwt payload', jwt_payload)
        db.pool.query("SELECT user_id, customer_id, username, role, name, email, company, contact_number FROM user WHERE user_id = " + jwt_payload.user_id, (err, rows) => {
            console.log(rows)
            if (err) {
                return done(err, false)
            } else if (rows.length > 0) {
                return done(null, rows[0])
            } else {
                return done(null, false)
            }
        })
    })
)

passport.use('admin', new JwtStrategy(opts,
    async (jwt_payload, done) => {
        db.pool.query("SELECT username, role, user_id FROM user WHERE role like '%admin%' and user_id = " + jwt_payload.user_id, (err, rows) => {
            if (err) {
                return done(err, false)
            } else if (rows.length > 0) {
                return done(null, rows[0])
            } else {
                return done(null, false)
            }
        })
    })
)

const pass_user = (req, res, next) => {
    passport.authenticate('user', {session: false}, (err, user) => {
        if (err) {
            res.json({success: false, statusCode: 403, message: err.message})
        } else {
            console.log('pass user', user)
            req.user = user
            next()
        }
    })(req, res, next)
}

const verify_user = (req, res, next) => {
    passport.authenticate('user', {session: false}, (err, user) => {
        if (err) {
            res.json({success: false, statusCode: 403, message: err.message})
        } else if (!user) {
            res.json({success: false, statusCode: 403, message: "Unauthorized"})
        } else {
            req.user = user
            next()
        }
    })(req, res, next)
}

const verify_admin = (req, res, next) => {
    passport.authenticate('admin', {session: false}, (err, user) => {
        if (err) {
            res.json({success: false, statusCode: 403, message: err.message})
        } else if (!user) {
            res.json({success: false, statusCode: 403, message: "Unauthorized, admin only"})
        } else {
            req.user = user
            next()
        }
    })(req, res, next)
}  

module.exports = {
    get_token,
    pass_user,
    verify_user,
    verify_admin
}