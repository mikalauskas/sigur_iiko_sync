const utils = require('./utils.js');
const sendEmail = require('./emailSender.js');
const wazzup = require('./wazzup.js');
const dotenv = require('dotenv');
dotenv.config();

const dry_run = Number(process.env.DRY_RUN) > 0;

const token = process.env.UMED_TOKEN;

const UMED_USER_GROUP_ID = '5';
const UMED_ABITURIENT_GROUP_ID = '8';
const UMED_STUDENT_GROUP_ID = '9';
const UMED_TEACHER_GROUP_ID = '10';
const UMED_CAFE_GROUP_ID = '13';
const UMED_PARENT_GROUP_ID = '18';

/**
 * fetch data
 *
 * @async
 * @param {*} id
 * @returns {Promise<any[] | boolean>}
 */
const fetchData = async (id = undefined) => {
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
      console.error('umed: get error: ', await response.json());
      return false;
    }
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

const putData = async (data = {}) => {
  if (utils.isEmpty(data)) return false;

  if (dry_run) return true;

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
      console.error('umed: put error: ', await response.json());
      return false;
    }
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

/**
 * post data
 *
 * @async
 * @param {Object} data
 * @returns {Promise<false | Object>}
 */
const postData = async (data) => {
  if (utils.isEmpty(data)) return false;

  if (dry_run) return false;

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
      console.error('umed: post error: ', await response.json());
      return false;
    }
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

const mapUmedUser = (data = []) => {
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
      UF_CONTRACT,
      UF_CONTRACT_DATE,
      UF_SPECIALITY,
      UF_EDU_FORM,
      UF_BIRTHDAY,
      UF_GENDER,
      UF_CITIZENSHIP,
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
      UF_CONTRACT,
      UF_CONTRACT_DATE,
      UF_SPECIALITY,
      UF_EDU_FORM,
      UF_BIRTHDAY,
      UF_GENDER,
      UF_CITIZENSHIP,
      LAST_ACTIVITY_DATE,
      LAST_LOGIN,
      DATE_REGISTER,
      TIMESTAMP_X,
    };
  });
};

const mapUmedTeacher = (data = []) => {
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
      UF_TEACHER,
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
      UF_CONTRACT,
      UF_CONTRACT_DATE,
      UF_SPECIALITY,
      UF_EDU_FORM,
      UF_BIRTHDAY,
      UF_GENDER,
      UF_CITIZENSHIP,
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
      UF_TEACHER,
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
      UF_CONTRACT,
      UF_CONTRACT_DATE,
      UF_SPECIALITY,
      UF_EDU_FORM,
      UF_BIRTHDAY,
      UF_GENDER,
      UF_CITIZENSHIP,
      LAST_ACTIVITY_DATE,
      LAST_LOGIN,
      DATE_REGISTER,
      TIMESTAMP_X,
    };
  });
};

const map1CUser = (data = {}) => {
  if (utils.isEmpty(data)) return false;

  const {
    person_id,
    person_snils,
    student_id,
    bitrix_id,
    fullname,
    lastName,
    firstName,
    middleName,
    otherNames,
    login,
    password,
    phone,
    email,
    group_name,
    customer_name,
    customer_lastName,
    customer_firstName,
    customer_middleName,
    customer_otherNames,
    customer_phone,
    customer_email,
    speciality_name,
    edu_form,
    contract_code,
    contract_date,
    person_birthday,
    person_gender,
    person_citizenship,
  } = data;

  const result = {
    ACTIVE: 'Y',
    LOGIN: phone ? phone : email,
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
    UF_CONTRACT: contract_code,
    UF_SPECIALITY: speciality_name,
    UF_EDU_FORM: edu_form,
    UF_BIRTHDAY: person_birthday,
    UF_GENDER: person_gender,
    UF_CITIZENSHIP: person_citizenship,
  };

  if (contract_date) {
    result.UF_CONTRACT_DATE = utils.convertDate(contract_date);
  }

  if (person_birthday) {
    result.UF_BIRTHDAY = utils.convertDate(person_birthday);
  }

  result.LAST_NAME = lastName;
  result.NAME = firstName;
  result.SECOND_NAME = middleName;
  result.SECOND_NAME = otherNames
    ? `${result.SECOND_NAME} ${otherNames}`
    : result.SECOND_NAME;

  if (customer_name) {
    result.PARENT_LAST_NAME = customer_lastName;
    result.PARENT_NAME = customer_firstName;
    result.PARENT_SECOND_NAME = customer_middleName;
    result.PARENT_SECOND_NAME = customer_otherNames
      ? `${result.PARENT_SECOND_NAME} ${customer_otherNames}`
      : result.PARENT_SECOND_NAME;
    result.UF_PARENT_STUDENT_NAME = fullname;
  }

  return result;
};

const mapSheetsUser = (data = {}) => {
  if (utils.isEmpty(data)) return false;

  const { lastName, firstName, middleName, phone, email, fullname, id } = data;

  return {
    ACTIVE: 'Y',
    LAST_NAME: lastName,
    NAME: firstName,
    SECOND_NAME: middleName,
    LOGIN: phone,
    PHONE_NUMBER: phone,
    EMAIL: email,
    XML_ID: id,
    UF_PHONE: phone,
    UF_TEACHER: fullname,
  };
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

/**
 * string to date
 *
 * @param {string} dateString
 * @returns {null|Date}
 */
const parseCustomDate = (dateString) => {
  if (utils.isEmpty(dateString)) return null;

  // ignore invalid dates
  if (dateString === '0001-01-01T00:00:00') return null;
  // Split the date and time parts
  const [datePart, timePart] = dateString.split(' ');

  // Split the date part into day, month, and year
  const [day, month, year] = datePart.split('.').map(Number);

  // Split the time part into hours, minutes, and seconds
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Create and return a new Date object using the extracted components
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

/**
 * Check if user wasn't active for more than 90 days
 * @date 3/21/2024 - 9:41:26 PM
 *
 * @param {Object} date
 * @returns {boolean}
 */
const forgotToLogin = (date, days) => {
  if (utils.isEmpty(date) || (days && days < 1)) return false;

  const millisecondsInNDays = days * 24 * 60 * 60 * 1000;
  const now = new Date();
  const lastActivity = new Date(date);
  const difference = now - lastActivity;
  return difference > millisecondsInNDays;
};

const is_employee = (user) => {
  return user.status !== 'Увольнение' && user.phone;
};

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
      umedUser.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID),
  );

  //
  const user2 = umedUsers.find(
    (umedUser) =>
      (umedUser.PHONE_NUMBER === incomingUser.phone ||
        umedUser.LOGIN === incomingUser.phone ||
        umedUser.EMAIL === incomingUser.email) &&
      !umedUser.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) &&
      !umedUser.GROUPS_ID.includes(UMED_PARENT_GROUP_ID),
  );

  if (user1?.ID && user2?.ID) {
    console.log(`umed: to delete ${user2.ID} ${user2.LOGIN} ${user2.LAST_NAME}`);
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
        user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.EMAIL &&
        incomingUser.customer_email &&
        user.EMAIL === incomingUser.customer_email &&
        user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.PHONE_NUMBER &&
        incomingUser.customer_phone &&
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.EMAIL &&
        incomingUser.customer_email &&
        user.EMAIL === incomingUser.customer_email &&
        user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.FULL_NAME &&
        incomingUser.customer_name &&
        user.FULL_NAME.toLowerCase() === incomingUser.customer_name.toLowerCase() &&
        user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID),
    ) ||
    findParent(
      (user) =>
        user.UF_PARENT_ID &&
        incomingUser.UF_PARENT_ID &&
        user.UF_PARENT_ID === incomingUser.UF_PARENT_ID &&
        user.GROUPS_ID.includes(UMED_PARENT_GROUP_ID),
    ) ||
    {}
  );
};

