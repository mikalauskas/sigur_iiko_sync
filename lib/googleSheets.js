const { parse } = require('csv-parse');
const utils = require('./utils.js');
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
  'Роль (0-сотрудник 1-преподаватель)': 'role',
  Уволен: 'isFired',
  'Кафедра/Отдел': 'department',
  'Штат (1-да 0-нет)': 'isStaff',
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

  if (remappedObj.role === '1') {
    remappedObj.isTeacher = true;
  } else {
    remappedObj.isTeacher = false;
  }
  remappedObj.fullname = `${remappedObj.lastName} ${remappedObj.firstName} ${remappedObj.middleName}`;

  remappedObj.id = generateHash(remappedObj);

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
  if (Array.isArray(teacherUsers) && teacherUsers.length < 1) return false;
  let moodleUsers = await moodle.getUsers();

  let totalMoodleTeachers = 0;
  for (const teacher of teacherUsers) {
    const foundTeacher = moodle.findTeacher(teacher, moodleUsers);

    // create update
    if (foundTeacher?.id && teacher.isFired === '0') {
      totalMoodleTeachers++;
      // update teacher
      //
    } else if (teacher.isFired === '0') {
      // create teacher
      if (await moodle.createTeacher(teacher, moodleUsers)) {
        console.log('create teacher in moodle', teacher);
      }
    }

    if (foundTeacher?.id && teacher.isFired === '1') {
      // disable teacher
      if (!foundTeacher.suspended) {
        if (await moodle.suspendUser(foundTeacher?.id)) {
          console.log('disable teacher in moodle', teacher);
        }
      }
    }
  }
  console.log(`googleSheets: total teachers in moodle ${totalMoodleTeachers}`);
};

const handleUmedTeacher = async (teacherUsers) => {
  if (Array.isArray(teacherUsers) && teacherUsers.length < 1) return false;
  let umedUsers = await umed.getUmedUsersTeachers();

  let totalUmedTeachers = 0;
  for (const teacher of teacherUsers) {
    const foundTeacher = umed.findTeacher(teacher, umedUsers);

    // create update
    if (foundTeacher?.ID && teacher.isFired === '0') {
      totalUmedTeachers++;
      // update teacher
      // await umed.updateTeacher(teacher, foundTeacher);
      //
    } else if (teacher.isFired === '0') {
      // create teacher
      if (await umed.createTeacher(teacher, umedUsers)) {
        console.log('create teacher in umed', teacher);
      }
    }

    if (foundTeacher?.ID && teacher.isFired === '1') {
      // disable teacher
      if (await umed.disableUser(foundTeacher)) {
        console.log('disable teacher in umed', teacher);
      }
    }
  }
  console.log(`googleSheets: total teachers in umed ${totalUmedTeachers}`);
};

const syncTeachers = async () => {
  console.log('google: syncTeachers job started');
  try {
    const response = await fetch(CSV_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch the spreadsheet. Status: ${response.status}`);
    }

    const csvData = await response.text();

    const records = await parseCSV(csvData);

    const users = records.map((item) => remapKeysAndAddId(item, keyMapping));

    const teacherUsers = users.filter((el) => el.isTeacher && el.phone);
    const employeeUsers = users.filter((el) => !el.isTeacher && el.phone);

    console.log(`googleSheets: total teachers ${teacherUsers.length}`);

    await utils.writeToJsonBOM('teacherUsers.json', teacherUsers);

    await handleUmedTeacher(teacherUsers);
    await handleMoodleTeacher(teacherUsers);
    console.log('google: syncTeachers job finshed');
  } catch (error) {
    console.error('Error reading spreadsheet:', error);
  }
};

module.exports = syncTeachers;
