const pg = require('pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

let myDatabase;

if (process.env.NODE_ENV === 'development') {
  myDatabase = process.env.DEVPOSTGRES_DB;
} else if (process.env.NODE_ENV === 'test') {
  //change on deployment and testing //myDatabase = 'travis';]
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
        firstname VARCHAR(128) NOT NULL,
        lastname VARCHAR(128) NOT NULL,
        email VARCHAR(128) NOT NULL,
        password VARCHAR(128) NOT NULL,
        role VARCHAR(128) NOT NULL,
        activationCode varchar(128) NOT NULL,
        isActivated VARCHAR(128) NOT NULL,
        created_date TIMESTAMP,
        modified_date TIMESTAMP
      )`;
  /* const questionTable = `CREATE TABLE IF NOT EXISTS
      questions(
        question_id SERIAL PRIMARY KEY,
        question_title VARCHAR(128) NOT NULL,
        question_description VARCHAR(1500) NOT NULL,
        user_id INT NOT NULL
      )`;
  const answerTable = `CREATE TABLE IF NOT EXISTS
      answers(
        answer_id SERIAL PRIMARY KEY,
        question_id INT NOT NULL,
        answer_description VARCHAR(1000) NOT NULL,
        upvote INT DEFAULT 0,
        downvote INT DEFAULT 0,
        accepted INT DEFAULT 0,
        user_id INT NOT Null
      )`;
  const replyTable = `CREATE TABLE IF NOT EXISTS
      replies(
        reply_id SERIAL PRIMARY KEY,
        answer_id INT NOT NULL,
        reply_description VARCHAR(1000) NOT NULL,
        user_id INT NOT NULL
      )`; */
  pool.query(userTable)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  /* pool.query(answerTable)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  pool.query(replyTable)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  pool.query(questionTable)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    }); */
};

 const seed = () => {
  const userQuery = 'INSERT INTO users (firstname,lastname,email,password,role) VALUES ($1,$2,$3,$4,$5) RETURNING *';

  pool.connect((err, client, done) => {
    client.query('SELECT * FROM users WHERE email = $1', ['test@gmail.com'], (error, result) => {
      done();
      if (result.rows >= '1') {
        console.log('user exists');
      } else {
        bcrypt.hash('test', 10, (err, hash) => {
          if (err) {
            res.status(400).send(err);
          } else {
            pool.connect((err, client, done) => {
              const userValues = ['john', 'doe', 'test@gmail.com', hash, 'admin'];
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

  const questionQuery = 'INSERT INTO questions (question_title,question_description,user_id) VALUES ($1,$2,$3) RETURNING *';
  const questionValues = ['Example question', 'a long description of question', '1'];
  pool.connect((err, client, done) => {
    client.query(questionQuery, questionValues, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Question added');
      }
      done();
    });
  });

  const answerQuery = 'INSERT INTO answers (question_id,answer_description,user_id) VALUES ($1,$2,$3) RETURNING *';
  const answerValues = ['1', 'a long answer desc', '1'];
  pool.connect((err, client, done) => {
    client.query(answerQuery, answerValues, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Answer added');
      }
      done();
    });
  });

  const replyQuery = 'INSERT INTO replies (answer_id,reply_description,user_id) VALUES ($1,$2,$3) RETURNING *';
  const replyValues = ['1', 'example reply description', '1'];
  pool.connect((err, client, done) => {
    client.query(replyQuery, replyValues, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Replies added');
      }
      done();
    });
  });
};

/**
 * Drop Tables
 */
  const dropTables = () => {
  const dropUser = 'DROP TABLE IF EXISTS users';
  const dropQuestion = 'DROP TABLE IF EXISTS questions';
  const dropAnswer = 'DROP TABLE IF EXISTS answers';
  const dropReply = 'DROP TABLE IF EXISTS replies';

  pool.query(dropUser)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  pool.query(dropQuestion)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  pool.query(dropAnswer)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
  pool.query(dropReply)
    .then((res) => {
      console.log(res);
      pool.end();
    })
    .catch((err) => {
      console.log(err);
      pool.end();
    });
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