const findTeacher = (teacher, umedUsers) => {
  return umedUsers.find(
    (umedUser) =>
      (umedUser.EMAIL === teacher.email && umedUser.UF_TEACHER) ||
      (umedUser.UF_TEACHER === teacher.fullname && umedUser.UF_TEACHER) ||
      (umedUser.LOGIN === teacher.phone && umedUser.UF_TEACHER),
  );
};

/**
 * Deletes user
 *
 * @async
 * @param {Object} user
 * @returns {Promise<*>}
 */
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
    ID: user.ID,
    ACTIVE: 'Y',
    SECOND_NAME: null,
    XML_ID: '',
    GROUP_ID: [UMED_USER_GROUP_ID, UMED_ABITURIENT_GROUP_ID],
    UF_PERSON_ID: null,
    UF_GUID: null,
    UF_SNILS: null,
    UF_PHONE: null,
    UF_PARENT_ID: null,
    UF_PARENT_STUDENT_ID: null,
    UF_PARENT_STUDENT_PHONE: null,
    UF_PARENT_STUDENT_NAME: null,
    UF_ID_BITRIX: null,
    UF_APP_PASSWORD: null,
    UF_COLLEDGE_GROUP: null,
    UF_ID_MOODLE: null,
    UF_ID_MOODLE_GROUP: null,
    UF_CONTRACT: null,
    UF_CONTRACT_DATE: null,
    UF_SPECIALITY: null,
    UF_EDU_FORM: null,
    UF_BIRTHDAY: null,
    UF_GENDER: null,
    UF_CITIZENSHIP: null,
    UF_TEACHER: null,
  };

  console.log(`umed: disabling user ${user.ID} ${user.LOGIN} ${user.FULL_NAME}`);
  return await putData(paramsData);
};

const messageTemplates = (templateName, data) => {
  const templates = {
    createTeacher: `Привет, Преподаватель! ЮМЕД на связи! 
    Для Вас создана учетная запись в Личном Кабинете ЮМЕД, корпоративная почта и 1С Колледж. 
    В личном кабинете можно посмотреть своё расписание, зайти в эл. библиотеку, 
    зайти в образовательный портал (Мудл) и многое другое! 

    Для входа в Личный кабинет ЮМЕД пройдите по ссылке https://umedcollege.ru/lk 
    Логин: ${data.LOGIN} 
    Пароль: ${data.PASSWORD} 

    Для входа в эл. почту пройдите по ссылке https://e.mail.ru 
    Логин: ${data.EMAIL} 
    Пароль: ${data.PASSWORD} 

    Для входа в 1С Колледж заходить без пароля 
    Пользователь: Ваша Фамилия
    `,
    updateTeacher: `Привет, Преподаватель! ЮМЕД на связи! 
    Ваша учетная запись в Личном Кабинете ЮМЕД была изменена. 
    В личном кабинете можно посмотреть своё расписание, зайти в эл. библиотеку, 
    зайти в образовательный портал (Мудл) и многое другое! 

    Для входа в Личный кабинет ЮМЕД пройдите по ссылке https://umedcollege.ru/lk 
    Логин: ${data.LOGIN} 
    Пароль: ${data.PASSWORD} 
    `,
    createUser: `Привет, Студент! 
    Для Вас создана учетная запись в Личном Кабинете ЮМЕД. 
    Там Вы можете посмотреть своё расписание, зачетную книжку, оценки и многое другое! 
    Учебная группа: ${data.UF_COLLEDGE_GROUP}. 
    Для входа пройдите по ссылке https://umedcollege.ru/lk 
    Логин: ${data.LOGIN} 
    Пароль: ${data.PASSWORD ? data.PASSWORD : 'СНИЛС без прочерков и пробелов (11 цифр)'}`,
    createParent: `Привет, Представитель студента! 
    Для Вас создана учетная запись в Личном Кабинете ЮМЕД. 
    Там Вы можете посмотреть расписание, зачетную книжку, оценки студента и многое другое! 
    Учебная группа: ${data.UF_COLLEDGE_GROUP}. 
    Для входа пройдите по ссылке https://umedcollege.ru/lk 
    Логин: ${data.LOGIN} 
    Пароль: ${data.PASSWORD ? data.PASSWORD : 'СНИЛС студента без прочерков и пробелов (11 цифр)'}`,
    updateUser: `Привет, Студент! 
    Ваша учетная запись в Личном Кабинете ЮМЕД была изменена. 
    Учебная группа: ${data.UF_COLLEDGE_GROUP}. 
    Для входа пройдите по ссылке https://umedcollege.ru/lk 
    Логин: ${data.LOGIN} 
    Пароль: ${data.PASSWORD ? data.PASSWORD : 'СНИЛС без прочерков и пробелов (11 цифр)'}`,
    updateParent: `Привет, Представитель студента! 
    Ваша учетная запись в Личном Кабинете ЮМЕД была изменена. 
    Учебная группа: ${data.UF_COLLEDGE_GROUP}. 
    Для входа пройдите по ссылке https://umedcollege.ru/lk 
    Логин: ${data.LOGIN} 
    Пароль: ${data.PASSWORD ? data.PASSWORD : 'СНИЛС студента без прочерков и пробелов (11 цифр)'}`,
  };
  return templates[templateName];
};

const createTeacher = async (incomingUser = {}, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  if (
    umedUsers.find(
      (umedUser) =>
        umedUser.UF_TEACHER === incomingUser.fullname ||
        umedUser.LOGIN === incomingUser.phone ||
        umedUser.PHONE_NUMBER === incomingUser.phone ||
        umedUser.UF_PHONE === incomingUser.phone,
    )
  )
    return false;

  const paramsData = {
    ACTIVE: 'Y',
    LOGIN: incomingUser.phone,
    PHONE_NUMBER: incomingUser.phone,
    LAST_NAME: incomingUser.lastName,
    NAME: incomingUser.firstName,
    SECOND_NAME: incomingUser.middleName,
    PASSWORD: incomingUser.password,
    CONFIRM_PASSWORD: incomingUser.password,
    EMAIL: incomingUser.email,
    XML_ID: incomingUser.id,
    UF_TEACHER: incomingUser.fullname,
    UF_PHONE: incomingUser.phone,
    GROUP_ID: [UMED_USER_GROUP_ID, UMED_TEACHER_GROUP_ID, UMED_CAFE_GROUP_ID],
  };

  const result = await postData(paramsData);
  console.log(`umed: create teacher ${paramsData.LOGIN}`, paramsData);

  if (result) {
    console.log(`umed: create teacher success`);

    if (incomingUser?.phone) {
      await wazzup.sendMessage({
        phone: incomingUser.phone.replace(/\+/g, ''),
        text: messageTemplates('createTeacher', {
          LOGIN: incomingUser.phone,
          PASSWORD: incomingUser.password,
          EMAIL: incomingUser.email,
        }),
      });
    }

    if (incomingUser?.email) {
      await sendEmail(
        incomingUser.email,
        'Доступ в Личный кабинет ЮМЕД',
        messageTemplates('createTeacher', {
          LOGIN: incomingUser.phone,
          PASSWORD: incomingUser.password,
          EMAIL: incomingUser.email,
        }),
      );
    }
    return result;
  }

  return false;
};

