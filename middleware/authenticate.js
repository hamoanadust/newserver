const passport = require('passport');
const passportAdmin = require('passport');
const db = require('../services/db');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const { secretKey } = require('../config/config.json');

exports.getToken = user => {
    return jwt.sign(user, secretKey,
        {expiresIn: 604800});
};

let opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secretKey;

passport.use('admin', new JwtStrategy(opts,
    (jwt_payload, done) => {
        if (jwt_payload.admin_id) {
            const query = {
                text: "SELECT * FROM admins WHERE ClientID = $1",
                value: jwt_payload.admin_id
            }
            db.query(query, (err, rows) => {
                if (err) {
                    return done(err, false);
                } else if (rows.length > 0) {
                    return done(null, rows[0]);
                } else {
                    return done(null, false);
                }
            });
        } else {
            return done(null, false);
        }
    })
);

passport.use('employee', new JwtStrategy(opts,
    (jwt_payload, done) => {
        if (jwt_payload.AccountID) {
            db.get().query("SELECT * FROM account WHERE AccountID = " + jwt_payload.AccountID, (err, rows) => {
                if (err) {
                    return done(err, false);
                } else if (rows.length > 0) {
                    return done(null, rows[0]);
                } else {
                    return done(null, false);
                }
            });
        } else {
            return done(null, false);
        }
    })
);

exports.verifyUser = (req, res, next) => {
    passport.authenticate('client', {session: false}, (err, user) => {
        if (err) {
            res.json({success: false, statusCode: 403, message: err.message})
        } else if (!user) {
            res.json({success: false, statusCode: 403, message: "Unauthorized"})
        } else {
            req.user = user;
            next();
        }
    })(req, res, next);
}

exports.verifyEmployee = (req, res, next) => {
    passport.authenticate('employee', {session: false}, (err, user) => {
        if (err) {
            res.json({success: false, statusCode: 403, message: err.message})
        } else if (!user) {
            res.json({success: false, statusCode: 403, message: "Unauthorized, employee only"})
        } else {
            req.user = user;
            next();
        }
    })(req, res, next);
};  

exports.verifyAdmin = (req, res, next) => {
    passport.authenticate('employee', {session: false}, (err, user) => {
        if (err) {
            res.json({success: false, statusCode: 403, message: err.message})
        } else if (!user) {
            res.json({success: false, statusCode: 403, message: "Unauthorized, admin only"})
        } else if (user.AccType === "Admin") {
            next();
        } else {
            var err = new Error ("You are not admin");
            err.status = 403;
            return next(err);
        }
    })(req, res, next);
};
