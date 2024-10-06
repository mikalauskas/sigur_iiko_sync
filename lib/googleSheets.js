const { parse } = require('csv-parse');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
const moodle = require('./moodle.js');
const umed = require('./umed.js');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const keyMapping = {
  Фамилия: 'lastName',
  Имя: 'firstName',
  Отчество: 'middleName',
  Телефон: 'phone',
  'Эл. почта @umedcollege.ru': 'email',
  Пароль: 'password',
  Роль: 'role',
  Уволен: 'isFired',
  Кафедра: 'department',
  Штат: 'isStaff',
  'Ссылка на мираполис': 'mirapolisLink',
};

const generateHash = (obj) => {
  const valuesString = Object.values(obj).join('');
  return crypto.createHash('md5').update(valuesString).digest('hex');
};

const remapKeysAndAddId = (obj, keyMapping) => {
  const remappedObj = {};

  // Remap the keys
  Object.keys(obj).forEach((originalKey) => {
    const newKey = keyMapping[originalKey] || originalKey;
    remappedObj[newKey] = String(obj[originalKey]).trim();
    if (newKey === 'email') {
      remappedObj[newKey] = `${remappedObj[newKey]}@umedcollege.ru`;
    }
  });

  remappedObj.id = generateHash(remappedObj);
  if (remappedObj.role === '1') {
    remappedObj.isTeacher = true;
  } else {
    remappedObj.isTeacher = false;
  }
  remappedObj.fullname = `${remappedObj.lastName} ${remappedObj.firstName} ${remappedObj.middleName}`;

  return remappedObj;
};

const parseCSV = (csvData) => {
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
};

const handleMoodleTeacher = async (teacherUsers) => {
  let moodleUsers = await moodle.getUsers();

  let totalMoodleTeachers = 0;
  for (const teacher of teacherUsers) {
    const foundTeacher = moodle.findTeacher(teacher, moodleUsers);

    // create update
    if (foundTeacher?.id && teacher.isFired === '0') {
      totalMoodleTeachers++;
      //console.log(foundTeacher);
      // update teacher
    } else if (teacher.isFired === '0') {
      // create teacher

      await moodle.createTeacher(teacher, moodleUsers);
    }

    if (foundTeacher?.id && teacher.isFired === '1') {
      // disable teacher

      await moodle.suspendUser(foundTeacher?.id);
    }
  }
  console.log(`googleSheets: total teachers in moodle ${totalMoodleTeachers}`);
};

const handleUmedTeacher = async (teacherUsers) => {
  let umedUsers = await umed.getUmedUsersTeachers();

  let totalUmedTeachers = 0;
  for (const teacher of teacherUsers) {
    const foundTeacher = umed.findTeacher(teacher, umedUsers);

    // create update
    if (foundTeacher?.ID && teacher.isFired === '0') {
      totalUmedTeachers++;
      //console.log(foundTeacher);
      // update teacher
    } else if (teacher.isFired === '0') {
      // create teacher

      await umed.createTeacher(teacher, umedUsers);
    }

    if (foundTeacher?.ID && teacher.isFired === '1') {
      // disable teacher

      await umed.disableUser(foundTeacher);
    }
  }
  console.log(`googleSheets: total teachers in umed ${totalUmedTeachers}`);
};

const syncTeachers = async () => {
  try {
    const response = await fetch(CSV_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch the spreadsheet. Status: ${response.status}`);
    }

    const csvData = await response.text();

    const records = await parseCSV(csvData);

    const users = records.map((item) => remapKeysAndAddId(item, keyMapping));

    const teacherUsers = users.filter((el) => el.isTeacher);
    const employeeUsers = users.filter((el) => !el.isTeacher);

    if (Array.isArray(teacherUsers) && teacherUsers.length < 1) return false;
    console.log(`googleSheets: total teachers ${teacherUsers.length}`);

    await handleMoodleTeacher(teacherUsers);
    await handleUmedTeacher(teacherUsers);
  } catch (error) {
    console.error('Error reading spreadsheet:', error);
  }
};

module.exports = syncTeachers;
