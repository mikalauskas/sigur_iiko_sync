const utils = require('./utils.js');

let token = '';

/**
 * @param {Object} postfields - The data to be sent in the POST request.
 * @returns {Promise<*>} - A promise that resolves to the decoded JSON response or false if there's an error.
 */
const moodleCurl = async (postfields) => {
  const options = {
    socketTimeout: 60,
    streamTimeout: 120,
  };

  const url = 'https://lms.umedcollege.ru/webservice/rest/server.php';
  const requestBody = new URLSearchParams(postfields);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: options.socketTimeout * 1000,
    });

    if (response.ok) {
      const jsonResponse = await response.json();

      return jsonResponse;
    } else {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
};

const formatCUser = (data = {}) => {
  if (utils.isObjectEmpty(data)) return false;

  const {
    person_id,
    student_id,
    bitrix_id,
    fullname,
    login,
    password,
    phone,
    email,
    group_name,
    speciality_name,
    group_year,
    edu_form,
  } = data;

  const result = {
    phone,
    email,
    bitrix_id,
    person_id,
    student_id,
    login,
    password,
    group_name,
    speciality_name,
    group_year,
    edu_form,
  };

  if (fullname) {
    const [lastName, firstName, secondName] = fullname.split(' ');
    result.lastName = (
      lastName ? lastName.charAt(0).toUpperCase() + lastName.substr(1).toLowerCase() : ''
    ).trim();
    result.firstName = (
      firstName
        ? firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase()
        : ''
    ).trim();
    result.secondName = (
      secondName
        ? secondName.charAt(0).toUpperCase() + secondName.substr(1).toLowerCase()
        : ''
    ).trim();
    if (!email) result.email = phone + '@mail.ru';
  } else {
    return {};
  }

  return result;
};

const getUsers = async () => {
  const postData = {
    wstoken: token,
    wsfunction: 'core_user_get_users',
    moodlewsrestformat: 'json',
    'criteria[0][key]': '',
    'criteria[0][value]': '',
  };

  const usersResult = await moodleCurl(postData);

  /* [
    {
      type: 'text',
      value: 'ФУ-17-23',
      name: 'Учебная группа',
      shortname: 'college_group'
    },
    {
      type: 'text',
      value: '3552429354',
      name: 'Инфо-киоск логин',
      shortname: 'info_login'
    },
    {
      type: 'text',
      value: '189138011211',
      name: 'Инфо-киоск пароль',
      shortname: 'info_pass'
    },
    {
      type: 'menu',
      value: 'По умолчанию',
      name: 'Вариант доступа к итоговым тестам',
      shortname: 'EXAMACCESS'
    }
  ] */
  return usersResult.users.map((user) => {
    user.customfields.forEach((field) => {
      user[field.shortname] = field.value;
    });

    delete user.customfields;

    return user;
  });
};

/**
 * Search for a Moodle user based on criteria.
 *
 * @param {Object} user - An array containing user information.
 * @returns {Promise<Array>} - A promise that resolves to an array of search results or an empty array.
 */
const findUser = (incomingUser, moodleUsers) => {
  const user = moodleUsers.find(
    (moodleUser) => moodleUser.idnumber === incomingUser.bitrix_id,
  );

  return user;
};
const searchUser = async (user) => {
  const postData = {
    wstoken: token,
    wsfunction: 'core_user_get_users',
    moodlewsrestformat: 'json',
    'criteria[0][key]': 'idnumber',
    'criteria[0][value]': user.UF_ID_BITRIX,
  };

  const searchResults = await moodleCurl(postData);

  for (const user of searchResults.users) {
    if (!utils.isObjectEmpty(user) && user.id) {
      // Update the user
      const searchResult = user.id;
      return searchResult;
    }
  }

  return false;
};

const suspendMoodleUser = async (id) => {
  if (!id) return false;
  const postData = {
    wstoken: token,
    wsfunction: 'core_user_update_users',
    moodlewsrestformat: 'json',
    'users[0][id]': id,
    'users[0][suspended]': 1,
  };

  try {
    const updateUserResult = await moodleCurl(postData);
    if (updateUserResult?.warnings[0]?.message) return false;
    return true;
  } catch (error) {
    console.error('Error in suspending Moodle user:', error);
    return false;
  }
};

function is_student(CUser) {
  return CUser.status === 'Студент' && CUser.phone;
}

function farm2023(CUser) {
  const regexPattern = /ФУ-\d{1,2}-23/;
  return (
    regexPattern.test(CUser.group_name) &&
    CUser.group_year === '2023' &&
    CUser.edu_form === 'Вечерняя'
  );
}

