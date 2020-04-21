const mysql = require('mysql');
const { local_mysql_db, remote_mysql_db } = require('../config/config.json');

const pool  = mysql.createPool(local_mysql_db)
// const pool  = mysql.createPool(remote_mysql_db)

exports.pool = pool;

exports.query = sql => {
  return new Promise((resolve, reject) => {
      pool.query(sql, (err, rows) => {
          if (err) {
              return reject(err);
          }
          resolve(rows);
      });
  }).catch(err => { console.log('db err');throw err })
};

exports.escape = value => {
    return pool.escape(value);
}

pool.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
  if (error) throw error;
  console.log('Local MySQL database connected');
});
