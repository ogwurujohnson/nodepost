const pg = require('pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

let myDatabase;

if (process.env.NODE_ENV === 'development') {
  myDatabase = process.env.DEVPOSTGRES_DB;
} else if (process.env.NODE_ENV === 'test') {
  // change on deployment and testing //myDatabase = 'travis';]
  myDatabase = process.env.TESTPOSTGRES_DB;
} else if (process.env.NODE_ENV === 'production') {
  myDatabase = process.env.POSTGRES_DB;
}

const config = {
  user: process.env.POSTGRES_USER,
  database: myDatabase,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000,
};

const pool = new pg.Pool(config);

pool.on('connect', () => {
  console.log('connected to the db');
});


/**
 * Create Tables
 */
const createTables = () => {
  const userTable = `CREATE TABLE IF NOT EXISTS
      users(
        id SERIAL PRIMARY KEY,
        title VARCHAR(128) NOT NULL,
        firstName VARCHAR(128) NOT NULL,
        surName VARCHAR(128) NOT NULL,
        email VARCHAR(128) NOT NULL,
        password VARCHAR(128) NOT NULL,
        role VARCHAR(128) NOT NULL,
        activationCode varchar(128) NOT NULL,
        isActivated VARCHAR(128) NOT NULL,
        created_date TIMESTAMP default now(),
        modified_date TIMESTAMP default now()
      )`;
  pool.query(userTable)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
};

const seed = () => {
  const userQuery = 'INSERT INTO users (title, firstName, surName, email, password, activationcode, isactivated, role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *';

  pool.connect((err, client, done) => {
    // check if user exists before inserting
    client.query('SELECT * FROM users WHERE email = $1', ['test@gmail.com'], (error, result) => {
      done();
      if (result.rows >= '1') {
        console.log('user exists');
      } else {
        bcrypt.hash('test', 10, (err, hash) => {
          if (err) {
            console.log(err);
          } else {
            // insert into table USER
            pool.connect((err, client, done) => {
              const userValues = ['Mr/Mrs', 'john', 'doe', 'test@gmail.com', hash, hash, 'false', 'admin'];
              client.query(userQuery, userValues, (error, result) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log('user added');
                }
                done();
              });
            });
          }
        });
      }
    });
  });
};

/**
 * Drop Tables
 */
  const dropTables = () => {
  const dropUser = 'DROP TABLE IF EXISTS users';
  // you can add other drop table statements here

  pool.query(dropUser)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  // for any of the table dropped, replicate the code above with the variable the DROP statement is assigned to
};

pool.on('remove', () => {
  console.log('client removed');
  process.exit(0);
});

module.exports = {
  createTables,
  dropTables,
  pool,
  seed,
};

require('make-runnable');