const updateTeacher = async (incomingUser, teacher) => {
  if (utils.isEmpty(incomingUser)) return false;

  const paramsData = {
    ID: teacher.ID,
    ACTIVE: 'Y',
    LOGIN: incomingUser.phone,
    PHONE_NUMBER: incomingUser.phone,
    LAST_NAME: incomingUser.lastName,
    NAME: incomingUser.firstName,
    SECOND_NAME: incomingUser.middleName,
    EMAIL: incomingUser.email,
    XML_ID: incomingUser.id,
    UF_TEACHER: incomingUser.fullname,
    UF_PHONE: incomingUser.phone,
  };

  const userToUpdate = {};
  for (const key in teacher) {
    if (paramsData[key] && teacher[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !teacher.GROUPS_ID.includes(UMED_USER_GROUP_ID) ||
    !teacher.GROUPS_ID.includes(UMED_TEACHER_GROUP_ID) ||
    !teacher.GROUPS_ID.includes(UMED_CAFE_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [UMED_USER_GROUP_ID, UMED_TEACHER_GROUP_ID, UMED_CAFE_GROUP_ID];
    userToUpdate.GROUP_ID = paramsData.GROUP_ID;
  }

  if (
    forgotToLogin(parseCustomDate(teacher.LAST_LOGIN), 60) &&
    forgotToLogin(parseCustomDate(teacher.TIMESTAMP_X), 65)
  ) {
    paramsData.PASSWORD = incomingUser.password;
    paramsData.CONFIRM_PASSWORD = paramsData.PASSWORD;
    userToUpdate.PASSWORD = paramsData.PASSWORD;
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    const result = await putData(paramsData);
    if (result) {
      console.log(`umed: update teacher ${teacher.ID} ${teacher.LOGIN}`, userToUpdate);

      if (
        forgotToLogin(parseCustomDate(teacher.LAST_LOGIN), 60) &&
        forgotToLogin(parseCustomDate(teacher.TIMESTAMP_X), 65)
      ) {
        if (incomingUser?.phone) {
          await wazzup.sendMessage({
            phone: incomingUser.phone.replace(/\+/g, ''),
            text: messageTemplates('updateTeacher', {
              LOGIN: paramsData.LOGIN,
              PASSWORD: paramsData.PASSWORD,
            }),
          });
        }

        if (incomingUser?.email) {
          await sendEmail(
            incomingUser.email,
            'Доступ в Личный кабинет ЮМЕД',
            messageTemplates('updateUser', {
              LOGIN: paramsData.LOGIN,
              PASSWORD: paramsData.PASSWORD,
            }),
          );
        }
      }

      return true;
    }
  }

  return false;
};

const createStudent = async (incomingUser = {}, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  if (umedUsers.find((umedUser) => umedUser.UF_GUID === incomingUser.UF_GUID))
    return false;

  const paramsData = {
    ACTIVE: 'Y',
    LOGIN: incomingUser.PHONE_NUMBER ? incomingUser.PHONE_NUMBER : incomingUser.EMAIL,
    PHONE_NUMBER: incomingUser.PHONE_NUMBER,
    LAST_NAME: incomingUser.LAST_NAME,
    NAME: incomingUser.NAME,
    SECOND_NAME: incomingUser.SECOND_NAME,
    PASSWORD: incomingUser.UF_SNILS
      ? incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD,
    CONFIRM_PASSWORD: incomingUser.UF_SNILS
      ? incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD,
    EMAIL: incomingUser.EMAIL,
    XML_ID: incomingUser.UF_ID_BITRIX,
    UF_PERSON_ID: incomingUser.UF_PERSON_ID,
    UF_SNILS: incomingUser.UF_SNILS,
    UF_GUID: incomingUser.UF_GUID,
    UF_PHONE: incomingUser.PHONE_NUMBER,
    UF_ID_BITRIX: incomingUser.UF_ID_BITRIX,
    UF_APP_PASSWORD: incomingUser.UF_APP_PASSWORD,
    UF_COLLEDGE_GROUP: incomingUser.UF_COLLEDGE_GROUP,
    UF_CONTRACT: incomingUser.UF_CONTRACT,
    UF_CONTRACT_DATE: incomingUser.UF_CONTRACT_DATE,
    UF_SPECIALITY: incomingUser.UF_SPECIALITY,
    UF_EDU_FORM: incomingUser.UF_EDU_FORM,
    UF_BIRTHDAY: incomingUser.UF_BIRTHDAY,
    UF_GENDER: incomingUser.UF_GENDER,
    UF_CITIZENSHIP: incomingUser.UF_CITIZENSHIP,
    GROUP_ID: [UMED_USER_GROUP_ID, UMED_STUDENT_GROUP_ID, UMED_CAFE_GROUP_ID],
  };

  const phoneExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.PHONE_NUMBER &&
      (umedUser.PHONE_NUMBER === incomingUser.PHONE_NUMBER ||
        umedUser.LOGIN === incomingUser.PHONE_NUMBER),
  );

  const emailExist = umedUsers.find(
    (umedUser) => incomingUser?.EMAIL && umedUser.LOGIN === incomingUser.EMAIL,
  );

  if (phoneExist && !emailExist) {
    paramsData.LOGIN = incomingUser?.EMAIL ? incomingUser?.EMAIL : incomingUser.UF_SNILS;
    delete paramsData.PHONE_NUMBER;
  }

  if (emailExist && phoneExist) {
    paramsData.LOGIN = incomingUser.UF_SNILS;

    delete paramsData.PHONE_NUMBER;
  }

  if (!paramsData?.LOGIN) {
    paramsData.LOGIN = incomingUser?.UF_SNILS
      ? incomingUser?.UF_SNILS
      : incomingUser?.UF_ID_BITRIX;
    delete paramsData.PHONE_NUMBER;
  }

  if (!paramsData.LOGIN) return false;

  utils.removeNullUndefinedProps(paramsData);

  const result = await postData(paramsData);
  console.log(`umed: create student ${paramsData.LOGIN}`, paramsData);

  if (result) {
    console.log(`umed: create student success`);

    if (incomingUser?.PHONE_NUMBER) {
      await wazzup.sendMessage(
        {
          phone: incomingUser.PHONE_NUMBER.replace(/\+/g, ''),
          text: messageTemplates('createUser', {
            LOGIN: paramsData.LOGIN,
            PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
            UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
          }),
        },
        true,
      );
    }

    if (incomingUser?.EMAIL) {
      await sendEmail(
        incomingUser.EMAIL,
        'Доступ в Личный кабинет ЮМЕД',
        messageTemplates('createUser', {
          LOGIN: paramsData.LOGIN,
          PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
          UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
        }),
      );
    }
    return result;
  }

  return false;
};

const createParent = async (incomingUser = {}, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  if (
    umedUsers.find((umedUser) => umedUser.UF_PARENT_STUDENT_ID === incomingUser.UF_GUID)
  ) {
    return false;
  }

  const paramsData = {
    ACTIVE: 'Y',
    LOGIN: incomingUser.UF_PARENT_PHONE
      ? incomingUser.UF_PARENT_PHONE
      : incomingUser.UF_PARENT_EMAIL,
    PHONE_NUMBER: incomingUser.UF_PARENT_PHONE,
    LAST_NAME: incomingUser.PARENT_LAST_NAME,
    NAME: incomingUser.PARENT_NAME,
    SECOND_NAME: incomingUser.PARENT_SECOND_NAME,
    PASSWORD: incomingUser.UF_SNILS
      ? incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD,
    CONFIRM_PASSWORD: incomingUser.UF_SNILS
      ? incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD,
    EMAIL: incomingUser.UF_PARENT_EMAIL,
    XML_ID: 'parent' + incomingUser.UF_PARENT_ID,
    UF_PHONE: incomingUser.PHONE_NUMBER,
    UF_PARENT_ID: incomingUser.UF_PARENT_ID,
    UF_ID_BITRIX: incomingUser.UF_ID_BITRIX,
    UF_APP_PASSWORD: incomingUser.UF_APP_PASSWORD,
    UF_COLLEDGE_GROUP: incomingUser.UF_COLLEDGE_GROUP,
    UF_CONTRACT: incomingUser.UF_CONTRACT,
    UF_CONTRACT_DATE: incomingUser.UF_CONTRACT_DATE,
    UF_SPECIALITY: incomingUser.UF_SPECIALITY,
    UF_EDU_FORM: incomingUser.UF_EDU_FORM,
    UF_BIRTHDAY: incomingUser.UF_BIRTHDAY,
    UF_PARENT_STUDENT_ID: incomingUser.UF_GUID,
    UF_PARENT_STUDENT_PHONE: incomingUser.PHONE_NUMBER,
    UF_PARENT_STUDENT_NAME: incomingUser.UF_PARENT_STUDENT_NAME,
    GROUP_ID: [UMED_USER_GROUP_ID, UMED_CAFE_GROUP_ID, UMED_PARENT_GROUP_ID],
  };

  const phoneExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.UF_PARENT_PHONE &&
      (umedUser.LOGIN === incomingUser.UF_PARENT_PHONE ||
        umedUser.PHONE_NUMBER === incomingUser.UF_PARENT_PHONE),
  );

  const emailExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.UF_PARENT_EMAIL && umedUser.LOGIN === incomingUser.UF_PARENT_EMAIL,
  );

  if (phoneExist && !emailExist) {
    paramsData.LOGIN = incomingUser?.UF_PARENT_EMAIL
      ? incomingUser?.UF_PARENT_EMAIL
      : incomingUser.UF_SNILS
        ? '0' + incomingUser.UF_SNILS
        : incomingUser.UF_APP_PASSWORD;
    delete paramsData.PHONE_NUMBER;
  }

  if (emailExist && phoneExist) {
    paramsData.LOGIN = incomingUser.UF_SNILS
      ? '0' + incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD;

    delete paramsData.PHONE_NUMBER;
  }

  if (!paramsData?.LOGIN) {
    paramsData.LOGIN = incomingUser?.UF_ID_BITRIX ? incomingUser?.UF_ID_BITRIX : null;
    delete paramsData.PHONE_NUMBER;
  }

  if (!paramsData.LOGIN) return false;

  utils.removeNullUndefinedProps(paramsData);

  console.log(`umed: create parent ${paramsData.LOGIN}`, paramsData);
  const result = await postData(paramsData);

  if (result) {
    console.log(`umed: create parent success`);

    if (incomingUser?.UF_PARENT_PHONE) {
      await wazzup.sendMessage(
        {
          phone: incomingUser.UF_PARENT_PHONE.replace(/\+/g, ''),
          text: messageTemplates('createParent', {
            LOGIN: paramsData.LOGIN,
            PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
            UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
          }),
        },
        true,
      );
    }

    if (incomingUser?.UF_PARENT_EMAIL) {
      await sendEmail(
        incomingUser.UF_PARENT_EMAIL,
        'Доступ в Личный кабинет ЮМЕД',
        messageTemplates('createParent', {
          LOGIN: paramsData.LOGIN,
          PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
          UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
        }),
      );
    }
    return result;
  }

  return false;
};

