const { parse } = require('csv-parse');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const keyMapping = {
  Фамилия: 'lastName',
  Имя: 'firstName',
  Отчество: 'middleName',
  Телефон: 'phone',
  'Эл. почта @umedcollege.ru': 'email',
  Пароль: 'password',
  Уволен: 'isFired',
  Кафедра: 'department',
  Штат: 'isStaff',
  'Ссылка на мираполис': 'mirapolisLink',
};

function generateHash(obj) {
  const valuesString = Object.values(obj).join('');
  return crypto.createHash('md5').update(valuesString).digest('hex');
}

function remapKeysAndAddId(obj, keyMapping) {
  const remappedObj = {};

  // Remap the keys
  Object.keys(obj).forEach((originalKey) => {
    const newKey = keyMapping[originalKey] || originalKey;
    remappedObj[newKey] = obj[originalKey];
  });

  remappedObj.id = generateHash(remappedObj);
  remappedObj.isTeacher = true;

  return remappedObj;
}

function parseCSV(csvData) {
  return new Promise((resolve, reject) => {
    parse(
      csvData,
      {
        columns: true,
        skip_empty_lines: true,
      },
      (err, records) => {
        if (err) {
          return reject(err);
        }
        resolve(records);
      },
    );
  });
}

async function syncTeachers() {
  try {
    const response = await fetch(CSV_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch the spreadsheet. Status: ${response.status}`);
    }

    const csvData = await response.text();

    const records = await parseCSV(csvData);

    const remappedData = records.map((item) => remapKeysAndAddId(item, keyMapping));

    return remappedData;
  } catch (error) {
    console.error('Error reading spreadsheet:', error);
  }
}

module.exports = syncTeachers;
