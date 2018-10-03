require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');
const authRoute = require('./routes/auth');


const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/api/v1', (req, res) => {
  res.status(200).send('Welcome to SchoolsNG API');
});

app.use('/api/v1/auth', authRoute);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

const port = process.env.PORT || 3000;

if (!module.parent) { // used to prevent our test from listening twice very important
  app.listen(port, () => {
    console.log(`We are live at 127.0.0.1:${port}`);
  });
}

module.exports = app;