/**
 * Update student
 *
 * @async
 * @param {Object} incomingUser
 * @param {Object[]} umedUsers
 * @returns {Promise<boolean>}
 */
const updateStudent = async (incomingUser, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  const student = umedUsers.find((umedUser) => umedUser.UF_GUID === incomingUser.UF_GUID);

  if (!student) {
    return false;
  }

  const paramsData = {
    ID: student.ID,
    ACTIVE: 'Y',
    LOGIN: incomingUser.PHONE_NUMBER ? incomingUser.PHONE_NUMBER : incomingUser.EMAIL,
    PHONE_NUMBER: incomingUser.PHONE_NUMBER,
    LAST_NAME: incomingUser.LAST_NAME,
    NAME: incomingUser.NAME,
    SECOND_NAME: incomingUser.SECOND_NAME,
    EMAIL: incomingUser.EMAIL,
    XML_ID: incomingUser.UF_ID_BITRIX,
    UF_PHONE: incomingUser.PHONE_NUMBER,
    UF_PERSON_ID: incomingUser.UF_PERSON_ID,
    UF_SNILS: incomingUser.UF_SNILS,
    UF_GUID: incomingUser.UF_GUID,
    UF_ID_BITRIX: incomingUser.UF_ID_BITRIX,
    UF_APP_PASSWORD: incomingUser.UF_APP_PASSWORD,
    UF_COLLEDGE_GROUP: incomingUser.UF_COLLEDGE_GROUP,
    UF_CONTRACT: incomingUser.UF_CONTRACT,
    UF_CONTRACT_DATE: incomingUser.UF_CONTRACT_DATE,
    UF_SPECIALITY: incomingUser.UF_SPECIALITY,
    UF_EDU_FORM: incomingUser.UF_EDU_FORM,
    UF_BIRTHDAY: incomingUser.UF_BIRTHDAY,
    UF_GENDER: incomingUser.UF_GENDER,
    UF_CITIZENSHIP: incomingUser.UF_CITIZENSHIP,
  };

  const phoneExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.PHONE_NUMBER &&
      (umedUser.LOGIN === incomingUser.PHONE_NUMBER ||
        umedUser.PHONE_NUMBER === incomingUser.PHONE_NUMBER) &&
      umedUser.ID !== student.ID,
  );

  const emailExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.EMAIL &&
      umedUser.LOGIN === incomingUser.EMAIL &&
      umedUser.ID !== student.ID,
  );

  if (phoneExist && !emailExist) {
    paramsData.LOGIN = incomingUser?.EMAIL ? incomingUser?.EMAIL : incomingUser.UF_SNILS;
    delete paramsData.PHONE_NUMBER;
  }

  if (emailExist && phoneExist) {
    paramsData.LOGIN = incomingUser.UF_SNILS;

    delete paramsData.PHONE_NUMBER;
  }

  // student created an account with his valid phone and now we need
  // delete his created account and update this account
  if (phoneExist?.GROUPS_ID?.includes(UMED_ABITURIENT_GROUP_ID)) {
    await deleteUser(phoneExist);
    umedUsers = await getUmedUsers();
    await updateStudent(incomingUser, umedUsers);
    return true;
  }

  /* if (emailExist?.GROUPS_ID?.includes(UMED_ABITURIENT_GROUP_ID)) {
    await upgradeToStudent(incomingUser, umedUsers);
    return true;
  } */

  const userToUpdate = {};
  for (const key in student) {
    if (paramsData[key] && student[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !student.GROUPS_ID.includes(UMED_USER_GROUP_ID) ||
    !student.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) ||
    !student.GROUPS_ID.includes(UMED_CAFE_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [UMED_USER_GROUP_ID, UMED_STUDENT_GROUP_ID, UMED_CAFE_GROUP_ID];
    userToUpdate.GROUP_ID = paramsData.GROUP_ID;
  }

  if (
    forgotToLogin(parseCustomDate(student.LAST_LOGIN), 60) &&
    forgotToLogin(parseCustomDate(student.TIMESTAMP_X), 65)
  ) {
    paramsData.PASSWORD = incomingUser.UF_SNILS
      ? incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD;
    paramsData.CONFIRM_PASSWORD = paramsData.PASSWORD;
    userToUpdate.PASSWORD = paramsData.PASSWORD;
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    const result = await putData(paramsData);
    if (result) {
      console.log(`umed: update student ${student.ID} ${student.LOGIN}`, userToUpdate);

      if (
        forgotToLogin(parseCustomDate(student.LAST_LOGIN), 60) &&
        forgotToLogin(parseCustomDate(student.TIMESTAMP_X), 65)
      ) {
        if (incomingUser?.PHONE_NUMBER) {
          await wazzup.sendMessage({
            phone: incomingUser.PHONE_NUMBER.replace(/\+/g, ''),
            text: messageTemplates('updateUser', {
              LOGIN: paramsData.LOGIN,
              PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
              UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
            }),
          });
        }

        if (incomingUser?.EMAIL) {
          await sendEmail(
            incomingUser.EMAIL,
            'Доступ в Личный кабинет ЮМЕД',
            messageTemplates('updateUser', {
              LOGIN: paramsData.LOGIN,
              PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
              UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
            }),
          );
        }
      }

      return true;
    }
  }

  return false;
};

/**
 * Update parent
 *
 * @async
 * @param {Object} incomingUser
 * @param {Object[]} umedUsers
 * @returns {Promise<boolean>}
 */
const updateParent = async (incomingUser, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  const parent = umedUsers.find(
    (umedUser) => umedUser.UF_PARENT_STUDENT_ID === incomingUser.UF_GUID,
  );

  if (!parent) {
    return false;
  }

  const paramsData = {
    ID: parent.ID,
    ACTIVE: 'Y',
    LOGIN: incomingUser.UF_PARENT_PHONE
      ? incomingUser.UF_PARENT_PHONE
      : incomingUser.UF_PARENT_EMAIL,
    PHONE_NUMBER: incomingUser.UF_PARENT_PHONE,
    LAST_NAME: incomingUser.PARENT_LAST_NAME,
    NAME: incomingUser.PARENT_NAME,
    SECOND_NAME: incomingUser.PARENT_SECOND_NAME,
    EMAIL: incomingUser.UF_PARENT_EMAIL,
    XML_ID: 'parent' + incomingUser.UF_PARENT_ID,
    UF_PHONE: incomingUser.PHONE_NUMBER,
    UF_PARENT_ID: incomingUser.UF_PARENT_ID,
    UF_ID_BITRIX: incomingUser.UF_ID_BITRIX,
    UF_APP_PASSWORD: incomingUser.UF_APP_PASSWORD,
    UF_COLLEDGE_GROUP: incomingUser.UF_COLLEDGE_GROUP,
    UF_CONTRACT: incomingUser.UF_CONTRACT,
    UF_CONTRACT_DATE: incomingUser.UF_CONTRACT_DATE,
    UF_SPECIALITY: incomingUser.UF_SPECIALITY,
    UF_EDU_FORM: incomingUser.UF_EDU_FORM,
    UF_BIRTHDAY: incomingUser.UF_BIRTHDAY,
    UF_PARENT_STUDENT_ID: incomingUser.UF_GUID,
    UF_PARENT_STUDENT_PHONE: incomingUser.PHONE_NUMBER,
    UF_PARENT_STUDENT_NAME: incomingUser.UF_PARENT_STUDENT_NAME,
  };

  const phoneExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.UF_PARENT_PHONE &&
      (umedUser.LOGIN === incomingUser.UF_PARENT_PHONE ||
        umedUser.PHONE_NUMBER === incomingUser.UF_PARENT_PHONE) &&
      umedUser.ID !== parent.ID,
  );

  const emailExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.UF_PARENT_EMAIL &&
      umedUser.LOGIN === incomingUser.UF_PARENT_EMAIL &&
      umedUser.ID !== parent.ID,
  );

  if (phoneExist && !emailExist) {
    paramsData.LOGIN = incomingUser?.UF_PARENT_EMAIL
      ? incomingUser?.UF_PARENT_EMAIL
      : incomingUser.UF_SNILS
        ? '0' + incomingUser.UF_SNILS
        : incomingUser.UF_APP_PASSWORD;
    delete paramsData.PHONE_NUMBER;
  }

  if (emailExist && phoneExist) {
    paramsData.LOGIN = incomingUser.UF_SNILS
      ? '0' + incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD;

    delete paramsData.PHONE_NUMBER;
  }

  if (phoneExist?.GROUPS_ID?.includes(UMED_ABITURIENT_GROUP_ID)) {
    await deleteUser(phoneExist);
    umedUsers = await getUmedUsers();
    await updateParent(incomingUser, umedUsers);
    return true;
  }

  /* if (emailExist?.GROUPS_ID?.includes(UMED_ABITURIENT_GROUP_ID)) {
    await upgradeToParent(incomingUser, umedUsers);
    return true;
  } */

  const userToUpdate = {};
  for (const key in parent) {
    if (paramsData[key] && parent[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !parent.GROUPS_ID.includes(UMED_USER_GROUP_ID) ||
    !parent.GROUPS_ID.includes(UMED_CAFE_GROUP_ID) ||
    !parent.GROUPS_ID.includes(UMED_PARENT_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [UMED_USER_GROUP_ID, UMED_CAFE_GROUP_ID, UMED_PARENT_GROUP_ID];
    userToUpdate.GROUP_ID = paramsData.GROUP_ID;
  }

  if (
    forgotToLogin(parseCustomDate(parent.LAST_LOGIN), 60) &&
    forgotToLogin(parseCustomDate(parent.TIMESTAMP_X), 65)
  ) {
    paramsData.PASSWORD = incomingUser.UF_SNILS
      ? incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD;
    paramsData.CONFIRM_PASSWORD = paramsData.PASSWORD;
    userToUpdate.PASSWORD = paramsData.PASSWORD;
  }

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    const result = await putData(paramsData);
    if (result) {
      console.log(
        `umed: update parent ${parent.ID} ${parent.LOGIN} of user ${incomingUser.UF_PERSON_ID}`,
        userToUpdate,
      );

      if (
        forgotToLogin(parseCustomDate(parent.LAST_LOGIN), 60) &&
        forgotToLogin(parseCustomDate(parent.TIMESTAMP_X), 65)
      ) {
        if (incomingUser?.UF_PARENT_PHONE) {
          await wazzup.sendMessage({
            phone: incomingUser.UF_PARENT_PHONE.replace(/\+/g, ''),
            text: messageTemplates('updateParent', {
              LOGIN: paramsData.LOGIN,
              PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
              UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
            }),
          });
        }

        if (incomingUser?.UF_PARENT_EMAIL) {
          await sendEmail(
            incomingUser.UF_PARENT_EMAIL,
            'Доступ в Личный кабинет ЮМЕД',
            messageTemplates('updateParent', {
              LOGIN: paramsData.LOGIN,
              PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
              UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
            }),
          );
        }
      }
      return true;
    }
  }

  return false;
};

/**
 * Upgrade from abiturient to student
 *
 * @async
 * @param {Object} incomingUser
 * @param {Object[]} umedUsers
 * @returns {Promise<boolean>}
 */
const upgradeToStudent = async (incomingUser, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  const student = umedUsers.find(
    (umedUser) =>
      (umedUser.LOGIN === incomingUser?.PHONE_NUMBER ||
        umedUser.LOGIN === incomingUser?.EMAIL) &&
      umedUser.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID),
  );

  if (!student) {
    return false;
  }

  const paramsData = {
    ID: student.ID,
    ACTIVE: 'Y',
    LOGIN: incomingUser.PHONE_NUMBER ? incomingUser.PHONE_NUMBER : incomingUser.EMAIL,
    PHONE_NUMBER: incomingUser.PHONE_NUMBER,
    LAST_NAME: incomingUser.LAST_NAME,
    NAME: incomingUser.NAME,
    SECOND_NAME: incomingUser.SECOND_NAME,
    EMAIL: incomingUser.EMAIL,
    XML_ID: incomingUser.UF_ID_BITRIX,
    UF_PHONE: incomingUser.PHONE_NUMBER,
    UF_PERSON_ID: incomingUser.UF_PERSON_ID,
    UF_SNILS: incomingUser.UF_SNILS,
    UF_GUID: incomingUser.UF_GUID,
    UF_ID_BITRIX: incomingUser.UF_ID_BITRIX,
    UF_APP_PASSWORD: incomingUser.UF_APP_PASSWORD,
    UF_COLLEDGE_GROUP: incomingUser.UF_COLLEDGE_GROUP,
    UF_CONTRACT: incomingUser.UF_CONTRACT,
    UF_CONTRACT_DATE: incomingUser.UF_CONTRACT_DATE,
    UF_SPECIALITY: incomingUser.UF_SPECIALITY,
    UF_EDU_FORM: incomingUser.UF_EDU_FORM,
    UF_BIRTHDAY: incomingUser.UF_BIRTHDAY,
    UF_GENDER: incomingUser.UF_GENDER,
    UF_CITIZENSHIP: incomingUser.UF_CITIZENSHIP,
  };

  const phoneExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.PHONE_NUMBER &&
      (umedUser.PHONE_NUMBER === incomingUser.PHONE_NUMBER ||
        umedUser.LOGIN === incomingUser.PHONE_NUMBER) &&
      umedUser.ID !== student.ID,
  );

  const emailExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.EMAIL &&
      umedUser.LOGIN === incomingUser.EMAIL &&
      umedUser.ID !== student.ID,
  );

  if (phoneExist && !emailExist) {
    paramsData.LOGIN = incomingUser?.EMAIL ? incomingUser?.EMAIL : incomingUser.UF_SNILS;
    delete paramsData.PHONE_NUMBER;
  }

  if (emailExist && phoneExist) {
    paramsData.LOGIN = incomingUser.UF_SNILS;

    delete paramsData.PHONE_NUMBER;
  }

  const userToUpdate = {};
  for (const key in student) {
    if (paramsData[key] && student[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !student.GROUPS_ID.includes(UMED_USER_GROUP_ID) ||
    !student.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) ||
    !student.GROUPS_ID.includes(UMED_CAFE_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [UMED_USER_GROUP_ID, UMED_STUDENT_GROUP_ID, UMED_CAFE_GROUP_ID];
    userToUpdate.GROUP_ID = paramsData.GROUP_ID;
  }

  paramsData.PASSWORD = incomingUser.UF_SNILS
    ? incomingUser.UF_SNILS
    : incomingUser.UF_APP_PASSWORD;
  paramsData.CONFIRM_PASSWORD = paramsData.PASSWORD;
  userToUpdate.PASSWORD = paramsData.PASSWORD;

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    const result = await putData(paramsData);
    if (result) {
      console.log(`umed: upgrade user ${student.ID} ${student.LOGIN}`, userToUpdate);

      if (incomingUser?.PHONE_NUMBER) {
        await wazzup.sendMessage({
          phone: incomingUser.PHONE_NUMBER.replace(/\+/g, ''),
          text: messageTemplates('updateUser', {
            LOGIN: paramsData.LOGIN,
            PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
            UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
          }),
        });
      }

      if (incomingUser?.EMAIL) {
        await sendEmail(
          incomingUser.EMAIL,
          'Доступ в Личный кабинет ЮМЕД',
          messageTemplates('updateUser', {
            LOGIN: paramsData.LOGIN,
            PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
            UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
          }),
        );
      }

      return true;
    }
  }

  return false;
};

