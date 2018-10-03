const nodemailer = require('nodemailer');
require('dotenv').config();

exports.getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

exports.sendMail = (email, content) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'no-reply@travelpaddy.com',
    to: email,
    subject: 'Sample NodeJS Email',
    text: content,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};
