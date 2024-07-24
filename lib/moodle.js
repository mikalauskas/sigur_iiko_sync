const utils = require('./utils.js');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.MOODLE_TOKEN;
const STUDENT_MOODLE_ROLE_ID = 5;
const USK_MOODLE_GROUP_ID = 179;
const SPO_MOODLE_GROUP_ID = 178;
const LECH_MOODLE_GROUP_ID = 173;
const SESTR_MOODLE_GROUP_ID = 174;
const FARMA_MOODLE_GROUP_ID = 175;
const OPTIC_MOODLE_GROUP_ID = 176;
const DPO_MOODLE_GROUP_ID = 206;

/**
 * @param {Object} postfields - The data to be sent in the POST request.
 * @returns {Promise<*>} - A promise that resolves to the decoded JSON response or false if there's an error.
 */
const moodleCurl = async (postfields) => {
  /* const options = {
    socketTimeout: 60,
    streamTimeout: 120,
  }; */

  const url = 'https://lms.umedcollege.ru/webservice/rest/server.php';
  const requestBody = new URLSearchParams(postfields);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      /* timeout: options.socketTimeout * 1000, */
    });

    if (response.ok) {
      const jsonResponse = await response.json();

      return jsonResponse;
    } else {
      console.error(`moodle: HTTP error! Status: ${response.status}`);
      return false;
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
    person_snils,
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
    fullname,
    email,
    login,
    group_name,
    person_id,
    student_id,
    person_snils,
    bitrix_id,
    password,
    speciality_name,
    group_year,
    edu_form,
  };

  if (fullname) {
    const [lastname, firstname, middlename] = fullname.split(' ');
    result.lastname = lastname
      ? lastname.charAt(0).toUpperCase() + lastname.substr(1).toLowerCase()
      : '';
    result.firstname = firstname
      ? firstname.charAt(0).toUpperCase() + firstname.substr(1).toLowerCase()
      : '';
    result.middlename = middlename
      ? middlename.charAt(0).toUpperCase() + middlename.substr(1).toLowerCase()
      : '';
  } else {
    return null;
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
    (moodleUser) => moodleUser.student_id === incomingUser.student_id,
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
 * @param {Object} incomingUser - User data.
 * @param {string} incomingUser.group_name - College group for the query.
 * @returns {Promise<number|boolean>} - A promise that resolves to the cohort ID or false if there's an error.
 */
const searchCohort = async (incomingUser = {}) => {
  if (utils.isEmpty(incomingUser?.group_name)) return false;

  const searchCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_search_cohorts',
    moodlewsrestformat: 'json',
    query: incomingUser.group_name,
    'context[contextid]': 1,
  };

  try {
    const response = await moodleCurl(searchCohortData);

    if (response && response.cohorts && response.cohorts.length > 0) {
      return response.cohorts[0];
    } else {
      console.error('moodle: No cohorts found');
      return false;
    }
  } catch (error) {
    console.error('moodle: Error searching Moodle cohort:', error.message);
    return false;
  }
};

const getCohortsMembers = async (cohort = {}) => {
  if (utils.isEmpty(cohort)) return false;

  const searchCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_get_cohort_members',
    moodlewsrestformat: 'json',
    'cohortids[0]': cohort.id,
  };

  try {
    const response = await moodleCurl(searchCohortData);

    if (response[0]?.userids) {
      return response[0].userids;
    } else {
      console.log('empty cohort');
      return [];
    }
  } catch (error) {
    console.error('moodle: Error searching Moodle cohort:', error.message);
    return false;
  }
};

/**
 * Create a Moodle cohort based on user data.
 *
 * @param {Object} incomingUser - User data.
 * @param {string} incomingUser.group_name - College group for the cohort.
 * @returns {Promise<number|boolean>} - A promise that resolves to the created cohort ID or false if there's an error.
 */
