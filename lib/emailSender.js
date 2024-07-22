require('dotenv').config();
const nodemailer = require('nodemailer');
const utils = require('./utils.js');

/**
 * Send an email using SMTP.
 *
 * @param {string} to - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text body of the email.
 * @param {string} [html] - The HTML body of the email (optional).
 */
const sendEmail = async (to, subject, text, html = '') => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // SMTP configuration
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: user, // sender's email
      pass: pass, // sender's email password
    },
  });

  // Email options
  const mailOptions = {
    from: user, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html, // html body (optional)
  };

  // Send email
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);

    await utils.delay(Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
