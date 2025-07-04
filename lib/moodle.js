const utils = require('./utils.js');
const dotenv = require('dotenv');
dotenv.config();

const dry_run = Number(process.env.DRY_RUN) > 0;

const token = process.env.MOODLE_TOKEN;
const LOGINID_1C = process.env.LOGINID_1C;
const MOODLE_PROD_HOST = process.env.MOODLE_PROD_HOST;
const MOODLE_TEST_HOST = process.env.MOODLE_TEST_HOST;
const STUDENT_MOODLE_ROLE_ID = 5;
const VIEWONLY_MOODLE_ROLE_ID = 15;

const GLOBAL_GROUPS = {
  OZ: 179,
  Z: 438,
  O: 178,
  LD: 173,
  SD: 174,
  F: 175,
  MO: 176,
  SP: 177,
  DPO: 206,
  STUDENTS: 444,
  TEACHERS: 445,
  FO: 450,
  FOZ: 451,
  FZ: 452,
  SDO: 453,
  SDOZ: 454,
  SDZ: 455,
  LDO: 456,
  LDOZ: 457,
  LDZ: 458,
  MOO: 459,
  MOOZ: 460,
  MOZ: 461,
  SPO: 462,
  SPOZ: 463,
  SPZ: 464,
};

const remapForms = {
  'Очно-заочная': 'OZ',
  Заочная: 'Z',
  Очная: 'O',
  Фармация: 'F',
  'Лечебное дело': 'LD',
  'Сестринское дело': 'SD',
  'Медицинская оптика': 'MO',
  'Стоматология профилактическая': 'SP',
};

/**
 * @param {Object} postfields - The data to be sent in the POST request.
 * @returns {Promise<Object | Array | boolean>} - A promise that resolves to the decoded JSON response or false if there's an error.
 */
const moodleCurl = async (postfields) => {
  /* const options = {
    socketTimeout: 60,
    streamTimeout: 120,
  }; */

  let url = '';

  url = `https://${MOODLE_PROD_HOST}/webservice/rest/server.php`;

  if (dry_run) {
    url = `http://${MOODLE_TEST_HOST}/webservice/rest/server.php`;
    console.log(postfields);
  }

  const requestBody = new URLSearchParams(postfields);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok) {
      const jsonResponse = await response.json();

      return jsonResponse;
    } else {
      console.error(
        `moodle: HTTP error! Status: ${response.status} ${response.statusText}`,
        postfields,
      );
      return false;
    }
  } catch (error) {
    console.error('moodle: Error:', error.message, postfields);
    return false;
  }
};

/**
 * remaps keys
 *
 * @param {Object} data
 * @returns {(false | Object)}
 */
const map1CUser = (data) => {
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

  result.lastName = lastName ? lastName : '';
  result.firstName = firstName ? firstName : '';
  result.middleName = middleName ? middleName : '';
  result.middleName = otherNames
    ? `${result.middleName} ${otherNames}`
    : result.middleName;

  return result;
};

/**
 * Gets array of objects
 *
 * @async
 * @returns {Promise<Array.<Object>>}
 */
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
 * get user in moodle
 *
 * @param {Object} incomingUser
 * @param {Object[]} moodleUsers
 * @returns {Object}
 */
const findUser = (incomingUser, moodleUsers) => {
  return moodleUsers.find(
    (moodleUser) => moodleUser.student_id === incomingUser.student_id,
  );
};

const findTeacher = (teacherUser, moodleUsers) => {
  return moodleUsers.find((moodleUser) => moodleUser.email === teacherUser.email);
};

const suspendUser = async (userId) => {
  const postData = {
    wstoken: token,
    wsfunction: 'core_user_update_users',
    moodlewsrestformat: 'json',
    'users[0][id]': userId,
    'users[0][suspended]': 1,
    'users[0][idnumber]': '',
    'users[0][customfields][0][type]': 'student_id',
    'users[0][customfields][0][value]': '',
    'users[0][customfields][1][type]': 'info_login',
    'users[0][customfields][1][value]': '',
    'users[0][customfields][2][type]': 'info_pass',
    'users[0][customfields][2][value]': '',
    'users[0][customfields][3][type]': 'person_snils',
    'users[0][customfields][3][value]': '',
  };

  try {
    const updateUserResult = await moodleCurl(postData);
    if (updateUserResult?.warnings[0]?.message) return false;
    console.log(`moodle: suspended user ${userId}`);
    return true;
  } catch (error) {
    console.error('moodle: Error in suspending Moodle user:', error);
    return false;
  }
};

