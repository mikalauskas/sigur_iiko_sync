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
  if (utils.isObjectEmpty(data)) return false;
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

const postData = async (data = {}) => {
  if (utils.isObjectEmpty(data)) return false;

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
  if (!Array.isArray(data) || utils.isArrayEmpty(data)) return false;
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
    result.LAST_NAME = lastName;
    result.NAME = firstName;
    result.SECOND_NAME = secondName;
  } else {
    return [];
  }

  if (customer_name) {
    const [parent_lastName, parent_firstName, parent_secondName] =
      customer_name.split(' ');
    result.PARENT_LAST_NAME = parent_lastName;
    result.PARENT_NAME = parent_firstName;
    result.PARENT_SECOND_NAME = parent_secondName;
  } else {
    return [];
  }

  return result;
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

function compareGroups(group1, group2) {
  return (
    group1.sort().toString() ===
    group2
      .map(Number)
      .sort()
      .filter((num) => num !== 2)
      .toString()
  );
}

async function updateUser(user = {}, incomingUser = {}) {
  if (utils.isObjectEmpty(user) || utils.isObjectEmpty(incomingUser)) return false;

  const userFormatted = {
    ACTIVE: 'Y',
    LOGIN: incomingUser['PHONE_NUMBER'],
    PHONE_NUMBER: incomingUser['PHONE_NUMBER'],
    LAST_NAME: incomingUser['LAST_NAME'],
    NAME: incomingUser['NAME'],
    SECOND_NAME: incomingUser['SECOND_NAME'],
    EMAIL: incomingUser['EMAIL'],
    XML_ID: incomingUser['UF_ID_BITRIX'],
    UF_PERSON_ID: incomingUser['UF_PERSON_ID'],
    UF_GUID: incomingUser['UF_GUID'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
    UF_PARENT_ID: incomingUser['UF_PARENT_ID'],
  };

  const matchedProps = {};
  for (const key in user) {
    if (incomingUser[key] && user[key] !== incomingUser[key]) {
      matchedProps[key] = incomingUser[key];
    }
  }

  if (!compareGroups([5, 9, 13], user['GROUPS_ID'])) matchedProps.GROUP_ID = [5, 9, 13];

  if (!utils.isObjectEmpty(matchedProps) && Object.keys(matchedProps).length > 4)
    console.log(`update user ${user.ID} ${user.PHONE_NUMBER}`, matchedProps);

  return false;
}

async function updateParent(parent = {}, user = {}, incomingUser = {}) {
  if (utils.isObjectEmpty(parent) || utils.isObjectEmpty(incomingUser)) return false;

  const parentFormatted = {
    ACTIVE: 'Y',
    LOGIN: incomingUser['UF_PARENT_PHONE'],
    PHONE_NUMBER: incomingUser['UF_PARENT_PHONE'],
    LAST_NAME: incomingUser['PARENT_LAST_NAME'],
    NAME: incomingUser['PARENT_NAME'],
    SECOND_NAME: incomingUser['PARENT_SECOND_NAME'],
    EMAIL: incomingUser['UF_PARENT_EMAIL'],
    UF_PHONE: incomingUser['PHONE_NUMBER'],
    UF_ID_BITRIX: incomingUser['UF_ID_BITRIX'],
    UF_APP_PASSWORD: incomingUser['UF_APP_PASSWORD'],
    UF_COLLEDGE_GROUP: incomingUser['UF_COLLEDGE_GROUP'],
    UF_PARENT_ID: incomingUser['UF_PARENT_ID'],
    UF_PARENT_STUDENT_ID: user['UF_PERSON_ID'],
    UF_PARENT_STUDENT_PHONE: user['PHONE_NUMBER'],
    UF_PARENT_STUDENT_NAME: user['FULL_NAME'],
  };

  const matchedProps = {};
  for (const key in parent) {
    if (parentFormatted[key] && parent[key] !== parentFormatted[key]) {
      matchedProps[key] = parentFormatted[key];
    }
  }

  if (!compareGroups([5, 18, 13], user['GROUPS_ID'])) matchedProps.GROUP_ID = [5, 18, 13];

  if (!utils.isObjectEmpty(matchedProps) && Object.keys(matchedProps).length > 4)
    console.log(
      `update parent ${parent.ID} ${parent.PHONE_NUMBER} of user ${user.ID} ${user.PHONE_NUMBER}`,
      matchedProps,
    );

  return false;
}

const findUmedUser = (incomingUser, umedUsers) => {
  const user1 = umedUsers.find(
    (umedUser) =>
      umedUser.PHONE_NUMBER === incomingUser.phone && umedUser['GROUPS_ID'].includes('8'),
  );

  const user2 = umedUsers.find(
    (umedUser) =>
      umedUser.UF_GUID === incomingUser.student_id && umedUser['GROUPS_ID'].includes('9'),
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
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user['GROUPS_ID'].includes('8'),
    ) ||
    findParent(
      (user) =>
        user.PHONE_NUMBER === incomingUser.customer_phone &&
        user['GROUPS_ID'].includes('18'),
    ) ||
    findParent(
      (user) =>
        user.UF_PARENT_ID === incomingUser.UF_PARENT_ID &&
        user['GROUPS_ID'].includes('18'),
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
  if (!access_token && utils.isArrayEmpty(CUsers)) return false;
  console.log('syncUmed job started');
  token = access_token;

  const umedUsers = formatUUsers(await fetchData());
  if (!umedUsers) return false;
  await utils.writeToJson('umedUsers.json', umedUsers);

  for (const incomingUser of CUsers) {
    if (!is_student(incomingUser)) continue;

    await utils.delay(50);
    const user = findUmedUser(incomingUser, umedUsers);

    if (is_student(incomingUser)) {
      if (user && user['ID']) {
        await updateUser(user, formatCUser(incomingUser));
      } else {
        user['GROUP_ID'] = [5, 9, 13];
        console.log(`create user ${incomingUser.phone}`);
      }
    } else {
      if (user && user['ID']) {
        user['ACTIVE'] = 'N';
        console.log(`remove user ${user['ID']} ${user['FULL_NAME']}`);
        //await postData(user);
      }
    }

    if (!is_parent(incomingUser)) continue;
    await utils.delay(50);
    const parent = findParentUser(incomingUser, umedUsers);

    if (is_parent(incomingUser)) {
      if (parent && parent['ID']) {
        await updateParent(parent, user, formatCUser(incomingUser));
      } else {
        parent['GROUP_ID'] = [5, 18, 13];
        console.log(`create parent ${incomingUser.customer_phone}`);
      }
    } else {
      if (parent && parent['ID']) {
        parent['ACTIVE'] = 'N';
        console.log(`remove parent ${parent['ID']} ${parent['FULL_NAME']}`);
        //await postData(parent);
      }
    }
  } // loop
  console.log('syncUmed job finished');
};

module.exports = { syncUmed };