async function updateUser(user = {}, moodleUsers = [], incomingUser = {}) {
  if (utils.isObjectEmpty(user) || utils.isObjectEmpty(incomingUser)) return false;

  const foundUser = moodleUsers.find(
    (moodleUser) =>
      user.username !== incomingUser.phone && moodleUser.username === incomingUser.phone,
  );

  if (foundUser) {
    console.log(`found double user with phone ${incomingUser.phone}`);
    return false;
  }

  const compareData = {
    username: incomingUser.phone,
    firstname: incomingUser.firstName,
    lastname: incomingUser.lastName,
    middlename: incomingUser.secondName,
    email: incomingUser.email,
    phone1: incomingUser.phone,
    description: incomingUser.group_name,
    department: incomingUser.group_name,
    idnumber: incomingUser.bitrix_id,
    college_group: incomingUser.group_name,
    info_login: incomingUser.bitrix_id,
    info_pass: incomingUser.password,
  };

  let needsUpdate = false;
  if (user.username !== incomingUser.phone) {
    needsUpdate = true;
  }

  user.fullname =
    `${incomingUser.firstName} ${incomingUser.secondName} ${incomingUser.lastName}`.replace(
      /(\s{2})/g,
      ' ',
    );

  if (
    user.fullname !==
    `${incomingUser.firstName} ${incomingUser.secondName} ${incomingUser.lastName}`.replace(
      /(\s{2})/g,
      ' ',
    )
  ) {
    needsUpdate = true;
  }
  if (user.email !== incomingUser.email) needsUpdate = true;
  if (user.phone1 !== incomingUser.phone) needsUpdate = true;
  if (user.description !== incomingUser.group_name) needsUpdate = true;
  if (user.department !== incomingUser.group_name) needsUpdate = true;
  if (user.idnumber !== incomingUser.bitrix_id) needsUpdate = true;
  if (user.college_group !== incomingUser.group_name) needsUpdate = true;
  if (user.info_login !== incomingUser.bitrix_id) needsUpdate = true;
  if (user.info_pass !== incomingUser.password) needsUpdate = true;
  if (user.suspended !== false) needsUpdate = true;
  if (user.confirmed !== true) needsUpdate = true;

  if (needsUpdate) {
    const postData = {
      wstoken: token,
      wsfunction: 'core_user_update_users',
      moodlewsrestformat: 'json',
      'users[0][id]': user.id,
      'users[0][suspended]': false,
      'users[0][confirmed]': true,
      'users[0][username]': incomingUser.phone,
      'users[0][password]': incomingUser.password,
      'users[0][firstname]': incomingUser.firstName,
      'users[0][lastname]': incomingUser.lastName,
      'users[0][middlename]': incomingUser.secondName,
      'users[0][email]': incomingUser.email,
      'users[0][phone1]': incomingUser.phone,
      'users[0][description]': incomingUser.group_name,
      'users[0][department]': incomingUser.group_name,
      'users[0][idnumber]': incomingUser.bitrix_id,
      'users[0][customfields][0][type]': 'college_group',
      'users[0][customfields][0][value]': incomingUser.group_name,
      'users[0][customfields][1][type]': 'info_login',
      'users[0][customfields][1][value]': incomingUser.bitrix_id,
      'users[0][customfields][2][type]': 'info_pass',
      'users[0][customfields][2][value]': incomingUser.password,
      'users[0][city]': 'Челябинск',
      'users[0][country]': 'RU',
    };
    console.log(`update user ${user.id} ${user.username}`, postData);

    await utils.delay(100);

    //const result = await moodleCurl(postData);

    //if (result) return true;
  }

  return false;
}

const syncMoodle = async (access_token = '', CUsers = []) => {
  //if (!access_token || utils.isArrayEmpty(CUsers)) return [];
  console.log('syncMoodle job started');
  token = access_token;

  const moodleUsers = await getUsers();
  if (utils.isArrayEmpty(moodleUsers)) return false;
  await utils.writeToJson('moodleUsers.json', moodleUsers);

  let toUpdate = 0;
  let toCreate = 0;
  let toRemove = 0;

  for (const incomingUser of CUsers) {
    const user = findUser(incomingUser, moodleUsers);

    if (is_student(incomingUser) && farm2023(incomingUser)) {
      if (user && user.id) {
        updateUser(user, moodleUsers, formatCUser(incomingUser));
        toUpdate++;
      } else {
        console.log(`create user ${incomingUser.phone} ${incomingUser.group_name}`);
        toCreate++;
      }
    } else {
      if (user && user.id && !user.suspended) {
        if (suspendMoodleUser(user.id)) console.log(`removed user ${user.phone1}`);
        toRemove++;
      }
    }
  } //loop

  console.log(`create: ${toCreate} update: ${toUpdate} remove ${toRemove}`);
};

module.exports = { syncMoodle };
