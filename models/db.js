const pg = require('pg');
require('dotenv').config();

let myDatabase;

if (process.env.NODE_ENV === 'development') {
  myDatabase = process.env.DEVPOSTGRES_DB;
} else if (process.env.NODE_ENV === 'test') {
  //change on deployment and testing //myDatabase = 'travis';]
  myDatabase = process.env.TESTPOSTGRES_DB;
} else if (process.env.NODE_ENV === 'production') {
  myDatabase = process.env.POSTGRES_DB;
}

/**
 * ! please dont forget to change NODE_ENV=production when deploying
 */

const config = {
  user: process.env.POSTGRES_USER,
  database: myDatabase,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000,
};

const pool = new pg.Pool(config);

module.exports = pool;
