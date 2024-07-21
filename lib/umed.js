const utils = require('./utils.js');
const sendEmail = require('./emailSender.js');
const wazzup = require('./wazzup.js');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.UMED_TOKEN;

const UMED_ABITURIENT_GROUP_ID = '8';
const UMED_STUDENT_GROUP_ID = '9';
const UMED_TEACHER_GROUP_ID = '10';
const UMED_CAFE_GROUP_ID = '13';
const UMED_PARENT_GROUP_ID = '18';

const fetchData = async (id) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const fetchUrl = 'https://umedcollege.ru/api/users/';
  try {
    const response = await fetch(id ? fetchUrl + id : fetchUrl, {
      method: 'GET',
      headers: headersList,
    });

    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      //console.error(await response.text());
      return false;
    }
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

const putData = async (data = {}) => {
  if (utils.isEmpty(data)) return false;

  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const body = JSON.stringify(data);

  const fetchUrl = 'https://umedcollege.ru/api/users/';

  try {
    const response = await fetch(fetchUrl, {
      method: 'PUT',
      headers: headersList,
      body: body,
    });

    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      //console.error(await response.text());
      return false;
    }
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

const postData = async (data = {}) => {
  if (utils.isEmpty(data)) return false;

  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const body = JSON.stringify(data);

  const fetchUrl = 'https://umedcollege.ru/api/users/';

  try {
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: headersList,
      body: body,
    });

    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      //console.error(await response.text());
      return false;
    }
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

const formatUUsers = (data = []) => {
  if (utils.isEmpty(data)) return false;

  return data.map((el) => {
    const {
      ID,
      ACTIVE,
      LOGIN,
      PHONE_NUMBER,
      LAST_NAME,
      NAME,
      SECOND_NAME,
      EMAIL,
      XML_ID,
      GROUPS_ID,
      UF_PERSON_ID,
      UF_SNILS,
      UF_GUID,
      UF_PHONE,
      UF_PARENT_ID,
      UF_PARENT_STUDENT_ID,
      UF_PARENT_STUDENT_PHONE,
      UF_PARENT_STUDENT_NAME,
      UF_ID_BITRIX,
      UF_APP_PASSWORD,
      UF_COLLEDGE_GROUP,
      UF_ID_MOODLE,
      UF_ID_MOODLE_GROUP,
      LAST_ACTIVITY_DATE,
      LAST_LOGIN,
      DATE_REGISTER,
      TIMESTAMP_X,
    } = el;

    const fullname =
      `${LAST_NAME ? LAST_NAME.charAt(0).toUpperCase() + LAST_NAME.substr(1).toLowerCase() : ' '} ${NAME ? NAME.charAt(0).toUpperCase() + NAME.substr(1).toLowerCase() : ' '} ${SECOND_NAME ? SECOND_NAME.charAt(0).toUpperCase() + SECOND_NAME.substr(1).toLowerCase() : ' '}`.trim();

    return {
      ID,
      ACTIVE,
      LOGIN,
      PHONE_NUMBER,
      FULL_NAME: fullname,
      LAST_NAME,
      NAME,
      SECOND_NAME,
      EMAIL,
      XML_ID,
      GROUPS_ID,
      UF_PERSON_ID,
      UF_SNILS,
      UF_GUID,
      UF_PHONE,
      UF_PARENT_ID,
      UF_PARENT_STUDENT_ID,
      UF_PARENT_STUDENT_PHONE,
      UF_PARENT_STUDENT_NAME,
      UF_ID_BITRIX,
      UF_APP_PASSWORD,
      UF_COLLEDGE_GROUP,
      UF_ID_MOODLE,
      UF_ID_MOODLE_GROUP,
      LAST_ACTIVITY_DATE,
      LAST_LOGIN,
      DATE_REGISTER,
      TIMESTAMP_X,
    };
  });
};

