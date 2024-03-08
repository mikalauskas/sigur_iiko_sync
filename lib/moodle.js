const utils = require('./utils.js');

let token = '';
const STUDENT_MOODLE_ROLE_ID = 5;
const USK_MOODLE_GROUP_ID = 179;
const SPO_MOODLE_GROUP_ID = 178;
const LECH_MOODLE_GROUP_ID = 173;
const SESTR_MOODLE_GROUP_ID = 174;
const FARMA_MOODLE_GROUP_ID = 175;
const OPTIC_MOODLE_GROUP_ID = 176;

/**
 * @param {Object} postfields - The data to be sent in the POST request.
 * @returns {Promise<*>} - A promise that resolves to the decoded JSON response or false if there's an error.
 */
const moodleCurl = async (postfields) => {
  const options = {
    socketTimeout: 60,
    streamTimeout: 120,
  };

  const url = 'http://192.168.0.13/webservice/rest/server.php';
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

      if (!utils.isArrayEmpty(jsonResponse.warnings)) {
        console.error(jsonResponse.warnings);
      }

      return jsonResponse;
    } else {
      throw new Error(`moodle: HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('moodle: Error:', error.message);
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

const suspendUser = async (id) => {
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
    console.error('moodle: Error in suspending Moodle user:', error);
    return false;
  }
};

/**
 * Search for a Moodle cohort based on user data.
 *
 * @param {Object} user - User data.
 * @param {string} user.group_name - College group for the query.
 * @returns {Promise<number|boolean>} - A promise that resolves to the cohort ID or false if there's an error.
 */
const searchCohort = async (user) => {
  const searchCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_search_cohorts',
    moodlewsrestformat: 'json',
    query: user.group_name,
    'context[contextid]': 1,
  };

  try {
    const response = await moodleCurl(searchCohortData);

    if (response && response.cohorts && response.cohorts.length > 0) {
      return response.cohorts[0].id;
    } else {
      console.error('moodle: No cohorts found');
      return false;
    }
  } catch (error) {
    console.error('moodle: Error searching Moodle cohort:', error.message);
    return false;
  }
};

/**
 * Create a Moodle cohort based on user data.
 *
 * @param {Object} user - User data.
 * @param {string} user.group_name - College group for the cohort.
 * @returns {Promise<number|boolean>} - A promise that resolves to the created cohort ID or false if there's an error.
 */
const createCohort = async (user) => {
  const createCohortData = {
    wstoken: token, // Replace with your Moodle token
    wsfunction: 'core_cohort_create_cohorts',
    moodlewsrestformat: 'json',
    'cohorts[0][categorytype][type]': 'system',
    'cohorts[0][categorytype][value]': 'system',
    'cohorts[0][name]': user.group_name,
    'cohorts[0][idnumber]': user.group_name,
  };

  try {
    const createCohortResult = await moodleCurl(createCohortData);

    if (createCohortResult && createCohortResult[0] && createCohortResult[0].id) {
      console.log(
        `moodle: Cohort created successfully with ID: ${createCohortResult[0].id}`,
      );
      return createCohortResult[0].id;
    } else {
      console.error('moodle: Error creating Moodle cohort or cohort ID not found.');
      return false;
    }
  } catch (error) {
    console.error('moodle: Error creating Moodle cohort:', error.message);
    return false;
  }
};

/**
 * Add a user to a Moodle cohort.
 *
 * @param {Object} user - User data.
 * @param {number} cohortId - ID of the cohort to add the user to.
 * @returns {Promise<void>} - A promise that resolves when the user is added to the cohort or rejects if there's an error.
 */
const addUserToCohort = async (user, incomingUser, cohortId) => {
  const addCohortMembersData = {
    wstoken: token, // Replace with your Moodle token
    wsfunction: 'core_cohort_add_cohort_members',
    moodlewsrestformat: 'json',
    'members[0][cohorttype][type]': 'id',
    'members[0][cohorttype][value]': cohortId,
    'members[0][usertype][type]': 'id',
    'members[0][usertype][value]': user.UF_ID_MOODLE,
  };

  // Add additional cohort members based on conditions
  switch (incomingUser.edu_form) {
    case 'Вечерняя':
      addCohortMembersData['members[1][cohorttype][type]'] = 'id';
      addCohortMembersData['members[1][cohorttype][value]'] = USK_MOODLE_GROUP_ID; // Replace with your USK group ID
      addCohortMembersData['members[1][usertype][type]'] = 'id';
      addCohortMembersData['members[1][usertype][value]'] = user.id;
      break;
    case 'Очная':
      addCohortMembersData['members[1][cohorttype][type]'] = 'id';
      addCohortMembersData['members[1][cohorttype][value]'] = SPO_MOODLE_GROUP_ID; // Replace with your SPO group ID
      addCohortMembersData['members[1][usertype][type]'] = 'id';
      addCohortMembersData['members[1][usertype][value]'] = user.id;
      break;
  }

  switch (incomingUser.speciality_name) {
    case 'Фармация':
      addCohortMembersData['members[2][cohorttype][type]'] = 'id';
      addCohortMembersData['members[2][cohorttype][value]'] = FARMA_MOODLE_GROUP_ID; // Replace with your FARMA group ID
      addCohortMembersData['members[2][usertype][type]'] = 'id';
      addCohortMembersData['members[2][usertype][value]'] = user.id;
      break;
    case 'Лечебное дело':
      addCohortMembersData['members[2][cohorttype][type]'] = 'id';
      addCohortMembersData['members[2][cohorttype][value]'] = LECH_MOODLE_GROUP_ID; // Replace with your LECH group ID
      addCohortMembersData['members[2][usertype][type]'] = 'id';
      addCohortMembersData['members[2][usertype][value]'] = user.id;
      break;
    case 'Сестринское дело':
      addCohortMembersData['members[2][cohorttype][type]'] = 'id';
      addCohortMembersData['members[2][cohorttype][value]'] = SESTR_MOODLE_GROUP_ID; // Replace with your SESTR group ID
      addCohortMembersData['members[2][usertype][type]'] = 'id';
      addCohortMembersData['members[2][usertype][value]'] = user.id;
      break;
    case 'Медицинская оптика':
      addCohortMembersData['members[2][cohorttype][type]'] = 'id';
      addCohortMembersData['members[2][cohorttype][value]'] = OPTIC_MOODLE_GROUP_ID; // Replace with your OPTIC group ID
      addCohortMembersData['members[2][usertype][type]'] = 'id';
      addCohortMembersData['members[2][usertype][value]'] = user.id;
      break;
  }

  try {
    const addCohortMembersResult = await moodleCurl(addCohortMembersData);

    if (
      addCohortMembersResult &&
      addCohortMembersResult.warnings &&
      addCohortMembersResult.warnings.length > 0
    ) {
      console.error(
        `Error adding user to cohorts: ${addCohortMembersResult.warnings[0].message}`,
      );
    } else {
      console.log('moodle: User added to cohorts successfully.');
    }
  } catch (error) {
    console.error('moodle: Error adding user to cohorts:', error.message);
  }
};

/**
 * Set a Moodle role for a user.
 *
 * @param {Object} user - User data.
 * @param {number} user.id - User's Moodle ID.
 * @returns {Promise<void>} - A promise that resolves when the role is set or rejects if there's an error.
 */
const setRole = async (user) => {
  const setRole = {
    wstoken: token, // Replace with your Moodle token
    wsfunction: 'core_role_assign_roles',
    moodlewsrestformat: 'json',
    'assignments[0][userid]': user.id,
    'assignments[0][roleid]': STUDENT_MOODLE_ROLE_ID, // Replace with your student role ID
    'assignments[0][contextid]': 1,
  };

  try {
    const setRoleResult = await moodleCurl(setRole);

    if (setRoleResult && setRoleResult.warnings && setRoleResult.warnings.length > 0) {
      console.error(
        `moodle: Error assigning Student role: ${setRoleResult.warnings[0].message}`,
      );
    } else {
      console.log('moodle: Student role assigned successfully.');
    }
  } catch (error) {
    console.error('moodle: Error assigning Student role:', error.message);
  }
};

function is_student(CUser) {
  return CUser.status === 'Студент' && CUser.phone;
}

function farm2023(CUser) {
  const regexPattern = /ФУ-\d{1,2}-2[3-9]/;
  return regexPattern.test(CUser.group_name);
}

/**
 * Add a user to Moodle.
 *
 * @param {Object} user - User data.
 * @param {string} user.LOGIN - User login.
 * @param {string} user.UF_APP_PASSWORD - User's application password.
 * @param {string} user.NAME - User's first name.
 * @param {string} user.LAST_NAME - User's last name.
 * @param {string} user.SECOND_NAME - User's middle name.
 * @param {string} user.EMAIL - User's email.
 * @param {string} user.UF_COLLEDGE_GROUP - User's college group.
 * @param {string} user.UF_ID_BITRIX - User's Bitrix ID.
 * @param {Array} moodleUsers - Array of modole users objects
 * @param {Object} incomingUser - object of incoming user
 * @returns {Promise<number|boolean>} - A promise that resolves to the created user's Moodle ID or false if there's an error.
 */
const createUser = async (user = {}, moodleUsers = [], incomingUser = {}) => {
  if (utils.isEmpty(user) || utils.isEmpty(moodleUsers) || utils.isEmpty(incomingUser))
    return false;

  const foundUser = moodleUsers.find(
    (moodleUser) =>
      user.username !== incomingUser.phone && moodleUser.username === incomingUser.phone,
  );

  if (foundUser) {
    console.log(
      `moodle: found double user ${foundUser.id} with phone ${incomingUser.phone}`,
    );
    return false;
  }

  const createUser = {
    wstoken: token, // Replace with your Moodle token
    wsfunction: 'core_user_create_users',
    moodlewsrestformat: 'json',
    'users[0][username]': incomingUser.phone,
    'users[0][password]': incomingUser.password,
    'users[0][firstname]': user.firstName,
    'users[0][lastname]': user.lastName,
    'users[0][middlename]': user.secondName,
    'users[0][email]': user.email,
    'users[0][phone1]': user.phone,
    'users[0][description]': user.group_name,
    'users[0][department]': user.group_name,
    'users[0][idnumber]': user.bitrix_id,
    'users[0][customfields][0][type]': 'college_group',
    'users[0][customfields][0][value]': user.group_name,
    'users[0][customfields][1][type]': 'info_login',
    'users[0][customfields][1][value]': user.login,
    'users[0][customfields][2][type]': 'info_pass',
    'users[0][customfields][2][value]': user.password,
    'users[0][city]': 'Челябинск',
    'users[0][country]': 'RU',
  };

  try {
    const createUserResult = await moodleCurl(createUser);

    if (createUserResult && createUserResult[0] && createUserResult[0].id) {
      console.log(
        `moodle: User created successfully with Moodle ID: ${createUserResult[0].id}`,
      );
      return createUserResult[0].id;
    } else {
      console.error('moodle: Error creating Moodle user or user ID not found.');
      return false;
    }
  } catch (error) {
    console.error('moodle: Error creating Moodle user:', error.message);
    return false;
  }
};

async function updateUser(user = {}, moodleUsers = [], incomingUser = {}) {
  if (utils.isObjectEmpty(user) || utils.isObjectEmpty(incomingUser)) return false;

  const foundUser = moodleUsers.find(
    (moodleUser) =>
      user.username !== incomingUser.phone && moodleUser.username === incomingUser.phone,
  );

  if (foundUser) {
    console.log(
      `moodle: found double user ${foundUser.id} with phone ${incomingUser.phone}`,
    );
    return false;
  }

  let needsUpdate = false;
  const postData = {};

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
    postData['users[0][firstname]'] = incomingUser.firstName;
    postData['users[0][lastname]'] = incomingUser.lastName;
    postData['users[0][middlename]'] = incomingUser.secondName;
    needsUpdate = true;
  }
  if (user.username !== incomingUser.phone) {
    postData['users[0][username]'] = incomingUser.phone;
    needsUpdate = true;
  }
  if (user.email !== incomingUser.email) {
    postData['users[0][email]'] = incomingUser.email;
    needsUpdate = true;
  }
  if (user.phone1 !== incomingUser.phone) {
    postData['users[0][phone1]'] = incomingUser.phone;
    needsUpdate = true;
  }
  if (user.description !== incomingUser.group_name) {
    postData['users[0][description]'] = incomingUser.group_name;
    needsUpdate = true;
  }
  if (user.department !== incomingUser.group_name) {
    postData['users[0][department]'] = incomingUser.group_name;
    needsUpdate = true;
  }
  if (user.idnumber !== incomingUser.bitrix_id) {
    postData['users[0][idnumber]'] = incomingUser.bitrix_id;
    needsUpdate = true;
  }
  if (user.college_group !== incomingUser.group_name) {
    postData['users[0][customfields][0][type]'] = 'college_group';
    postData['users[0][customfields][0][value]'] = incomingUser.group_name;
    needsUpdate = true;
  }
  if (user.info_login !== incomingUser.bitrix_id) {
    postData['users[0][customfields][1][type]'] = 'info_login';
    postData['users[0][customfields][1][value]'] = incomingUser.bitrix_id;
    needsUpdate = true;
  }
  if (user.info_pass !== incomingUser.password) {
    postData['users[0][password]'] = incomingUser.password;
    postData['users[0][customfields][2][type]'] = 'info_pass';
    postData['users[0][customfields][2][value]'] = incomingUser.password;
    needsUpdate = true;
  }
  if (user.suspended !== false) {
    postData['users[0][suspended]'] = 0;
    needsUpdate = true;
  }
  if (user.confirmed !== true) {
    postData['users[0][confirmed]'] = 1;
    needsUpdate = true;
  }

  if (needsUpdate) {
    postData.wstoken = token;
    postData.wsfunction = 'core_user_update_users';
    postData.moodlewsrestformat = 'json';
    postData['users[0][id]'] = user.id;
    console.log(`moodle: update user ${user.id} ${user.username}`, postData);

    const result = await moodleCurl(postData);

    if (result) return true;
  }

  setRole(user);

  return false;
}

const syncMoodle = async (access_token = '', CUsers = []) => {
  if (!access_token || utils.isArrayEmpty(CUsers)) return [];
  console.log('syncMoodle job started');
  token = access_token;

  const moodleUsers = await getUsers();
  if (utils.isArrayEmpty(moodleUsers)) return false;
  await utils.writeToJson('moodleUsers.json', moodleUsers);

  let toUpdate = 0;
  let updated = 0;
  let toCreate = 0;
  let created = 0;
  let toRemove = 0;
  let removed = 0;

  for (const incomingUser of CUsers) {
    const user = findUser(incomingUser, moodleUsers);

    if (is_student(incomingUser) && farm2023(incomingUser)) {
      if (user && user.id) {
        await utils.delay(100);
        const updateResult = await updateUser(
          user,
          moodleUsers,
          formatCUser(incomingUser),
        );
        if (updateResult) updated++;
        toUpdate++;
      } else {
        console.log(
          `moodle: create user ${incomingUser.phone} ${incomingUser.group_name}`,
        );
        createUser();
      }
    } else {
      if (user && user.id && !user.suspended) {
        if (suspendUser(user.id)) console.log(`moodle: removed user ${user.phone1}`);
        toRemove++;
      }
    }
  } //loop

  console.log(
    `moodle: create: ${created}/${toCreate} update: ${updated}/${toUpdate} remove ${removed}/${toRemove}`,
  );
};

module.exports = { syncMoodle };
