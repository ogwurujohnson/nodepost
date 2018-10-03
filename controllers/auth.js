require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../models/db');
const { getRndInteger, sendMail } = require('../middleware/helperFunctions');

let secret;
if (process.env.NODE_ENV === 'test') {
  secret = 'test';
} else {
  secret = process.env.JWT_SECRET_KEY;
}

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


exports.signUp = (req, res) => {
  const {
    title, firstName, surName, email, password, role,
  } = req.body;
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM users WHERE email = $1', [email], (error, result) => {
      done();
      if (result.rows >= '1') {
        res.status(409).json({
          status: 'Failed',
          message: 'conflict: User already exists',
        });
      } else {
        bcrypt.hash(password, 10, (bcryptErr, hash) => {
          if (bcryptErr) {
            res.status(400).send(err);
          } else {
            pool.connect((insertError, insertClient, insertDone) => {
              if (insertError) {
                console.log(`connection to db failed ${insertError}`);
              }
              // split email and pick just username then concat with a randomly generated number as verification id
              const splitEmail = email.split('@')[0];
              const randomCode = getRndInteger('0', '7000');
              const activationCode = `${splitEmail}-${randomCode}`;
              const hashedPassword = hash;
              // validate inputs before insertion
              const schema = Joi.object().keys({
                firstName: Joi.string().required(),
                surName: Joi.string().required(),
                email: Joi.string().email({ minDomainAtoms: 2 }).required(),
                password: Joi.string().required(),
              });
              Joi.validate({
                firstName, surName, email, password,
              }, schema, (err, value) => {
                if (err) {
                  res.status(422).json({
                    status: 'error',
                    message: 'Invalid request data',
                  });
                } else {
                  const query = 'INSERT INTO users(title, firstname, lastname, email, password, role, activationCode, isActivated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
                  const values = [title, firstName, surName, email, hashedPassword, role, activationCode, 'false'];
                  insertClient.query(query, values, (error, result) => {
                    insertDone();
                    if (error) {
                      console.log(error);
                      res.status(400).send(error);
                    }
                    const userId = result.rows[0].id;
                    const data = { email, userId };
                    // generating token for user on signup so they dont have to be redirected to the login page but rather continue, but then need to verify their mail
                    jwt.sign({ data }, secret, { expiresIn: '24h' }, (jwtErr, token) => {
                      res.status(200).json({
                        status: 'Success',
                        message: 'Account Created Successfully, Check your mail for Verification Link',
                        user: result.rows[0],
                        token,
                      });
                    });
                    // sending verification mail with nodemailer module
                    const content = `Follow the link to activate https://url.com/${activationCode}`;
                    sendMail(email, content);
                  });
                }
              });
            });
          }
        });
      }
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  pool.connect((err, client, done) => {
    client.query('SELECT * FROM users WHERE email = $1', [email], (checkErr, checkRes) => {
      done();
      if (checkRes.rows < '1') {
        res.status(401).json({
          status: 'Failed',
          message: 'user not found on server',
        });
      } else {
        const hash = checkRes.rows[0].password;
        const userEmail = checkRes.rows[0].email;
        const userId = checkRes.rows[0].id;
        const { firstname, lastname, role } = checkRes.rows[0];
        bcrypt.compare(password, hash, (bcryptErr, bcryptRes) => {
          if (bcryptRes) {
            const data = {
              userEmail,
              userId,
            };
            jwt.sign({ data }, secret, { expiresIn: '24h' }, (jwtErr, token) => {
              res.status(200).json({
                status: 'Success',
                message: 'Authentication Successful',
                user: {
                  token,
                  userId,
                  firstname,
                  lastname,
                  role,
                },
                
              });
            });
          } else {
            res.status(401).json({
              status: 'Failed',
              message: 'Email or Password Incorrect',
            });
          }
        });
      }
    });
  });
};