/**
 * Upgrade from abiturient to parent
 *
 * @async
 * @param {Object} incomingUser
 * @param {Object[]} umedUsers
 * @returns {Promise<boolean>}
 */
const upgradeToParent = async (incomingUser, umedUsers) => {
  if (utils.isEmpty(incomingUser)) return false;

  const parent = umedUsers.find(
    (umedUser) =>
      ((umedUser.LOGIN === incomingUser?.UF_PARENT_PHONE &&
        incomingUser?.UF_PARENT_PHONE !== incomingUser?.LOGIN) ||
        umedUser.LOGIN === incomingUser?.UF_PARENT_EMAIL) &&
      umedUser.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID),
  );

  if (!parent) {
    return false;
  }

  const paramsData = {
    ID: parent.ID,
    ACTIVE: 'Y',
    LOGIN: incomingUser.UF_PARENT_PHONE
      ? incomingUser.UF_PARENT_PHONE
      : incomingUser.UF_PARENT_EMAIL,
    PHONE_NUMBER: incomingUser.UF_PARENT_PHONE,
    LAST_NAME: incomingUser.PARENT_LAST_NAME,
    NAME: incomingUser.PARENT_NAME,
    SECOND_NAME: incomingUser.PARENT_SECOND_NAME,
    EMAIL: incomingUser.UF_PARENT_EMAIL,
    XML_ID: 'parent' + incomingUser.UF_PARENT_ID,
    UF_PHONE: incomingUser.PHONE_NUMBER,
    UF_PARENT_ID: incomingUser.UF_PARENT_ID,
    UF_ID_BITRIX: incomingUser.UF_ID_BITRIX,
    UF_APP_PASSWORD: incomingUser.UF_APP_PASSWORD,
    UF_COLLEDGE_GROUP: incomingUser.UF_COLLEDGE_GROUP,
    UF_CONTRACT: incomingUser.UF_CONTRACT,
    UF_CONTRACT_DATE: incomingUser.UF_CONTRACT_DATE,
    UF_SPECIALITY: incomingUser.UF_SPECIALITY,
    UF_EDU_FORM: incomingUser.UF_EDU_FORM,
    UF_BIRTHDAY: incomingUser.UF_BIRTHDAY,
    UF_PARENT_STUDENT_ID: incomingUser.UF_GUID,
    UF_PARENT_STUDENT_PHONE: incomingUser.PHONE_NUMBER,
    UF_PARENT_STUDENT_NAME: incomingUser.UF_PARENT_STUDENT_NAME,
  };

  const phoneExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.UF_PARENT_PHONE &&
      umedUser.LOGIN === incomingUser.UF_PARENT_PHONE &&
      umedUser.ID !== parent.ID,
  );

  const emailExist = umedUsers.find(
    (umedUser) =>
      incomingUser?.UF_PARENT_EMAIL &&
      umedUser.LOGIN === incomingUser.UF_PARENT_EMAIL &&
      umedUser.ID !== parent.ID,
  );

  if (phoneExist && !emailExist) {
    paramsData.LOGIN = incomingUser?.UF_PARENT_EMAIL
      ? incomingUser?.UF_PARENT_EMAIL
      : incomingUser.UF_SNILS
        ? '0' + incomingUser.UF_SNILS
        : incomingUser.UF_APP_PASSWORD;
    delete paramsData.PHONE_NUMBER;
  }

  if (emailExist && phoneExist) {
    paramsData.LOGIN = incomingUser.UF_SNILS
      ? '0' + incomingUser.UF_SNILS
      : incomingUser.UF_APP_PASSWORD;

    delete paramsData.PHONE_NUMBER;
  }

  const userToUpdate = {};
  for (const key in parent) {
    if (paramsData[key] && parent[key] !== paramsData[key]) {
      userToUpdate[key] = paramsData[key];
    }
  }

  if (
    !parent.GROUPS_ID.includes(UMED_USER_GROUP_ID) ||
    !parent.GROUPS_ID.includes(UMED_CAFE_GROUP_ID) ||
    !parent.GROUPS_ID.includes(UMED_PARENT_GROUP_ID)
  ) {
    paramsData.GROUP_ID = [UMED_USER_GROUP_ID, UMED_CAFE_GROUP_ID, UMED_PARENT_GROUP_ID];
    userToUpdate.GROUP_ID = paramsData.GROUP_ID;
  }

  paramsData.PASSWORD = incomingUser.UF_SNILS
    ? incomingUser.UF_SNILS
    : incomingUser.UF_APP_PASSWORD;
  paramsData.CONFIRM_PASSWORD = paramsData.PASSWORD;
  userToUpdate.PASSWORD = paramsData.PASSWORD;

  if (!utils.isEmpty(userToUpdate) && Object.keys(userToUpdate).length) {
    const result = await putData(paramsData);
    if (result) {
      console.log(
        `umed: upgrade parent ${parent.ID} ${parent.LOGIN} of user ${incomingUser.UF_PERSON_ID}`,
        userToUpdate,
      );

      if (incomingUser?.UF_PARENT_PHONE) {
        await wazzup.sendMessage({
          phone: incomingUser.UF_PARENT_PHONE.replace(/\+/g, ''),
          text: messageTemplates('updateParent', {
            LOGIN: paramsData.LOGIN,
            PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
            UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
          }),
        });
      }

      if (incomingUser?.UF_PARENT_EMAIL) {
        await sendEmail(
          incomingUser.UF_PARENT_EMAIL,
          'Доступ в Личный кабинет ЮМЕД',
          messageTemplates('updateParent', {
            LOGIN: paramsData.LOGIN,
            PASSWORD: incomingUser.UF_SNILS ? null : paramsData.PASSWORD || null,
            UF_COLLEDGE_GROUP: paramsData.UF_COLLEDGE_GROUP,
          }),
        );
      }

      return true;
    }
  }

  return false;
};