const formatCUser = (data = {}) => {
  if (utils.isEmpty(data)) return false;

  const {
    person_id,
    person_snils,
    student_id,
    bitrix_id,
    fullname,
    login,
    password,
    phone,
    email,
    group_name,
    customer_name,
    customer_phone,
    customer_email,
  } = data;

  const result = {
    ACTIVE: 'Y',
    LOGIN: phone,
    PHONE_NUMBER: phone,
    EMAIL: email,
    XML_ID: bitrix_id,
    UF_PHONE: phone,
    UF_PERSON_ID: person_id,
    UF_SNILS: person_snils,
    UF_GUID: student_id,
    UF_ID_BITRIX: login,
    UF_APP_PASSWORD: password,
    UF_COLLEDGE_GROUP: group_name,
    UF_PARENT_NAME: customer_name,
    UF_PARENT_PHONE: customer_phone,
    UF_PARENT_EMAIL: customer_email,
    UF_PARENT_ID: bitrix_id,
  };

  if (fullname) {
    const [lastName, firstName, secondName] = fullname.split(' ');
    result.LAST_NAME = lastName
      ? lastName.charAt(0).toUpperCase() + lastName.substr(1).toLowerCase()
      : '';
    result.NAME = firstName
      ? firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase()
      : '';
    result.SECOND_NAME = secondName
      ? secondName.charAt(0).toUpperCase() + secondName.substr(1).toLowerCase()
      : '';
  } else {
    return null;
  }

  if (customer_name) {
    const [parent_lastName, parent_firstName, parent_secondName] =
      customer_name.split(' ');
    result.PARENT_LAST_NAME = parent_lastName;
    result.PARENT_NAME = parent_firstName;
    result.PARENT_SECOND_NAME = parent_secondName;
    result.UF_PARENT_STUDENT_NAME = fullname;
  }

  return result;
};

const formatCFreshUser = (data = {}) => {
  if (utils.isEmpty(data)) return false;

  const {
    employee_id,
    fullname,
    phone,
    email,
    org_name,
    department_name,
    position_name,
  } = data;

  const result = {
    ACTIVE: 'Y',
    LOGIN: phone,
    PHONE_NUMBER: phone,
    EMAIL: email,
    WORK_COMPANY: org_name,
    WORK_DEPARTMENT: department_name,
    WORK_POSITION: position_name,
    UF_PHONE: phone,
    UF_GUID: employee_id,
  };

  if (fullname) {
    const [lastName, firstName, secondName] = fullname.split(' ');
    result.LAST_NAME = lastName
      ? lastName.charAt(0).toUpperCase() + lastName.substr(1).toLowerCase()
      : '';
    result.NAME = firstName
      ? firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase()
      : '';
    result.SECOND_NAME = secondName
      ? secondName.charAt(0).toUpperCase() + secondName.substr(1).toLowerCase()
      : '';
  } else {
    return null;
  }

  return result;
};

function is_student(user) {
  const statusPeriod = Date.parse(user.period);
  const dateNow = Date.now();
  let toRemove = true;

  if (dateNow - statusPeriod < 2592000000) {
    toRemove = false;
  }

  return (
    (user.status === 'Студент' ||
      user.status === 'ВАкадемическомОтпуске' ||
      (user.status === 'Отчислен' && !toRemove) ||
      (user.status === 'Выпущен' && !toRemove)) &&
    user.phone
  );
}