const createCohort = async (incomingUser = {}) => {
  if (utils.isEmpty(incomingUser?.group_name)) return false;

  const createCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_create_cohorts',
    moodlewsrestformat: 'json',
    'cohorts[0][categorytype][type]': 'system',
    'cohorts[0][categorytype][value]': 'system',
    'cohorts[0][name]': incomingUser.group_name,
    'cohorts[0][idnumber]': incomingUser.group_name,
  };

  try {
    const createCohortResult = await moodleCurl(createCohortData);

    if (createCohortResult && createCohortResult[0] && createCohortResult[0].id) {
      console.log(
        `moodle: Cohort created successfully with ID: ${createCohortResult[0].id}`,
      );
      return createCohortResult[0];
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
const addUserToCohort = async (user = {}, incomingUser = {}, cohort = {}) => {
  if (utils.isEmpty(user?.id) || utils.isEmpty(incomingUser) || utils.isEmpty(cohort?.id))
    return false;

  const addCohortMembersData = {
    wstoken: token,
    wsfunction: 'core_cohort_add_cohort_members',
    moodlewsrestformat: 'json',
    'members[0][cohorttype][type]': 'id',
    'members[0][cohorttype][value]': cohort.id,
    'members[0][usertype][type]': 'id',
    'members[0][usertype][value]': user.id,
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

    if (!utils.isEmpty(addCohortMembersResult?.warnings)) {
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
 * Get the courses for a user in Moodle.
 *
 * @param {Object} user - Moodle user ID.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of user courses or rejects if there's an error.
 */
const getUserCourses = async (user) => {
  if (utils.isEmpty(user) && !user.id) return false;

  const fields = {
    wstoken: token,
    wsfunction: 'core_enrol_get_users_courses',
    moodlewsrestformat: 'json',
    userid: user.id,
  };

  try {
    const usersCourses = await moodleCurl(fields);

    return usersCourses;
  } catch (error) {
    console.error('Error fetching user courses:', error.message);
    return false;
  }
};

/**
 * Update the group membership for a user in Moodle courses.
 *
 * @param {Object} user - User data.
 * @param {Object[]} usersCourses - Array of Moodle courses.
 * @returns {Promise<void>} - A promise that resolves when the group membership is updated or rejects if there's an error.
 */
const updateGroupMembership = async (user, usersCourses) => {
  if (utils.isEmpty(usersCourses[0]?.id)) return false;
  for (const course of usersCourses) {
    // Get the list of groups for the course
    const courseGroupsData = {
      wstoken: token,
      wsfunction: 'core_group_get_course_groups',
      moodlewsrestformat: 'json',
      courseid: course.id,
    };

    const courseGroupsResult = await moodleCurl(courseGroupsData);

    // Check for a matching group by name
    let createCourseGroup = true;
    let courseGroupId;

    for (const group of courseGroupsResult) {
      if (group.name === user.college_group) {
        courseGroupId = group.id;
        createCourseGroup = false;

        const courseGroupMembersData = {
          wstoken: token,
          wsfunction: 'core_group_get_group_members',
          moodlewsrestformat: 'json',
          'groupids[0]': group.id,
        };

        const courseGroupMembers = await moodleCurl(courseGroupMembersData);

        const courseGroupUserids = courseGroupMembers[0].userids;

        if (
          !utils.isArrayEmpty(courseGroupUserids) &&
          !courseGroupUserids.includes(user.id)
        ) {
          const addCourseGroupMembersData = {
            wstoken: token,
            wsfunction: 'core_group_add_group_members',
            moodlewsrestformat: 'json',
            'members[0][groupid]': courseGroupId,
            'members[0][userid]': user.id,
          };

          await moodleCurl(addCourseGroupMembersData);
          console.log(
            `moodle: addCourseGroupMembers: ${user.username} Added to course group - courseid: ${course.id}, groupid: ${courseGroupId}`,
          );
        }

        break;
      }
    }

    if (createCourseGroup) {
      // Create a new group for the course
      const createCourseGroupsData = {
        wstoken: token,
        wsfunction: 'core_group_create_groups',
        moodlewsrestformat: 'json',
        'groups[0][courseid]': course.id,
        'groups[0][name]': user.college_group,
        'groups[0][description]': 'Automatically created from 1C',
      };

      const createCourseGroupResult = await moodleCurl(createCourseGroupsData);
      courseGroupId = createCourseGroupResult[0].id;

      console.log(
        `moodle: createCourseGroup: ${user.username} created course group: ${user.college_group}`,
      );
      // Add the user to the course group
      const addCourseGroupMembersData = {
        wstoken: token,
        wsfunction: 'core_group_add_group_members',
        moodlewsrestformat: 'json',
        'members[0][groupid]': courseGroupId,
        'members[0][userid]': user.id,
      };

      await moodleCurl(addCourseGroupMembersData);
      console.log(
        `moodle: addCourseGroupMembers: ${user.username} Added to course group - courseid: ${course.id}, groupid: ${courseGroupId}`,
      );
    }
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
    wstoken: token,
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
    }
  } catch (error) {
    console.error('moodle: Error assigning Student role:', error.message);
  }
};

const is_student = (user) => {
  return user.status === 'Студент';
};

const farm2023 = (CUser) => {
  const regexPattern = /ФУ-\d{1,2}-2[3-9]/;
  return regexPattern.test(CUser.group_name);
};

const sestr2024 = (CUser) => {
  const regexPattern = /СДУ-\d{1,2}-2[4-9]/;
  return regexPattern.test(CUser.group_name);
};

/**
 * Add a user to Moodle.
 *
 * @param {Object} user - User data.
 * @param {Array} moodleUsers - Array of modole users objects
 * @param {Object} incomingUser - object of incoming user
 * @returns {Promise<Object|boolean>} - A promise that resolves to the created user's Moodle ID or false if there's an error.
 */
const createUser = async (incomingUser = {}, moodleUsers = []) => {
  if (utils.isEmpty(moodleUsers) || utils.isEmpty(incomingUser)) return false;

  const createUser = {
    wstoken: token,
    wsfunction: 'core_user_create_users',
    moodlewsrestformat: 'json',
    'users[0][username]': incomingUser.phone,
    'users[0][password]': incomingUser.password,
    'users[0][firstname]': incomingUser.firstname,
    'users[0][lastname]': incomingUser.lastname,
    'users[0][middlename]': incomingUser.middlename,
    'users[0][email]': incomingUser.email
      ? incomingUser.email
      : (incomingUser.person_snils ?? incomingUser.login) + '@mail.ru',
    'users[0][phone1]': incomingUser.phone ?? '',
    'users[0][description]': incomingUser.group_name,
    'users[0][department]': incomingUser.group_name,
    'users[0][idnumber]': incomingUser.bitrix_id,
    'users[0][customfields][0][type]': 'college_group',
    'users[0][customfields][0][value]': incomingUser.group_name,
    'users[0][customfields][1][type]': 'info_login',
    'users[0][customfields][1][value]': incomingUser.login,
    'users[0][customfields][2][type]': 'info_pass',
    'users[0][customfields][2][value]': incomingUser.password,
    'users[0][customfields][3][type]': 'student_id',
    'users[0][customfields][3][value]': incomingUser.student_id,
    'users[0][customfields][4][type]': 'person_snils',
    'users[0][customfields][4][value]': incomingUser.person_snils,
    'users[0][customfields][5][type]': 'person_id',
    'users[0][customfields][5][value]': incomingUser.person_id,
    'users[0][city]': 'Челябинск',
    'users[0][country]': 'RU',
  };

  const doubleStudent = moodleUsers.find(
    (moodleUser) => moodleUser.username === incomingUser.phone,
  );

  if (doubleStudent) {
    if (moodleUsers.find((moodleUser) => moodleUser.username === incomingUser.email)) {
      incomingUser.login2 = incomingUser.person_snils ?? incomingUser.login;
      createUser['users[0][username]'] = incomingUser.login2;
    } else if (incomingUser.email) {
      incomingUser.login2 = incomingUser.email;
      createUser['users[0][username]'] = incomingUser.login2;
    }
  } else {
    incomingUser.login2 =
      incomingUser.phone ??
      incomingUser.email ??
      incomingUser.person_snils ??
      incomingUser.login;
    createUser['users[0][username]'] = incomingUser.login2;
  }

  try {
    const createUserResult = await moodleCurl(createUser);

    if (createUserResult && createUserResult[0] && createUserResult[0].id) {
      console.log(
        `moodle: User created successfully with Moodle ID: ${createUserResult[0].id}`,
        createUser,
      );
      return createUserResult[0];
    } else {
      console.error(
        'moodle: Error creating Moodle user or user ID not found.',
        createUser,
      );
      return false;
    }
  } catch (error) {
    console.error('moodle: Error creating Moodle user:', error.message);
    return false;
  }
};

const updateUser = async (user = {}, moodleUsers = [], incomingUser = {}) => {
  if (utils.isObjectEmpty(user) || utils.isObjectEmpty(incomingUser)) return false;

  let needsUpdate = false;
  const postData = {};

  if (user.fullname !== incomingUser.fullname) {
    postData['users[0][firstname]'] = incomingUser.firstname;
    postData['users[0][lastname]'] = incomingUser.lastname;
    postData['users[0][middlename]'] = incomingUser.middlename;
    needsUpdate = true;
  }

  const doubleStudent = moodleUsers.find(
    (moodleUser) =>
      moodleUser.username === incomingUser.phone && moodleUser.id !== user.id,
  );

  if (doubleStudent) {
    if (
      moodleUsers.find(
        (moodleUser) =>
          moodleUser.username === incomingUser.email && moodleUser.id !== user.id,
      )
    ) {
      incomingUser.login2 = incomingUser.person_snils ?? incomingUser.login;
    } else if (incomingUser.email) {
      incomingUser.login2 = incomingUser.email;
    }
  } else {
    incomingUser.login2 =
      incomingUser.phone ??
      incomingUser.email ??
      incomingUser.person_snils ??
      incomingUser.login;
  }

  if (user.username !== incomingUser.login2 && incomingUser.login2) {
    postData['users[0][username]'] = incomingUser.login2;
    needsUpdate = true;
  }

  const email2 = incomingUser.login2 + '@mail.ru';

  if (!incomingUser.email && user.email !== email2) {
    postData['users[0][email]'] = email2;
    needsUpdate = true;
  }

  if (user.phone1 !== incomingUser.phone && incomingUser.phone) {
    postData['users[0][phone1]'] = incomingUser.phone;
    needsUpdate = true;
  }
  if (user.description !== incomingUser.group_name && incomingUser.group_name) {
    postData['users[0][description]'] = incomingUser.group_name;
    needsUpdate = true;
  }
  if (user.department !== incomingUser.group_name && incomingUser.group_name) {
    postData['users[0][department]'] = incomingUser.group_name;
    needsUpdate = true;
  }
  if (user.idnumber !== incomingUser.bitrix_id && incomingUser.bitrix_id) {
    postData['users[0][idnumber]'] = incomingUser.bitrix_id;
    needsUpdate = true;
  }

  let customFieldCount = 0;
  if (user.college_group !== incomingUser.group_name && incomingUser.group_name) {
    postData['users[0][customfields][' + customFieldCount + '][type]'] = 'college_group';
    postData['users[0][customfields][' + customFieldCount + '][value]'] =
      incomingUser.group_name;
    customFieldCount++;
    needsUpdate = true;
  }
  if (user.info_login !== incomingUser.bitrix_id && incomingUser.bitrix_id) {
    postData['users[0][customfields][' + customFieldCount + '][type]'] = 'info_login';
    postData['users[0][customfields][' + customFieldCount + '][value]'] =
      incomingUser.bitrix_id;
    customFieldCount++;
    needsUpdate = true;
  }
  if (user.info_pass !== incomingUser.password && incomingUser.password) {
    postData['users[0][password]'] = incomingUser.password;
    postData['users[0][customfields][' + customFieldCount + '][type]'] = 'info_pass';
    postData['users[0][customfields][' + customFieldCount + '][value]'] =
      incomingUser.password;
    customFieldCount++;
    needsUpdate = true;
  }
  if (user.person_id !== incomingUser.person_id && incomingUser.person_id) {
    postData['users[0][customfields][' + customFieldCount + '][type]'] = 'person_id';
    postData['users[0][customfields][' + customFieldCount + '][value]'] =
      incomingUser.person_id;
    customFieldCount++;
    needsUpdate = true;
  }
  if (user.student_id !== incomingUser.student_id && incomingUser.student_id) {
    postData['users[0][customfields][' + customFieldCount + '][type]'] = 'student_id';
    postData['users[0][customfields][' + customFieldCount + '][value]'] =
      incomingUser.student_id;
    customFieldCount++;
    needsUpdate = true;
  }
  if (user.person_snils !== incomingUser.person_snils && incomingUser.person_snils) {
    postData['users[0][customfields][' + customFieldCount + '][type]'] = 'person_snils';
    postData['users[0][customfields][' + customFieldCount + '][value]'] =
      incomingUser.person_snils;
    customFieldCount++;
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

  if (!utils.isEmpty(postData) && Object.keys(postData).length) {
    //console.log(user.id, postData);
  }

  /* const now = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
  const lastAccess = new Date(user.lastaccess);

  if (now > lastAccess) {
    postData['users[0][password]'] = incomingUser.password;
    needsUpdate = true;
  } */

  if (needsUpdate) {
    postData.wstoken = token;
    postData.wsfunction = 'core_user_update_users';
    postData.moodlewsrestformat = 'json';
    postData['users[0][id]'] = user.id;

    const result = await moodleCurl(postData);

    if (result) {
      console.log(`moodle: update user ${user.id} ${user.username}`, postData);
      return true;
    }
  }

  return false;
};

const removeUserFromCohorts = async (userId) => {
  const cohortsData = {
    wstoken: token,
    wsfunction: 'core_cohort_get_cohorts',
    moodlewsrestformat: 'json',
  };

  const cohortIds = await moodleCurl(cohortsData);

  for (const cohortId of cohortIds) {
    const cohortData = {
      wstoken: token,
      wsfunction: 'core_cohort_delete_cohort_members',
      moodlewsrestformat: 'json',
      'members[0][userid]': userId,
      'members[0][cohortid]': cohortId.id,
    };

    //console.log(`Removing user ${userId} from cohort ${cohortId.id}`);
    await moodleCurl(cohortData);
  }
};

const syncMoodle = async (CUsers = []) => {
  if (utils.isArrayEmpty(CUsers)) return false;
  console.log('syncMoodle job started');

  const moodleUsers = await getUsers();
  if (utils.isArrayEmpty(moodleUsers)) return false;

  await utils.writeToJson('moodleUsers.json', moodleUsers);

  for (const incomingUser of CUsers) {
    let user = findUser(incomingUser, moodleUsers);

    if (is_student(incomingUser)) {
      if (user?.id) {
        //await updateUser(user, moodleUsers, formatCUser(incomingUser));
      } else {
        user = createUser(formatCUser(incomingUser), moodleUsers);
      }

      if (!user?.id) continue;

      setRole(user);

      let cohort = await searchCohort(incomingUser);

      if (utils.isEmpty(cohort)) {
        cohort = await createCohort(incomingUser);
      }

      const userids = await getCohortsMembers(cohort);

      if (Array.isArray(userids) && !userids.includes(user.id)) {
        await addUserToCohort(user, incomingUser, cohort);
      }

      const usersCourses = await getUserCourses(user);

      await updateGroupMembership(user, usersCourses);
    } else {
      if (user?.id && !user.suspended) {
        if (suspendUser(user.id)) console.log(`moodle: suspend user ${user.student_id}`);
      }

      if (user?.id) {
        // remove user from all groups
        //await removeUserFromCohorts(user.id);
      }
    }
  } //loop
  console.log('syncMoodle job finished');
};

module.exports = { syncMoodle };