const splitById = (arr1, arr2, arr1IdKey, arr2IdKey) => {
  const arr2Ids = new Set(
    arr2
      .map((obj) =>
        typeof obj[arr2IdKey] === 'string' ? obj[arr2IdKey].toLowerCase() : null,
      )
      .filter((id) => id !== null), // Filter out null values
  );

  const found = [];
  const notFound = [];

  arr1.forEach((obj) => {
    const id = obj[arr1IdKey];
    if (typeof id === 'string' && arr2Ids.has(id.toLowerCase())) {
      found.push(obj);
    } else {
      notFound.push(obj);
    }
  });

  return { found, notFound };
};

const getUmedUsers = async () => {
  const userList = await fetchData();
  return mapUmedUser(userList).filter((user) => {
    return (
      user?.GROUPS_ID?.includes(UMED_ABITURIENT_GROUP_ID) ||
      user?.GROUPS_ID?.includes(UMED_STUDENT_GROUP_ID) ||
      user?.GROUPS_ID?.includes(UMED_PARENT_GROUP_ID) ||
      user?.GROUPS_ID?.includes(UMED_TEACHER_GROUP_ID)
    );
  });
};

const getUmedUsersTeachers = async () => {
  const userList = await fetchData();
  return mapUmedTeacher(userList).filter((user) => {
    return (
      user?.GROUPS_ID?.includes(UMED_ABITURIENT_GROUP_ID) ||
      user?.GROUPS_ID?.includes(UMED_STUDENT_GROUP_ID) ||
      user?.GROUPS_ID?.includes(UMED_PARENT_GROUP_ID) ||
      user?.GROUPS_ID?.includes(UMED_TEACHER_GROUP_ID)
    );
  });
};

