const utils = require('./utils.js');

let token;

const fetchData = async (id) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const fetchUrl = 'https://umedcollege.ru/api/users/';

  const response = await fetch(id ? fetchUrl + id : fetchUrl, {
    method: 'GET',
    headers: headersList,
  });

  try {
    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      console.log(await response.text());
    }
  } catch (err) {
    console.log(err);
  }
};

const putData = async (id, data) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const body = JSON.stringify(data);

  const fetchUrl = 'https://umedcollege.ru/api/users/' + id;

  const response = await fetch(fetchUrl, {
    method: 'PUT',
    headers: headersList,
    body: body,
  });

  try {
    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      console.log(await response.text());
    }
  } catch (err) {
    console.log(err);
  }
};

const postData = async (data) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const body = JSON.stringify(data);

  const fetchUrl = 'https://umedcollege.ru/api/users/';

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers: headersList,
    body: body,
  });

  try {
    if (response.ok) {
      const data = await response.json();

      return data;
    } else {
      console.log(await response.text());
    }
  } catch (err) {
    console.log(err);
  }
};

const formatUUsers = (data = []) => {
  if (!data) return false;
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
      DATE_REGISTER,
      TIMESTAMP_X,
    } = el;

    const fullname = `${LAST_NAME ?? ' '} ${NAME ?? ' '} ${SECOND_NAME ?? ' '}`.trim();

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
      DATE_REGISTER,
      TIMESTAMP_X,
    };
  });
};

const formatCUsers = (data = []) => {
  if (!data) return false;
  return data.map((item) => {
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
      customer_name,
      customer_phone,
    } = item;

    const result = {
      LOGIN: phone,
      PHONE_NUMBER: phone,
      EMAIL: email,
      XML_ID: bitrix_id,
      UF_PHONE: phone,
      UF_PERSON_ID: person_id,
      UF_GUID: student_id,
      UF_ID_BITRIX: login,
      UF_APP_PASSWORD: password,
      UF_COLLEDGE_GROUP: group_name,
      UF_PARENT_NAME: customer_name,
      UF_PARENT_PHONE: customer_phone,
    };

    if (fullname) {
      const [lastName, firstName, secondName] = fullname.split(' ');
      result.LAST_NAME = lastName;
      result.NAME = firstName;
      result.SECOND_NAME = secondName;
    } else {
      return [];
    }

    return result;
  });
};

function is_student(CUser) {
  return CUser.status === 'Студент' && CUser.phone;
}

function is_parent(CUser) {
  return (
    CUser.status === 'Студент' &&
    CUser.customer_is_org === 'false' &&
    CUser.customer_name &&
    CUser.customer_phone &&
    CUser.phone !== CUser.customer_phone
  );
}

async function updateUser(user, incominUser) {
  const sortAndStringify = (arr) => arr.sort().toString();
  const reverseSortAndStringify = (str) =>
    str
      .split(',')
      .sort((a, b) => b.localeCompare(a))
      .toString();

  if (user && incominUser) {
    const values = {};
    for (const key in user) {
      const isGroupsID = key === 'GROUPS_ID';

      if (Array.isArray(user[key]) && isGroupsID) {
        user[key] = sortAndStringify(user[key]);
      }

      if (Array.isArray(user[key]) && isGroupsID) {
        user[key] = sortAndStringify(user[key]);
      }

      if (user[key] && user[key] !== user[key] && key !== 'PASSWORD') {
        values['ID'] = user['ID'];
        values[key] = user[key];
      }
    }
    if (values['GROUPS_ID']) {
      values['GROUPS_ID'] = reverseSortAndStringify(values['GROUPS_ID']);
    }
  }

  const result = [];
  for (const user of usersList) {
    if (!user['ID']) continue;
    const id = user['ID'];
    delete user['ID'];

    await utils.delay(100);
    let response;
    try {
      response = await putData(token, id, user);
      result.push(response);
    } catch (err) {
      console.error(err);
    }
  }

  return result;
}

/**
 * Validate fields
 * @date 2/24/2024 - 5:19:31 PM
 * @param {Array} data array
 */
const validateFields = (data = {}) => {
  if (!data && !data.phone && !data.bitrix_id && !data.password && !data.status)
    return false;

  return true;
};

const findUmedUser = (incomingUser, umedUsers) => {
  const user1 = umedUsers.find(
    (umedUser) =>
      umedUser.UF_GUID === incomingUser.student_id && umedUser['GROUPS_ID'].includes('9'),
  );

  const user2 = umedUsers.find(
    (umedUser) =>
      umedUser.PHONE_NUMBER === incomingUser.phone && umedUser['GROUPS_ID'].includes('8'),
  );

  if (user1 && user2 && user1['ID'] && user2['ID']) {
    user2['ACTIVE'] = 'N';
    //postData(user2);
  }

  if (user1 && user1['ID']) {
    return user1;
  } else if (user2 && user2['ID']) {
    return user2;
  } else {
    return {};
  }
};

const findParentUser = (incomingUser, umedUsers) => {
  const findParent = (condition) => umedUsers.find((umedUser) => condition(umedUser));

  return (
    findParent(
      (user) =>
        user.UF_PARENT_ID === incomingUser.bitrix_id && user['GROUPS_ID'].includes('18'),
    ) ||
    findParent(
      (user) =>
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user['GROUPS_ID'].includes('18'),
    ) ||
    findParent(
      (user) =>
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user['GROUPS_ID'].includes('8'),
    ) ||
    {}
  );
};

/**
 * Sync umed
 * @date 2/24/2024 - 5:41:12 PM
 * @param {String} access_token string
 * @param {Array} CUsers array
 * @async
 */
const syncUmed = async (access_token = '', CUsers = []) => {
  if (!access_token && !CUsers) return false;
  console.log('syncUmed job started');
  token = access_token;

  const umedUsers = formatUUsers(await fetchData());
  await utils.writeToJson('umedUsers.json', umedUsers);

  for (const incomingUser of CUsers) {
    if (!is_student(incomingUser) && !is_parent(incomingUser)) continue;

    const user = findUmedUser(incomingUser, umedUsers);

    if (is_student(incomingUser)) {
      if (user && user['ID']) {
        user['GROUP_ID'] = [5, 9, 13];
        //console.log(`update user ${user.PHONE_NUMBER}`);
      } else {
        user['GROUP_ID'] = [5, 9, 13];
        console.log(`create user ${incomingUser.phone}`);
      }
    } else if (user && user['ID']) {
      user['ACTIVE'] = 'N';
      console.log(`remove user ${user['ID']} ${user['FULL_NAME']}`);
      //await postData(user);
    }

    const parent = findParentUser(incomingUser, umedUsers);

    if (is_parent(incomingUser)) {
      if (parent && parent['ID']) {
        parent['GROUP_ID'] = [5, 18, 13];
        //console.log(`update parent ${parent.PHONE_NUMBER}`);
      } else {
        parent['GROUP_ID'] = [5, 18, 13];
        console.log(`create parent ${incomingUser.customer_phone}`);
      }
    } else if (parent && parent['ID']) {
      parent['ACTIVE'] = 'N';
      console.log(`remove parent ${parent['ID']} ${parent['FULL_NAME']}`);
      //await postData(parent);
    }
  } // loop
  console.log('syncUmed job finished');
};

module.exports = { syncUmed };
