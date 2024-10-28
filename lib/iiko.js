const utils = require('./utils.js');
const dotenv = require('dotenv');
const fs = require('node:fs/promises');
dotenv.config();

module.exports = function syncIiko(CUsers = [], sigurUsers = []) {
  if (utils.isArrayEmpty(CUsers) || utils.isArrayEmpty(sigurUsers)) return false;
  console.log('syncIiko job started');

  const valid1CUsers = CUsers.filter((user) => user.phone && user.status === 'Студент');

  const sigurActiveUsers = sigurUsers.filter((user) => user.sigur_last_active);

  const mergedSigur1CUsers = utils.mergeArraysUsingSimilarity(
    valid1CUsers,
    sigurActiveUsers,
    'fullname',
    'sigur_fullname',
  );

  const Users = mergedSigur1CUsers.filter(
    (user) => user.sigur_key && user.sigur_key !== '00000000000000',
  );

  const validUsers = Users.map((el) => {
    const phone = el.phone;
    const track_1 = el.sigur_key;
    const number_1 = el.sigur_key;
    const email = el.email;
    const last_name = el.lastName;
    const name = el.firstName;
    const middle_name = el.secondName;

    return {
      phone,
      track_1,
      number_1,
      email,
      last_name,
      name,
      middle_name,
    };
  });

  const csvHeader = Object.keys(validUsers[0]);

  const csvRows = validUsers.map((obj) => csvHeader.map((field) => obj[field]).join(';'));

  const csvContent = [csvHeader.join(';'), ...csvRows].join('\n');

  fs.writeFile('iiko.csv', csvContent, (err) => {
    if (err) {
      console.error('Error writing the CSV file', err);
    } else {
      console.log('CSV file created successfully');
    }
  });

  return true;
};