/**
 * Sync umed
 * @date 2/24/2024 - 5:41:12 PM
 * @param {Array} CUsers array
 * @async
 */
const syncUmed = async (CUsers = []) => {
  if (utils.isEmpty(CUsers)) return false;
  console.log('umed: syncUmed job started');

  // не создается учетная запись если студент учиться на двух направлениях
  //CUsers = Object.groupBy(CUsers, ({ person_id }) => person_id);

  let umedUsers = await getUmedUsers();
  let umedStudents, umedAbiturients, umedParents;

  if (utils.isEmpty(umedUsers)) {
    console.error('umedUsers is empty');
    return false;
  }
  await utils.writeToJson('umedUsers.json', umedUsers);

  console.log(`umed: total umed users ${umedUsers?.length}`);

  const now = Date.now();
  const THIRTY_DAYS_MS = 2592000000;

  const { CStudents_valid, CStudents_invalid } = CUsers.reduce(
    (acc, user) => {
      const eduEnd = Date.parse(user.period);
      const isValid = now - eduEnd < THIRTY_DAYS_MS;

      const isStudentValid =
        (isValid && (user.status === 'Выпущен' || user.status === 'Отчислен')) ||
        user.status === 'Студент' ||
        user.status === 'ВАкадемическомОтпуске';

      if (isStudentValid) {
        acc.CStudents_valid.push(user);
      } else {
        acc.CStudents_invalid.push(user);
      }

      return acc;
    },
    { CStudents_valid: [], CStudents_invalid: [] },
  );
  await utils.writeToJson('CStudents_valid.json', CStudents_valid);
  await utils.writeToJson('CStudents_invalid.json', CStudents_invalid);

  console.log(`umed: valid students ${CStudents_valid?.length}`);
  console.log(`umed: invalid students ${CStudents_invalid?.length}`);

  const CParents_valid = CStudents_valid.filter((parent) => {
    return (
      parent.customer_is_org === false &&
      parent.customer_name &&
      (parent.customer_phone || parent.customer_email) &&
      parent.fullname !== parent.customer_name
    );
  });
  console.log(`umed: valid parents ${CParents_valid?.length}`);

  // DELETE USERS
  console.log('umed: Delete users');

  /* for (const user of CUsers) {
    const doubleUsers = umedUsers.filter(
      (umedUser) => umedUser.UF_GUID === user.student_id,
    );

    if (Array.isArray(doubleUsers) && doubleUsers.length > 1) {
      doubleUsers.sort((a, b) => new Date(b.LAST_LOGIN) - new Date(a.LAST_LOGIN));
      const mostRecent = doubleUsers[0];

      const userToDelete = doubleUsers.filter((obj) => obj !== mostRecent);
      for (const user of userToDelete) {
        await disableUser(user);
      }
    }
  } */

  for (const umedUser of umedUsers) {
    const validUser = CUsers.find(
      (CUser) =>
        umedUser.UF_GUID === CUser.student_id ||
        umedUser.UF_PARENT_STUDENT_ID === CUser.student_id,
    );

    if (
      umedUser.LOGIN !== '+79989292929' &&
      umedUser.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) &&
      (!validUser || !umedUser.UF_GUID)
    ) {
      await disableUser(umedUser);
    }

    if (
      umedUser.GROUPS_ID.includes(UMED_PARENT_GROUP_ID) &&
      (!validUser || !umedUser.UF_PARENT_STUDENT_ID)
    ) {
      await disableUser(umedUser);
    }

    if (umedUser.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID) && umedUser?.XML_ID) {
      await disableUser(umedUser);
    }
  }

  const { found: studentsToDelete } = splitById(
    umedUsers,
    CStudents_invalid,
    'UF_GUID',
    'student_id',
  );

  const { found: parentsToDelete } = splitById(
    umedUsers,
    CStudents_invalid,
    'UF_PARENT_STUDENT_ID',
    'student_id',
  );

  for (const student of studentsToDelete) {
    await disableUser(student);
  }

  for (const parent of parentsToDelete) {
    await disableUser(parent);
  }
  ////

  // UPDATE EXISTING STUDENTS
  console.log('umed: Update students');

  umedUsers = await getUmedUsers();

  umedStudents = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) && user.UF_GUID;
  });

  const { found: studentsToUpdate } = splitById(
    CStudents_valid,
    umedStudents,
    'student_id',
    'UF_GUID',
  );

  for (const student of studentsToUpdate) {
    await updateStudent(map1CUser(student), umedUsers);
  }
  ////

  // UPDATE EXISTING PARENTS
  console.log('umed: Update parents');

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
    'student_id',
    'UF_PARENT_STUDENT_ID',
  );

  for (const parent of parentsToUpdate) {
    await updateParent(map1CUser(parent), umedUsers);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO STUDENTS BY PHONE
  console.log('umed: Upgrade students by phone');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToStudentsbyPhone } = splitById(
    CStudents_valid,
    umedAbiturients,
    'phone',
    'LOGIN',
  );

  for (const student of abiturientsToStudentsbyPhone) {
    await upgradeToStudent(map1CUser(student), umedUsers);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO STUDENTS BY EMAIL
  console.log('umed: Upgrade students by email');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToStudentsbyEmail } = splitById(
    CStudents_valid,
    umedAbiturients,
    'email',
    'LOGIN',
  );

  for (const student of abiturientsToStudentsbyEmail) {
    await upgradeToStudent(map1CUser(student), umedUsers);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO PARENTS BY PHONE
  console.log('umed: Upgrade parents by phone');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToParentsbyPhone } = splitById(
    CParents_valid,
    umedAbiturients,
    'customer_phone',
    'LOGIN',
  );

  for (const parent of abiturientsToParentsbyPhone) {
    await upgradeToParent(map1CUser(parent), umedUsers);
  }
  ////

  // UPGRADE FROM ABITURIENTS TO PARENTS BY EMAIL
  console.log('umed: Upgrade parents by email');

  umedUsers = await getUmedUsers();

  umedAbiturients = umedUsers.filter((user) => {
    return user.GROUPS_ID.includes(UMED_ABITURIENT_GROUP_ID);
  });

  const { found: abiturientsToParentsbyEmail } = splitById(
    CParents_valid,
    umedAbiturients,
    'customer_email',
    'LOGIN',
  );

  for (const parent of abiturientsToParentsbyEmail) {
    await upgradeToParent(map1CUser(parent), umedUsers);
  }
  ////

  // CREATE STUDENTS
  console.log('umed: Create students');

  umedUsers = await getUmedUsers();

  umedStudents = umedUsers.filter((user) => {
    return (
      user.GROUPS_ID.includes(UMED_STUDENT_GROUP_ID) && user.UF_PERSON_ID && user.UF_GUID
    );
  });

  const { notFound: studentsToCreate } = splitById(
    CStudents_valid,
    umedStudents,
    'student_id',
    'UF_GUID',
  );

  for (const student of studentsToCreate) {
    await createStudent(map1CUser(student), umedUsers);
  }
  ////

  // CREATE PARENTS
  console.log('umed: Create parents');

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
    'student_id',
    'UF_PARENT_STUDENT_ID',
  );

  for (const parent of parentsToCreate) {
    await createParent(map1CUser(parent), umedUsers);
  }
  ////

  console.log('umed: syncUmed job finished');
};

module.exports = {
  syncUmed,
  findTeacher,
  getUmedUsersTeachers,
  createTeacher,
  disableUser,
  updateTeacher,
};