function parseCustomDate(dateString) {
  // Split the date and time parts
  const [datePart, timePart] = dateString.split(' ');

  // Split the date part into day, month, and year
  const [day, month, year] = datePart.split('.').map(Number);

  // Split the time part into hours, minutes, and seconds
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Create and return a new Date object using the extracted components
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Check if user wasn't active for more than 90 days
 * @date 3/21/2024 - 9:41:26 PM
 *
 * @param {Object} date
 * @returns {boolean}
 */
function forgotToLogin(date, days) {
  const millisecondsInNDays = days * 24 * 60 * 60 * 1000;
  const now = new Date();
  const lastActivity = new Date(date);
  const difference = now - lastActivity;
  return difference > millisecondsInNDays;
}

function is_parent(incomingUser, CUsers) {
  const statusPeriod = Date.parse(incomingUser.period);
  const dateNow = Date.now();
  let toRemove = true;

  if (dateNow - statusPeriod < 2592000000) {
    toRemove = false;
  }

  return (
    ((incomingUser.status === 'Отчислен' && !toRemove) ||
      (incomingUser.status === 'Выпущен' && !toRemove) ||
      incomingUser.status === 'Студент' ||
      incomingUser.status === 'ВАкадемическомОтпуске') &&
    incomingUser.customer_is_org === false &&
    incomingUser.customer_name &&
    incomingUser.customer_phone &&
    incomingUser.phone !== incomingUser.customer_phone &&
    incomingUser.fullname &&
    incomingUser.fullname.toLowerCase() !== incomingUser.customer_name.toLowerCase() &&
    !CUsers.find(
      (CUser) =>
        (CUser.status === 'Студент' || CUser.status === 'ВАкадемическомОтпуске') &&
        CUser.phone === incomingUser.customer_phone,
    )
  );
}

function is_employee(user) {
  return user.status !== 'Увольнение' && user.phone;
}

/**
 * FInd user in db
 * @date 3/8/2024 - 8:27:29 AM
 *
 * @param {Object} incomingUser
 * @param {Array} umedUsers
 * @returns {Object}
 */
const findUmedUser = (incomingUser = {}, umedUsers = []) => {
  // valid student
  const user1 = umedUsers.find(
    (umedUser) =>
      (umedUser.UF_GUID === incomingUser.student_id ||
        umedUser.UF_ID_BITRIX === incomingUser.bitrix_id) &&
      umedUser['GROUPS_ID'].includes(UMED_STUDENT_GROUP_ID),
  );

  //
  const user2 = umedUsers.find(
    (umedUser) =>
      (umedUser.PHONE_NUMBER === incomingUser.phone ||
        umedUser.LOGIN === incomingUser.phone ||
        umedUser.EMAIL === incomingUser.email) &&
      !umedUser['GROUPS_ID'].includes(UMED_STUDENT_GROUP_ID) &&
      !umedUser['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID),
  );

  if (user1?.ID && user2?.ID) {
    console.log(`to delete ${user2.ID} ${user2.LOGIN} ${user2.LAST_NAME}`);
    deleteUser(user2);
  }

  if (user1?.ID) {
    return user1;
  } else if (user2?.ID) {
    return user2;
  } else {
    return null;
  }
};

const findParentUser = (incomingUser, umedUsers) => {
  const findParent = (condition) => umedUsers.find((umedUser) => condition(umedUser));

  return (
    findParent(
      (user) =>
        user.PHONE_NUMBER &&
        incomingUser.customer_phone &&
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user['GROUPS_ID'].includes(UMED_ABITURIENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.EMAIL &&
        incomingUser.customer_email &&
        user.EMAIL === incomingUser.customer_email &&
        user['GROUPS_ID'].includes(UMED_ABITURIENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.PHONE_NUMBER &&
        incomingUser.customer_phone &&
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.EMAIL &&
        incomingUser.customer_email &&
        user.EMAIL === incomingUser.customer_email &&
        user['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.FULL_NAME &&
        incomingUser.customer_name &&
        user.FULL_NAME.toLowerCase() === incomingUser.customer_name.toLowerCase() &&
        user['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.UF_PARENT_ID &&
        incomingUser.UF_PARENT_ID &&
        user.UF_PARENT_ID === incomingUser.UF_PARENT_ID &&
        user['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID),
    ) ||
    {}
  );
};

const deleteUser = async (user) => {
  if (utils.isEmpty(user)) return false;

  if (user?.ID && user.ID !== '1') {
    user.ACTIVE = 'N';
    console.log(`umed: removing user ${user.ID} ${user.LOGIN} ${user.FULL_NAME}`);
    return await postData(user);
  }
};

const disableUser = async (user) => {
  if (utils.isEmpty(user)) return false;

  const paramsData = {
    ID: user['ID'],
    ACTIVE: 'Y',
    GROUP_ID: [5, 8],
    UF_PARENT_STUDENT_ID: null,
    UF_PERSON_ID: null,
  };

  console.log(`umed: disabling user ${user.ID} ${user.LOGIN} ${user.FULL_NAME}`);
  return await putData(paramsData);
};

const messageTemplates = (templateName, data) => {
  const templates = {
    createUser: `Для Вас создана учетная запись в Личном Кабинете UMED. Там вы можете посмотреть своё расписание, зачетную книжку, оценки и многое другое! Для входа пройдите по ссылке https://umedcollege.ru/lk Логин: ${data.PHONE_NUMBER} Пароль: СНИЛС без прочерков и пробелов (11 цифр)`,
    createParent: `Для Вас создана учетная запись в Личном Кабинете UMED. Там вы можете посмотреть расписание, зачетную книжку, оценки своего обучающегося и многое другое! Для входа пройдите по ссылке https://umedcollege.ru/lk Логин: ${data.PHONE_NUMBER} Пароль: СНИЛС без прочерков и пробелов (11 цифр)`,
  };
  return templates[templateName];
};

async function createStudent(incomingUser = {}, umedUsers) {
  if (utils.isEmpty(incomingUser) && utils.isEmpty(incomingUser['LOGIN'])) return false;

  const foundUser = umedUsers.find(
    (umedUser) =>
      umedUser.PHONE_NUMBER === incomingUser.PHONE_NUMBER ||
      umedUser.LOGIN === incomingUser.PHONE_NUMBER,
  );

  const paramsData = {
    ACTIVE: 'Y',
    LOGIN: incomingUser['PHONE_NUMBER'],
    PHONE_NUMBER: incomingUser['PHONE_NUMBER'],
    LAST_NAME: incomingUser['LAST_NAME'],
    NAME: incomingUser['NAME'],
    SECOND_NAME: incomingUser['SECOND_NAME'],
    PASSWORD: incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'],
    CONFIRM_PASSWORD: incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'],
    EMAIL: incomingUser['EMAIL'],
    XML_ID: incomingUser['UF_ID_BITRIX'],
    UF_PERSON_ID: incomingUser['UF_PERSON_ID'],
    UF_SNILS: incomingUser['UF_SNILS'],
    UF_GUID: incomingUser['UF_GUID'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
    GROUP_ID: [5, 9, 13],
  };

  if (foundUser) {
    if (umedUsers.find((umedUser) => umedUser.LOGIN === incomingUser.EMAIL)) {
      paramsData.LOGIN = incomingUser['UF_ID_BITRIX'];
      delete paramsData.PHONE_NUMBER;
    }

    if (incomingUser['EMAIL']) {
      paramsData.LOGIN = incomingUser['EMAIL'];
      delete paramsData.PHONE_NUMBER;
    } else {
      return false;
    }
  }

  if (!paramsData.LOGIN) return false;

  //await utils.delay(100);

  const result = await postData(paramsData);

  if (result) {
    console.log(`create user ${paramsData.LOGIN}`, paramsData);
    if (incomingUser['PHONE_NUMBER']) {
      wazzup.sendMessage({
        phone: incomingUser['PHONE_NUMBER'].replace(/\+/g, ''),
        text: messageTemplates('createUser', {
          PHONE_NUMBER: paramsData.LOGIN,
          PASSWORD: paramsData.PASSWORD,
        }),
      });
    }

    if (incomingUser['EMAIL']) {
      sendEmail(
        incomingUser['EMAIL'],
        'Доступ в Личный кабинет UMED',
        messageTemplates('createUser', {
          PHONE_NUMBER: paramsData.LOGIN,
          PASSWORD: paramsData.PASSWORD,
        }),
      );
    }
    return result;
  }

  return false;
}

async function createParent(incomingUser = {}, umedUsers) {
  if (utils.isEmpty(incomingUser) && utils.isEmpty(incomingUser['UF_PARENT_PHONE']))
    return false;

  const foundUser = umedUsers.find(
    (umedUser) =>
      umedUser.PHONE_NUMBER === incomingUser.UF_PARENT_PHONE ||
      umedUser.LOGIN === incomingUser.UF_PARENT_PHONE,
  );

  const paramsData = {
    ACTIVE: 'Y',
    LOGIN: incomingUser['UF_PARENT_PHONE'],
    PHONE_NUMBER: incomingUser['UF_PARENT_PHONE'],
    LAST_NAME: incomingUser['PARENT_LAST_NAME'],
    NAME: incomingUser['PARENT_NAME'],
    SECOND_NAME: incomingUser['PARENT_SECOND_NAME'],
    PASSWORD: incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'],
    CONFIRM_PASSWORD: incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'],
    EMAIL: incomingUser['UF_PARENT_EMAIL'],
    XML_ID: 'parent' + incomingUser['UF_PARENT_ID'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PARENT_ID: incomingUser['UF_PARENT_ID'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
    UF_PARENT_STUDENT_ID: incomingUser['UF_PERSON_ID'],
    UF_PARENT_STUDENT_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PARENT_STUDENT_NAME: incomingUser['UF_PARENT_STUDENT_NAME'],
    GROUP_ID: [5, 13, 18],
  };

  if (foundUser) {
    if (umedUsers.find((umedUser) => umedUser.LOGIN === incomingUser.UF_PARENT_EMAIL)) {
      console.log(`umed: found double user with login ${incomingUser.LOGIN}`);
      return false;
    }

    if (incomingUser['UF_PARENT_EMAIL']) {
      paramsData.LOGIN = incomingUser['UF_PARENT_EMAIL'];
      delete paramsData.PHONE_NUMBER;
    } else {
      return false;
    }
  }

  if (!paramsData.LOGIN) return false;

  //await utils.delay(100);

  const result = await postData(paramsData);

  if (result) {
    console.log(`umed: create parent ${incomingUser.LOGIN}`, paramsData);
    if (incomingUser['UF_PARENT_PHONE']) {
      wazzup.sendMessage({
        phone: incomingUser['UF_PARENT_PHONE'].replace(/\+/g, ''),
        text: messageTemplates('createParent', {
          PHONE_NUMBER: paramsData.LOGIN,
          PASSWORD: paramsData.PASSWORD,
        }),
      });
    }

    if (incomingUser['UF_PARENT_EMAIL']) {
      sendEmail(
        incomingUser['UF_PARENT_EMAIL'],
        'Доступ в Личный кабинет UMED',
        messageTemplates('createParent', {
          PHONE_NUMBER: paramsData.LOGIN,
          PASSWORD: paramsData.PASSWORD,
        }),
      );
    }
    return result;
  }

  return false;
}

async function updateStudent(incomingUser = {}, umedUsers = []) {
  if (utils.isEmpty(incomingUser) && utils.isEmpty(incomingUser['LOGIN'])) return false;

  const user = umedUsers.find(
    (umedUser) => umedUser.UF_PERSON_ID === incomingUser.UF_PERSON_ID,
  );

  if (!user) {
    return false;
  }

  const paramsData = {
    ID: user['ID'],
    ACTIVE: 'Y',
    LOGIN: incomingUser['PHONE_NUMBER'],
    PHONE_NUMBER: incomingUser['PHONE_NUMBER'],
    LAST_NAME: incomingUser['LAST_NAME'],
    NAME: incomingUser['NAME'],
    SECOND_NAME: incomingUser['SECOND_NAME'],
    EMAIL: incomingUser['EMAIL'],
    XML_ID: incomingUser['UF_ID_BITRIX'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PERSON_ID: incomingUser['UF_PERSON_ID'],
    UF_SNILS: incomingUser['UF_SNILS'],
    UF_GUID: incomingUser['UF_GUID'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
  };

  const userToUpdate = {};
  for (const key in user) {
    if (paramsData[key] && user[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !user['GROUPS_ID'].includes('5') ||
    !user['GROUPS_ID'].includes(UMED_STUDENT_GROUP_ID) ||
    !user['GROUPS_ID'].includes(UMED_CAFE_GROUP_ID)
  ) {
    userToUpdate.GROUP_ID = [5, 9, 13];
    paramsData.GROUP_ID = [5, 9, 13];
  }

  if (!user.LAST_LOGIN && forgotToLogin(parseCustomDate(user.TIMESTAMP_X), 30)) {
    userToUpdate.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.CONFIRM_PASSWORD =
      incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    //await utils.delay(100);

    const result = await putData(paramsData);
    if (result) {
      console.log(`umed: update user ${user.ID} ${user.PHONE_NUMBER}`, userToUpdate);
      return true;
    }
  }

  return false;
}

async function updateParent(incomingUser = {}, umedUsers = []) {
  if (utils.isEmpty(incomingUser) && utils.isEmpty(incomingUser['UF_PARENT_PHONE']))
    return false;

  const parent = umedUsers.find(
    (umedUser) =>
      umedUser.UF_PARENT_STUDENT_ID === incomingUser['UF_PERSON_ID'] &&
      incomingUser['UF_PHONE'] !== incomingUser['UF_PARENT_PHONE'],
  );

  if (!parent) {
    return false;
  }

  const paramsData = {
    ID: parent['ID'],
    ACTIVE: 'Y',
    LOGIN: incomingUser['UF_PARENT_PHONE'],
    PHONE_NUMBER: incomingUser['UF_PARENT_PHONE'],
    LAST_NAME: incomingUser['PARENT_LAST_NAME'],
    NAME: incomingUser['PARENT_NAME'],
    SECOND_NAME: incomingUser['PARENT_SECOND_NAME'],
    EMAIL: incomingUser['UF_PARENT_EMAIL'],
    XML_ID: 'parent' + incomingUser['UF_PARENT_ID'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PARENT_ID: incomingUser['UF_PARENT_ID'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
    UF_PARENT_STUDENT_ID: incomingUser['UF_PERSON_ID'],
    UF_PARENT_STUDENT_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PARENT_STUDENT_NAME: incomingUser['FULL_NAME'],
  };

  const userToUpdate = {};
  for (const key in parent) {
    if (paramsData[key] && parent[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !parent['GROUPS_ID'].includes('5') ||
    !parent['GROUPS_ID'].includes(UMED_CAFE_GROUP_ID) ||
    !parent['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [5, 13, 18];
    userToUpdate.GROUP_ID = [5, 13, 18];
  }

  if (!parent.LAST_LOGIN && forgotToLogin(parseCustomDate(parent.TIMESTAMP_X), 30)) {
    userToUpdate.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.CONFIRM_PASSWORD =
      incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    //await utils.delay(100);

    const result = await putData(paramsData);
    if (result) {
      console.log(
        `umed: update parent ${parent.ID} ${parent.UF_PARENT_PHONE} of user ${incomingUser.UF_PERSON_ID} ${incomingUser.PHONE_NUMBER}`,
        userToUpdate,
      );
      return true;
    }
  }

  return false;
}

async function upgradeToStudent(incomingUser = {}, umedUsers = []) {
  if (utils.isEmpty(incomingUser) && utils.isEmpty(incomingUser['LOGIN'])) return false;

  const user = umedUsers.find(
    (umedUser) => umedUser.PHONE_NUMBER === incomingUser.PHONE_NUMBER,
  );

  if (!user) {
    return false;
  }

  const paramsData = {
    ID: user['ID'],
    ACTIVE: 'Y',
    LOGIN: incomingUser['PHONE_NUMBER'],
    PHONE_NUMBER: incomingUser['PHONE_NUMBER'],
    LAST_NAME: incomingUser['LAST_NAME'],
    NAME: incomingUser['NAME'],
    SECOND_NAME: incomingUser['SECOND_NAME'],
    EMAIL: incomingUser['EMAIL'],
    XML_ID: incomingUser['UF_ID_BITRIX'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PERSON_ID: incomingUser['UF_PERSON_ID'],
    UF_SNILS: incomingUser['UF_SNILS'],
    UF_GUID: incomingUser['UF_GUID'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
  };

  const userToUpdate = {};
  for (const key in user) {
    if (paramsData[key] && user[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !user['GROUPS_ID'].includes('5') ||
    !user['GROUPS_ID'].includes(UMED_STUDENT_GROUP_ID) ||
    !user['GROUPS_ID'].includes(UMED_CAFE_GROUP_ID)
  ) {
    userToUpdate.GROUP_ID = [5, 9, 13];
    paramsData.GROUP_ID = [5, 9, 13];
  }

  if (!user.LAST_LOGIN && forgotToLogin(parseCustomDate(user.TIMESTAMP_X), 30)) {
    userToUpdate.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.CONFIRM_PASSWORD =
      incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    //await utils.delay(100);

    const result = await putData(paramsData);
    if (result) {
      console.log(`umed: update user ${user.ID} ${user.PHONE_NUMBER}`, userToUpdate);
      return true;
    }
  }

  return false;
}

async function upgradeToParent(incomingUser = {}, umedUsers = []) {
  if (utils.isEmpty(incomingUser) && utils.isEmpty(incomingUser['UF_PARENT_PHONE']))
    return false;

  const parent = umedUsers.find(
    (umedUser) => umedUser.PHONE_NUMBER === incomingUser.UF_PARENT_PHONE,
  );

  if (!parent) {
    return false;
  }

  const paramsData = {
    ID: parent['ID'],
    ACTIVE: 'Y',
    LOGIN: incomingUser['UF_PARENT_PHONE'],
    PHONE_NUMBER: incomingUser['UF_PARENT_PHONE'],
    LAST_NAME: incomingUser['PARENT_LAST_NAME'],
    NAME: incomingUser['PARENT_NAME'],
    SECOND_NAME: incomingUser['PARENT_SECOND_NAME'],
    EMAIL: incomingUser['UF_PARENT_EMAIL'],
    XML_ID: 'parent' + incomingUser['UF_PARENT_ID'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PARENT_ID: incomingUser['UF_PARENT_ID'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
    UF_PARENT_STUDENT_ID: incomingUser['UF_PERSON_ID'],
    UF_PARENT_STUDENT_PHONE: incomingUser['PHONE_NUMBER'],
    UF_PARENT_STUDENT_NAME: incomingUser['FULL_NAME'],
  };

  const userToUpdate = {};
  for (const key in parent) {
    if (paramsData[key] && parent[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !parent['GROUPS_ID'].includes('5') ||
    !parent['GROUPS_ID'].includes(UMED_CAFE_GROUP_ID) ||
    !parent['GROUPS_ID'].includes(UMED_PARENT_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [5, 13, 18];
    userToUpdate.GROUP_ID = [5, 13, 18];
  }

  if (!parent.LAST_LOGIN && forgotToLogin(parseCustomDate(parent.TIMESTAMP_X), 30)) {
    userToUpdate.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.PASSWORD = incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
    paramsData.CONFIRM_PASSWORD =
      incomingUser['UF_SNILS'] ?? incomingUser['UF_APP_PASSWORD'];
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    //await utils.delay(100);

    console.log(
      `umed: update parent ${parent.ID} (${parent.LOGIN}) ${parent.UF_PARENT_PHONE} of user ${incomingUser.UF_PERSON_ID} ${incomingUser.PHONE_NUMBER}`,
      userToUpdate,
    );
    /* const result = await putData(paramsData);
    if (result) {
      console.log(
        `umed: update parent ${parent.ID} ${parent.UF_PARENT_PHONE} of user ${incomingUser.UF_PERSON_ID} ${incomingUser.PHONE_NUMBER}`,
        userToUpdate,
      );
      return true;
    } */
  }

  return false;
}

function splitById(arr1, arr2, arr1IdKey, arr2IdKey) {
  const arr2Ids = new Set(arr2.map((obj) => obj[arr2IdKey]));

  const found = [];
  const notFound = [];

  arr1.forEach((obj) => {
    if (arr2Ids.has(obj[arr1IdKey])) {
      found.push(obj);
    } else {
      notFound.push(obj);
    }
  });

  return { found, notFound };
}

/**
 * Sync umed
 * @date 2/24/2024 - 5:41:12 PM
 * @param {Array} CUsers array
 * @async
 */
const syncUmed = async (CUsers = []) => {
  if (utils.isEmpty(CUsers)) return false;
  console.log('syncUmed job started');

  async function getUmedUsers() {
    return formatUUsers(await fetchData()).filter((user) => {
      return (
        user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID) ||
        user.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) ||
        user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID)
      );
    });
  }

  CUsers = Object.groupBy(CUsers, ({ person_id }) => person_id);

  let umedUsers = await getUmedUsers();

  if (utils.isEmpty(umedUsers)) {
    console.error('umedUsers is empty');
    return false;
  }
  await utils.writeToJson('umedUsers.json', umedUsers);

  const CStudents_valid = Object.keys(CUsers)
    .map((id) => {
      const student = CUsers[id].find((user) => {
        const eduEnd = Date.parse(user.period);
        const now = Date.now();
        const isValid = now - eduEnd < 2592000000;

        return (
          (isValid && (user.status === 'Выпущен' || user.status === 'Отчислен')) ||
          user.status === 'Студент' ||
          user.status === 'ВАкадемическомОтпуске'
        );
      });

      return student;
    })
    .filter(Boolean);

  const CStudents_invalid = Object.keys(CUsers)
    .map((id) => {
      const student = CUsers[id].find((user) => {
        const eduEnd = Date.parse(user.period);
        const now = Date.now();
        const isValid = now - eduEnd < 2592000000;

        return (
          (isValid && (user.status === 'Выпущен' || user.status === 'Отчислен')) ||
          user.status === 'Студент' ||
          user.status === 'ВАкадемическомОтпуске'
        );
      });

      if (student) return null;

      return CUsers[id][0];
    })
    .filter(Boolean);

  const CParents_valid = CStudents_valid.filter((parent) => {
    return (
      parent.customer_is_org === false &&
      parent.customer_name &&
      (parent.customer_phone || parent.customer_email) &&
      parent.fullname
    );
  });

  // DELETE STUDENTS
  console.log('Delete users');

  umedUsers = await getUmedUsers();

  const { found: studentsToDelete } = splitById(
    umedUsers,
    CStudents_invalid,
    'UF_PERSON_ID',
    'person_id',
  );

  const { found: parentsToDelete } = splitById(
    umedUsers,
    CStudents_invalid,
    'UF_PARENT_STUDENT_ID',
    'person_id',
  );

  for (const student of studentsToDelete) {
    await disableUser(student);
  }

  for (const parent of parentsToDelete) {
    await disableUser(parent);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO STUDENTS BY PHONE
  console.log('Upgrade students by phone');

  umedUsers = await getUmedUsers();

  let umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToStudentsbyPhone } = splitById(
    CStudents_valid,
    umedAbiturients,
    'phone',
    'PHONE_NUMBER',
  );

  for (const student of abiturientsToStudentsbyPhone) {
    await upgradeToStudent(formatCUser(student), umedAbiturients);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO STUDENTS BY EMAIL
  console.log('Upgrade students by email');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToStudentsbyEmail } = splitById(
    CStudents_valid,
    umedAbiturients,
    'email',
    'EMAIL',
  );

  for (const student of abiturientsToStudentsbyEmail) {
    await upgradeToStudent(formatCUser(student), umedAbiturients);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO PARENTS BY PHONE
  console.log('Upgrade parents by phone');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToParentsbyPhone } = splitById(
    CParents_valid,
    umedAbiturients,
    'customer_phone',
    'PHONE_NUMBER',
  );

  for (const parent of abiturientsToParentsbyPhone) {
    await upgradeToParent(formatCUser(parent), umedAbiturients);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO PARENTS BY EMAIL
  console.log('Upgrade parents by email');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToParentsbyEmail } = splitById(
    CParents_valid,
    umedAbiturients,
    'customer_email',
    'EMAIL',
  );

  for (const parent of abiturientsToParentsbyEmail) {
    await upgradeToParent(formatCUser(parent), umedAbiturients);
  }
  ////

  // CREATE STUDENTS
  console.log('Create students');

  umedUsers = await getUmedUsers();

  umedStudents = umedUsers.filter((user) => {
    return (
      user.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) && user.UF_PERSON_ID && user.UF_GUID
    );
  });

  const { notFound: studentsToCreate } = splitById(
    CStudents_valid,
    umedStudents,
    'person_id',
    'UF_PERSON_ID',
  );

  for (const student of studentsToCreate) {
    await createStudent(formatCUser(student), umedUsers);
  }
  ////

  // CREATE PARENTS
  console.log('Create parents');

  umedUsers = await getUmedUsers();

  umedParents = umedUsers.filter((user) => {
    return (
      user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID) &&
      user.UF_PARENT_STUDENT_ID &&
      user.UF_PARENT_STUDENT_NAME
    );
  });

  const { notFound: parentsToCreate } = splitById(
    CParents_valid,
    umedParents,
    'person_id',
    'UF_PARENT_STUDENT_ID',
  );

  for (const parent of parentsToCreate) {
    await createParent(formatCUser(parent), umedUsers);
  }
  ////

  // UPDATE EXISTING STUDENTS
  console.log('Update students');

  umedUsers = await getUmedUsers();

  umedStudents = umedUsers.filter((user) => {
    return (
      user.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) && user.UF_PERSON_ID && user.UF_GUID
    );
  });

  const { found: studentsToUpdate } = splitById(
    CStudents_valid,
    umedStudents,
    'person_id',
    'UF_PERSON_ID',
  );

  for (const student of studentsToUpdate) {
    await updateStudent(formatCUser(student), umedUsers);
  }
  ////

  // UPDATE EXISTING PARENTS
  console.log('Update parents');

  umedUsers = await getUmedUsers();

  umedParents = umedUsers.filter((user) => {
    return (
      user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID) &&
      user.UF_PARENT_STUDENT_ID &&
      user.UF_PARENT_STUDENT_NAME
    );
  });

  const { found: parentsToUpdate } = splitById(
    CParents_valid,
    umedParents,
    'person_id',
    'UF_PARENT_STUDENT_ID',
  );

  for (const parent of parentsToUpdate) {
    await updateParent(formatCUser(parent), umedUsers);
  }
  ////

  console.log('syncUmed job finished');
};

module.exports = { syncUmed };