/**
 * Search for a Moodle cohort based on user data.
 *
 * @param {string} group_name - College group for the query.
 * @returns {Promise<Object | boolean>} - A promise that resolves to the cohort ID or false if there's an error.
 */
const searchCohort = async (group_name = '') => {
  if (!group_name) return false;

  const searchCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_search_cohorts',
    moodlewsrestformat: 'json',
    query: group_name,
    'context[contextid]': 1,
  };

  try {
    const response = await moodleCurl(searchCohortData);

    if (response && Array.isArray(response?.cohorts) && response.cohorts.length > 0) {
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

const getCohortsMembers = async (cohortId) => {
  if (utils.isEmpty(cohortId)) return false;

  const searchCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_get_cohort_members',
    moodlewsrestformat: 'json',
    'cohortids[0]': cohortId,
  };

  try {
    const response = await moodleCurl(searchCohortData);

    if (Array.isArray(response[0]?.userids)) {
      return response[0].userids;
    } else {
      return false;
    }
  } catch (error) {
    console.error('moodle: error searching Moodle cohort:', error.message);
    return false;
  }
};

/**
 * Create a Moodle cohort based on user data.
 *
 * @param {string} group_name - College group for the cohort.
 * @returns {Promise<Object | boolean>} - A promise that resolves to the created cohort ID or false if there's an error.
 */
const createCohort = async (group_name = '') => {
  if (!group_name) return false;

  const createCohortData = {
    wstoken: token,
    wsfunction: 'core_cohort_create_cohorts',
    moodlewsrestformat: 'json',
    'cohorts[0][categorytype][type]': 'system',
    'cohorts[0][categorytype][value]': 'system',
    'cohorts[0][name]': group_name,
    'cohorts[0][idnumber]': group_name,
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
 * @param {number} userId - ID of the user.
 * @param {Object} incomingUser - User data.
 * @returns {Promise<boolean>} - A promise that resolves when the user is added to the cohort or rejects if there's an error.
 */
const handleGlobalCohortAdd = async (userId, incomingUser = {}) => {
  if (utils.isEmpty(userId) || utils.isEmpty(incomingUser)) return false;

  const addCohortMembersData = {
    wstoken: token,
    wsfunction: 'core_cohort_add_cohort_members',
    moodlewsrestformat: 'json',
  };

  const eduForm = remapForms[incomingUser.edu_form] || '';
  const speciality = remapForms[incomingUser.speciality_name] || '';
  const combinedForm = speciality + eduForm;

  const groups = [
    GLOBAL_GROUPS.STUDENTS,
    GLOBAL_GROUPS[eduForm],
    GLOBAL_GROUPS[speciality],
    GLOBAL_GROUPS[combinedForm],
  ];

  for (let i = 0; i < groups.length; i++) {
    const element = groups[i];
    if (element !== undefined && element !== null) {
      addCohortMembersData[`members[${i}][cohorttype][type]`] = 'id';
      addCohortMembersData[`members[${i}][cohorttype][value]`] = element;
      addCohortMembersData[`members[${i}][usertype][type]`] = 'id';
      addCohortMembersData[`members[${i}][usertype][value]`] = userId;
    }
  }

  try {
    const addCohortMembersResult = await moodleCurl(addCohortMembersData);

    if (!utils.isEmpty(addCohortMembersResult?.warnings)) {
      console.error(
        `moodle: error adding user ${userId} to global cohorts: ${addCohortMembersResult.warnings[0].message}`,
      );
      return false;
    } else {
      console.log(`moodle: user ${userId} added to global cohorts successfully.`);
      return true;
    }
  } catch (error) {
    console.error(
      `moodle: error adding user ${userId} to global cohorts:`,
      error.message,
    );
    return false;
  }
};

/**
 * Add a user to a Moodle cohort.
 *
 * @param {number} userId - ID of the user.
 * @param {number} cohortId - ID of the cohort to add the user to.
 * @returns {Promise<boolean>} - A promise that resolves when the user is added to the cohort or rejects if there's an error.
 */
const addUserToCohort = async (userId, cohortId) => {
  if (!userId || !cohortId) return false;

  const addCohortMembersData = {
    wstoken: token,
    wsfunction: 'core_cohort_add_cohort_members',
    moodlewsrestformat: 'json',
    'members[0][cohorttype][type]': 'id',
    'members[0][cohorttype][value]': cohortId,
    'members[0][usertype][type]': 'id',
    'members[0][usertype][value]': userId,
  };

  try {
    const result = await moodleCurl(addCohortMembersData);

    if (!utils.isEmpty(result?.warnings)) {
      console.error(
        `moodle: error adding user ${userId} to cohort: ${result.warnings[0].message}`,
      );
      return false;
    } else {
      console.log(`moodle: user ${userId} added to cohort ${cohortId} successfully.`);
      return true;
    }
  } catch (error) {
    console.error(`moodle: error adding user ${userId} to cohort:`, error.message);
    return false;
  }
};

/**
 * Get the courses for a user in Moodle.
 *
 * @param {number} userId - Moodle user ID.
 * @returns {Promise<false | Object[]>} - A promise that resolves to an array of user courses or rejects if there's an error.
 */
const getUserCourses = async (userId) => {
  const fields = {
    wstoken: token,
    wsfunction: 'core_enrol_get_users_courses',
    moodlewsrestformat: 'json',
    userid: userId,
  };

  try {
    const usersCourses = await moodleCurl(fields);

    return usersCourses;
  } catch (error) {
    console.error('moodle: error fetching user courses:', error.message);
    return false;
  }
};

const getAllCourses = async () => {
  const fields = {
    wstoken: token,
    wsfunction: 'core_course_get_courses',
    moodlewsrestformat: 'json',
  };

  try {
    const result = await moodleCurl(fields);
    return result;
  } catch (error) {
    console.error('moodle: error fetching user courses:', error.message);
    return false;
  }
};

/**
 * Fetches course details from Moodle by its short name.
 *
 * @param {string} name - The short name of the course to look up.
 * @returns {Promise<any>} The course object if found, otherwise false.
 */
const getCourseByName = async (name) => {
  const fields = {
    wstoken: token,
    wsfunction: 'core_course_search_courses',
    moodlewsrestformat: 'json',
    criterianame: 'search',
    criteriavalue: name,
  };

  try {
    const result = await moodleCurl(fields);
    return result;
  } catch (error) {
    console.error('moodle: error fetching user courses:', error.message);
    return false;
  }
};

const getCategory = async (categoryId) => {
  const fields = {
    wstoken: token,
    wsfunction: 'core_course_get_categories',
    moodlewsrestformat: 'json',
    'criteria[0][key]': 'id',
    'criteria[0][value]': categoryId,
  };

  try {
    const result = await moodleCurl(fields);
    return result[0];
  } catch (error) {
    console.error('moodle: error fetching user courses:', error.message);
    return false;
  }
};

/**
 * Fetches the credit book data for a given student and groups the disciplines by semester.
 *  {
    StudentID: '1952741789',
    Course: '1 курс',
    Semester: '2 семестр',
    Discipline: 'МДК.03.01 Здоровый человек и профилактика заболеваний в разные возрастные периоды',
    Teacher: '',
    Group: 'СДУ-1-24 С',
    Date: '',
    FormAT: 'Дифференцированный зачет',
    Estimation: ''
  },
 * @async
 * @function getCreditBook
 * @param {string} StudentID - The ID of the student for whom the credit book is to be fetched.
 * @returns {Promise<Object>} A promise that resolves to an object where each key is a semester
 *                            and the value is an array of grades for that semester. If an error
 *                            occurs or the response is not successful, it returns an empty array.
 */
const getCreditBook = async (StudentID) => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const data = {
    LoginID: LOGINID_1C,
    StudentID: StudentID,
  };

  try {
    const response = await fetch('https://umk.umedcollege.ru/umk/hs/ras/GetCreditBook', {
      ...options,
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const jsonResult = await response.json();
      return jsonResult;
    } else {
      return [];
    }
  } catch (error) {
    console.error('moodle: error fetching credit book:', error);
    return [];
  }
};

/**
 * Determines the course IDs to enroll a user based on their grade book disciplines and available courses.
 *
 * @param {Object} incomingUser - The user object containing user data.
 * @returns {Promise<any>} An array of course IDs that the user should be enrolled in.
 */
const courseIdsToEnroll = async (incomingUser) => {
  const disciplines = await getCreditBook(incomingUser.login);
  let validCourse = false;
  for (const discipline of disciplines) {
    const courses = await getCourseByName(discipline.Discipline);
    for (const course of courses.courses) {
      const category = await getCategory(course.categoryid);
      const parentCategory = await getCategory(category.parent);

      if (
        incomingUser.speciality_name === parentCategory?.name &&
        discipline.Semester === category?.name &&
        discipline.Discipline === course.fullname
      ) {
        console.log(parentCategory.name, category.name, course.fullname);
        validCourse = true;
      } else {
        validCourse = false;
      }
    }
    if (validCourse) {
      console.log(discipline);
    }
  }
  return true;
};

/**
 * Update the group membership for a user in Moodle courses.
 *
 * @param {Object} user - User data.
 * @param {Object[]} usersCourses - Array of Moodle courses.
 * @returns {Promise<boolean>} - A promise that resolves when the group membership is updated or rejects if there's an error.
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
    if (!Array.isArray(courseGroupsResult)) continue;

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

        const courseGroupUserids = courseGroupMembers[0]?.userids;

        if (Array.isArray(courseGroupUserids) && !courseGroupUserids.includes(user.id)) {
          const addCourseGroupMembersData = {
            wstoken: token,
            wsfunction: 'core_group_add_group_members',
            moodlewsrestformat: 'json',
            'members[0][groupid]': courseGroupId,
            'members[0][userid]': user.id,
          };

          const result = await moodleCurl(addCourseGroupMembersData);
          if (result) {
            console.log(
              `moodle: addCourseGroupMembers: ${user.username} Added to course group - courseid: ${course.id}, groupid: ${courseGroupId}`,
            );
          }
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

      if (courseGroupId) {
        console.log(
          `moodle: createCourseGroup: ${user.username} created course group: ${user.college_group}`,
        );
        const addCourseGroupMembersData = {
          wstoken: token,
          wsfunction: 'core_group_add_group_members',
          moodlewsrestformat: 'json',
          'members[0][groupid]': courseGroupId,
          'members[0][userid]': user.id,
        };

        const result = await moodleCurl(addCourseGroupMembersData);
        if (result) {
          console.log(
            `moodle: addCourseGroupMembers: ${user.username} Added to course group - courseid: ${course.id}, groupid: ${courseGroupId}`,
          );
        }
      }
    }
  }
  return true;
};

const updateGrades = async (user, usersCourses) => {
  if (utils.isEmpty(usersCourses[0]?.id)) return false;

  for (const course of usersCourses) {
    const paramsData = {
      wstoken: token,
      wsfunction: 'gradereport_user_get_grade_items',
      moodlewsrestformat: 'json',
      userid: user.id,
      courseid: course.id,
    };

    const userGrades = await moodleCurl(paramsData);

    if (!Array.isArray(userGrades?.usergrades)) continue;

    const gradeItems = userGrades.usergrades?.gradeitems;

    if (!Array.isArray(gradeItems)) continue;

    const finalTest = gradeItems.find(
      (el) => el.itemname === 'Итоговый тест' && el.itemmodule === 'quiz',
    );

    if (!finalTest?.id) continue;

    const grade = finalTest.grademin + 0.9 * (finalTest.grademax - finalTest.grademin);

    // logic to find
  }
  return true;
};

/**
 * Set a Moodle role for a user.
 *
 * @param {number} userId - User's Moodle ID.
 * @returns {Promise<boolean>} - A promise that resolves when the role is set or rejects if there's an error.
 */
const handleRole = async (userId, role) => {
  const params = {
    wstoken: token,
    wsfunction: 'core_role_assign_roles',
    moodlewsrestformat: 'json',
    'assignments[0][userid]': userId,
    'assignments[0][roleid]': role,
    'assignments[0][contextid]': 1,
  };

  try {
    const result = await moodleCurl(params);

    if (Array.isArray(result?.warnings)) {
      console.error(`moodle: Error assigning Student role: ${result.warnings}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('moodle: Error assigning Student role:', error.message);
    return false;
  }
};

/**
 * Add a user to Moodle.
 * @param {Array} moodleUsers - Array of modole users objects
 * @param {Object} incomingUser - object of incoming user
 * @returns {Promise<Object|boolean>} - A promise that resolves to the created user's Moodle ID or false if there's an error.
 */
const createUser = async (incomingUser = {}, moodleUsers = []) => {
  if (utils.isEmpty(moodleUsers) || utils.isEmpty(incomingUser)) return false;

  console.log(`moodle: creating user ${incomingUser.student_id}`);

  const paramsData = {
    wstoken: token,
    wsfunction: 'core_user_create_users',
    moodlewsrestformat: 'json',
    'users[0][username]': incomingUser?.phone
      ? incomingUser?.phone
      : incomingUser?.email
        ? incomingUser?.email
        : incomingUser?.person_snils
          ? incomingUser?.person_snils
          : incomingUser.login,
    'users[0][password]': incomingUser.password,
    'users[0][firstname]': incomingUser.firstName,
    'users[0][lastname]': incomingUser.lastName,
    'users[0][middlename]': incomingUser.otherNames
      ? `${incomingUser.middleName} ${incomingUser.otherNames}`
      : incomingUser.middleName,
    'users[0][email]': incomingUser?.email
      ? incomingUser?.email
      : (incomingUser?.person_snils ? incomingUser.person_snils : incomingUser.login) +
        '@mail.ru',
    'users[0][phone1]': incomingUser.phone || '',
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

  const phoneExist = moodleUsers.find(
    (moodleUser) => incomingUser?.phone && moodleUser.username === incomingUser.phone,
  );

  const emailExist = moodleUsers.find(
    (moodleUser) => incomingUser?.email && moodleUser.username === incomingUser.email,
  );

  if (phoneExist && !emailExist) {
    paramsData['users[0][username]'] = incomingUser?.email
      ? incomingUser.email
      : incomingUser.person_snils
        ? incomingUser.person_snils
        : incomingUser.login;
  }

  if (emailExist && phoneExist) {
    paramsData['users[0][username]'] = incomingUser.person_snils
      ? incomingUser.person_snils
      : incomingUser.login;
  }

  try {
    const createUserResult = await moodleCurl(paramsData);

    if (createUserResult && createUserResult[0] && createUserResult[0].id) {
      console.log(
        `moodle: User created successfully with Moodle ID: ${createUserResult[0].id}`,
        paramsData,
      );
      return createUserResult[0];
    } else {
      console.error('moodle: Error creating user: ', createUserResult?.debuginfo);
      return false;
    }
  } catch (error) {
    console.error('moodle: Error creating Moodle user:', error.message);
    return false;
  }
};

const createTeacher = async (incomingUser = {}, moodleUsers = []) => {
  if (utils.isEmpty(moodleUsers) || utils.isEmpty(incomingUser)) return false;

  const paramsData = {
    wstoken: token,
    wsfunction: 'core_user_create_users',
    moodlewsrestformat: 'json',
    'users[0][username]': incomingUser.phone,
    'users[0][password]': incomingUser.password,
    'users[0][firstname]': incomingUser.firstName,
    'users[0][lastname]': incomingUser.lastName,
    'users[0][middlename]': incomingUser.middleName,
    'users[0][email]': incomingUser.email,
    'users[0][phone1]': incomingUser.phone,
    'users[0][idnumber]': incomingUser.fullname,
    'users[0][city]': 'Челябинск',
    'users[0][country]': 'RU',
  };

  try {
    const createUserResult = await moodleCurl(paramsData);

    if (createUserResult && createUserResult[0] && createUserResult[0].id) {
      console.log(
        `moodle: teacher created successfully with Moodle ID: ${createUserResult[0].id}`,
        paramsData,
      );
      await handleRole(createUserResult[0].id, VIEWONLY_MOODLE_ROLE_ID);
      await addUserToCohort(createUserResult[0].id, GLOBAL_GROUPS.O);
      await addUserToCohort(createUserResult[0].id, GLOBAL_GROUPS.TEACHERS);
      return createUserResult[0];
    } else {
      console.error('moodle: Error creating teacher: ', createUserResult?.debuginfo);
      return false;
    }
  } catch (error) {
    console.error('moodle: Error creating Moodle teacher:', error.message);
    return false;
  }
};

const updateUser = async (user = {}, moodleUsers = [], incomingUser = {}) => {
  if (utils.isEmpty(user) || utils.isEmpty(incomingUser)) return false;

  let needsUpdate = false;
  const postData = {};

  if (user?.fullname !== incomingUser?.fullname) {
    postData['users[0][lastname]'] = incomingUser.lastName;
    postData['users[0][firstname]'] = incomingUser.firstName;
    postData['users[0][middlename]'] = incomingUser.otherNames
      ? `${incomingUser.middleName} ${incomingUser.otherNames}`
      : incomingUser.middleName;
    needsUpdate = true;
  }

  const phoneExist = moodleUsers.find(
    (moodleUser) =>
      incomingUser?.phone &&
      moodleUser.username === incomingUser.phone &&
      moodleUser.id !== user.id,
  );

  const emailExist = moodleUsers.find(
    (moodleUser) =>
      incomingUser?.email &&
      moodleUser.username === incomingUser.email &&
      moodleUser.id !== user.id,
  );

  incomingUser.loginToUpdate = incomingUser?.phone
    ? incomingUser.phone
    : incomingUser?.email
      ? incomingUser.email
      : incomingUser?.person_snils
        ? incomingUser.person_snils
        : incomingUser.login;

  incomingUser.emailToUpdate = incomingUser?.email
    ? incomingUser.email
    : incomingUser.loginToUpdate + '@mail.ru';

  if (phoneExist && !emailExist) {
    incomingUser.loginToUpdate = incomingUser?.email
      ? incomingUser.email
      : incomingUser?.person_snils
        ? incomingUser.person_snils
        : incomingUser.login;
  }

  if (emailExist && phoneExist) {
    incomingUser.loginToUpdate = incomingUser?.person_snils
      ? incomingUser.person_snils
      : incomingUser.login;
  }

  if (incomingUser.loginToUpdate && user.username !== incomingUser.loginToUpdate) {
    postData['users[0][username]'] = incomingUser.loginToUpdate;
    needsUpdate = true;
  }

  if (incomingUser.emailToUpdate && user.email !== incomingUser.emailToUpdate) {
    postData['users[0][email]'] = incomingUser.emailToUpdate;
    needsUpdate = true;
  }

  if (incomingUser.phone && user.phone1 !== incomingUser.phone) {
    postData['users[0][phone1]'] = incomingUser.phone;
    needsUpdate = true;
  }
  if (
    user?.description &&
    user.description !== incomingUser.group_name &&
    incomingUser.group_name
  ) {
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
    /* console.log(user.id, postData);
    return true; */
  }

  if (needsUpdate) {
    postData.wstoken = token;
    postData.wsfunction = 'core_user_update_users';
    postData.moodlewsrestformat = 'json';
    postData['users[0][id]'] = user.id;

    const result = await moodleCurl(postData);

    if (result) {
      console.log(`moodle: updated user ${user.id} ${user.username}`, postData);
      return true;
    }
  }

  return false;
};

const removeUserFromCohorts = async (userId, cohortIds) => {
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

const handleCohortRemove = async (incomingUser, cohortIds, userId) => {
  let userCohortIds = [];

  function removeIdsFromArray(cohortId) {
    const index = userCohortIds.indexOf(cohortId);

    if (index > -1) {
      userCohortIds.splice(index, 1);
    }
  }

  for (const cohort of cohortIds) {
    if (!cohort?.id) continue;

    if (Array.isArray(cohort.userIds) && cohort.userIds.includes(userId)) {
      userCohortIds.push(cohort.id);
    }
  }

  const cohort = await searchCohort(incomingUser?.group_name);

  removeIdsFromArray(cohort?.id);
  removeIdsFromArray(GLOBAL_GROUPS.STUDENTS);
  removeIdsFromArray(GLOBAL_GROUPS[remapForms[incomingUser.edu_form]]);
  removeIdsFromArray(GLOBAL_GROUPS[remapForms[incomingUser.speciality_name]]);
  const combinedForm = remapForms[incomingUser.speciality_name]
    ? remapForms[incomingUser.speciality_name]
    : '' + remapForms[incomingUser.edu_form]
      ? remapForms[incomingUser.edu_form]
      : '';
  removeIdsFromArray(GLOBAL_GROUPS[combinedForm]);

  if (Array.isArray(userCohortIds) && userCohortIds.length > 0) {
    for (const cohortId of userCohortIds) {
      const cohortData = {
        wstoken: token,
        wsfunction: 'core_cohort_delete_cohort_members',
        moodlewsrestformat: 'json',
        'members[0][userid]': userId,
        'members[0][cohortid]': cohortId,
      };

      const result = await moodleCurl(cohortData);
      if (result) {
        console.log(`moodle: removed user ${userId} from cohort ${cohortId}`);
      }
    }
  }
};

const handleCohortAdd = async (incomingUser, student) => {
  let cohort = await searchCohort(incomingUser?.group_name);

  if (!cohort?.id) {
    cohort = await createCohort(incomingUser?.group_name);
  }

  const userIds = await getCohortsMembers(cohort?.id);

  if (Array.isArray(userIds) && !userIds.includes(student.id)) {
    await addUserToCohort(student.id, cohort.id);
  }
};

/**
 * Description placeholder
 *
 * @async
 * @param {Object} student - moodle object
 * @returns {Promise<false|void>}
 */
const handleCourses = async (student) => {
  const userCourses = await getUserCourses(student.id);
  if (!Array.isArray(userCourses)) return false;

  await updateGroupMembership(student, userCourses);
};

const syncMoodle = async (CUsers = []) => {
  if (utils.isEmpty(CUsers)) return false;
  console.log('moodle: syncMoodle job started', dry_run);

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

  /* const CStudents_valid = CUsers.filter((user) => user.status === 'Студент');

  const CStudents_invalid = CUsers.filter((user) => user.status !== 'Студент'); */

  try {
    let moodleUsers = await getUsers();
    if (utils.isEmpty(moodleUsers)) return false;

    await utils.writeToJson('moodleUsers.json', moodleUsers);

    for (const incomingUser of CStudents_valid) {
      if (!incomingUser?.student_id) continue;

      const student = findUser(incomingUser, moodleUsers);

      if (student?.id) {
        await updateUser(student, moodleUsers, map1CUser(incomingUser));
      } else {
        await createUser(map1CUser(incomingUser), moodleUsers);
      }
    }

    moodleUsers = await getUsers();

    const cohortsData = {
      wstoken: token,
      wsfunction: 'core_cohort_get_cohorts',
      moodlewsrestformat: 'json',
    };
    let cohortIds = await moodleCurl(cohortsData);

    for (const i in cohortIds) {
      if (!cohortIds[i]?.id) continue;
      cohortIds[i].userIds = await getCohortsMembers(cohortIds[i].id);
    }

    for (const incomingUser of CStudents_valid) {
      const student = findUser(incomingUser, moodleUsers);
      if (!student?.id) continue;

      await handleRole(student.id, STUDENT_MOODLE_ROLE_ID);
      await handleCohortAdd(incomingUser, student);
      await handleGlobalCohortAdd(student.id, incomingUser);
      await handleCourses(student);
      await handleCohortRemove(incomingUser, cohortIds, student.id);
    }

    for (const incomingUser of CStudents_invalid) {
      const student = findUser(incomingUser, moodleUsers);
      if (!student?.id) continue;

      if (!student.suspended) {
        await suspendUser(student.id);
      }

      await removeUserFromCohorts(student.id, cohortIds);
    }

    moodleUsers = await getUsers();

    await utils.writeToJson('moodleUsers.json', moodleUsers);

    console.log('moodle: syncMoodle job finished');
    return true;
  } catch (error) {
    console.error('moodle: Error during syncMoodle job:', error);
    return false;
  }
};

module.exports = { syncMoodle, getUsers, findTeacher, createTeacher, suspendUser };

/* 
1. get all courses
2. get students creditbook data
3. get students courses
4. compare creditbook data and all courses by name
5. compare result to users courses and enroll where needed

*/