exports.verify = (req, res) => {
  const { userId } = req.body;
  const verificationCode = req.params.vc;
  pool.connect((err, client, done) => {
    client.query('SELECT activationcode FROM users WHERE id = $1', [userId], (error, value) => {
      done();
      const { activationcode } = value.rows[0];
      if (verificationCode !== activationcode) {
        res.status(409).json({
          status: 'Failed',
          message: 'Verification Code is incorrect',
        });
      } else {
        const updateQuery = 'UPDATE users SET isactivated = $1 WHERE id=$2 AND activationcode = $3';
        const updateValue = [true, userId, verificationCode];
        client.query(updateQuery, updateValue, (updateError, updateResult) => {
          done();
          if (updateError) {
            res.status(400).json({
              message: updateError,
            });
          } else {
            res.status(200).json({
              status: 'Success',
              message: 'Account Verified',
            });
          }
        });
      }
    });
  });
};


exports.generateVCode = (req, res) => {
  pool.connect((err, client, done) => {
    const { email } = req.body;
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkValue = [email];
    client.query(checkQuery, checkValue, (error, result) => {
      done();
      if (result.rows < '1') {
        res.status(401).json({
          status: 'Failed',
          message: 'Email not on system',
        });
      } else {
        const splitEmail = email.split('@')[0];
        const randomCode = getRndInteger('0', '7000');
        const activationCode = `${splitEmail}-${randomCode}`;
        const content = `Your new verification code from App is here ${activationCode}`;
        sendMail(email, content);
        res.status(200).json({
          status: 'Success',
          message: 'Verification Resent check Mail',
        });
      }
    });
  });
};

exports.forgotPassword = (req, res) => {
  pool.connect((err, client, done) => {
    const { email } = req.body;
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkValue = [email];
    client.query(checkQuery, checkValue, (error, result) => {
      done();
      if (result.rows < '1') {
        res.status(401).json({
          status: 'Failed',
          message: 'Email not on system',
        });
      } else {
        const verificationCode = getRndInteger('0', '7000');
        const content = `Your change password verification is here  ${verificationCode}`;
        bcrypt.hash(verificationCode, 10, (hashError, hash) => {
          if (hashError) {
            res.status(400).send(hashError);
          } else {
            res.status(200).json({
              status: 'Success',
              generatedCode: hash,
            });
            sendMail(email, content);
          }
        });
      }
    });
  });
};

exports.verifyPasswordChangeToken = (req, res) => {
  const { suppliedCode, hash } = req.body;
  bcrypt.compare(suppliedCode, hash, (err, hashRes) => {
    if (hashRes) {
      res.status(200).json({
        status: 'Success',
        message: 'Verification Successful',
      });
    } else {
      res.status(400).json({
        status: 'Failed',
        message: 'Verification not Successful, try again',
      });
    }
  });
};

exports.changeForgotPassword = (req, res) => {
  pool.connect((err, client, done) => {
    const { email, password } = req.body;
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkValue = [email];
    client.query(checkQuery, checkValue, (error, result) => {
      done();
      if (result.rows < '1') {
        res.status(401).json({
          status: 'Failed',
          message: 'Email not on system',
        });
      } else {
        bcrypt.hash(password, 10, (hashErr, hash) => {
          if (hashErr) {
            res.status(401).send(err);
          } else {
            const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2';
            const updateValue = [hash, email];
            pool.connect((error, client, done) => {
              client.query(updateQuery, updateValue, (updateError, updateResult) => {
                done();
                if (updateError) {
                  res.status(401).send(updateError);
                } else {
                  res.status(200).json({
                    status: 'Success',
                    message: 'password change successful',
                    hash,
                  });
                }
              });
            });
          }
        });
      }
    });
  });
};


/**
 * ? Note: for forgotten Password, we generate a random code send to the users email,
 * ? and at thesame time hash the ?code then send as
 * ? a response to either be stord in local storage, session or cookie.
 * ? which is sent back to the server to use
 * ? for comparisons, if status = 200
 * ? we redirect user to change password page.
 * ? then make a call to change password controller when user changes password
 */
