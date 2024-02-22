const utils = require('./utils.js');

const fetchData = async (token, id) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const fetchUrl = 'https://umedcollege.ru/api/users/';

  console.log(`Fetching users umedcollege.ru ${fetchUrl}`);
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

const putData = async (token, id, data) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const body = JSON.stringify(data);

  const fetchUrl = 'https://umedcollege.ru/api/users/' + id;

  console.log(`Creating/updating users umedcollege.ru ${fetchUrl}`);
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

const umedUsersModel = (data = []) => {
  return data.map((el) => {
    const {
      ID: umed_id,
      ACTIVE: umed_active,
      LOGIN: umed_login,
      PHONE_NUMBER: umed_phone,
      LAST_NAME: umed_lastname,
      NAME: umed_firstname,
      SECOND_NAME: umed_secondname,
      EMAIL: umed_email,
      XML_ID: umed_xml_id,
      GROUPS_ID: umed_group,
      UF_GUID: student_id,
      UF_PHONE: umed_uf_phone,
      UF_PARENT_ID: umed_parent_id,
      UF_ID_BITRIX: umed_1c_login,
      UF_APP_PASSWORD: umed_1c_password,
      UF_COLLEDGE_GROUP: umed_college_group,
      UF_ID_MOODLE: umed_moodle_id,
      UF_ID_MOODLE_GROUP: umed_moodle_group,
      LAST_ACTIVITY_DATE,
      DATE_REGISTER,
      TIMESTAMP_X,
    } = el;

    let umed_fullname =
      (umed_lastname ? umed_lastname + ' ' : '') +
      (umed_firstname ? umed_firstname + ' ' : '') +
      (umed_secondname ? umed_secondname : '');

    umed_fullname = umed_fullname.trim();

    const umed_date_login = new Date(LAST_ACTIVITY_DATE).toISOString();
    const umed_date_create = utils.stringToISODate(DATE_REGISTER);
    const umed_date_update = utils.stringToISODate(TIMESTAMP_X);

    return {
      umed_id,
      student_id,
      umed_active,
      umed_date_login,
      umed_date_create,
      umed_date_update,
      umed_login,
      umed_phone,
      umed_fullname,
      umed_lastname,
      umed_firstname,
      umed_secondname,
      umed_email,
      umed_xml_id,
      umed_group,
      umed_uf_phone,
      umed_parent_id,
      umed_1c_login,
      umed_1c_password,
      umed_college_group,
      umed_moodle_id,
      umed_moodle_group,
    };
  });
};

const c1ToStudentsModel = (data) => {
  return data.map((item) => {
    const { student_id, bitrix_id, fullname, login, password, phone, email, group_name } =
      item;

    const [lastName, firstName, secondName] = fullname.split(' ');

    return {
      ACTIVE: 'Y',
      LOGIN: phone,
      PASSWORD: password,
      PHONE_NUMBER: phone,
      UF_PHONE: phone,
      LAST_NAME: lastName,
      NAME: firstName,
      SECOND_NAME: secondName,
      EMAIL: email,
      XML_ID: bitrix_id,
      GROUPS_ID: [9],
      UF_GUID: student_id,
      UF_ID_BITRIX: login,
      UF_APP_PASSWORD: password,
      UF_COLLEDGE_GROUP: group_name,
    };
  });
};

const c1ToParentsModel = (data) => {
  return data.map((item) => {
    const {
      fullname,
      customer_name,
      login,
      password,
      phone,
      customer_email,
      customer_phone,
      group_name,
      student_id,
    } = item;

    const [lastName, firstName, secondName] = customer_name.split(' ');

    return {
      ACTIVE: 'Y',
      LOGIN: customer_phone,
      PASSWORD: password,
      PHONE_NUMBER: customer_phone,
      UF_PHONE: phone,
      LAST_NAME: lastName,
      NAME: firstName,
      SECOND_NAME: secondName,
      EMAIL: customer_email,
      GROUPS_ID: [8],
      UF_PARENT_ID: student_id,
      UF_PARENT_STUDENT_PHONE: phone,
      UF_PARENT_STUDENT_NAME: fullname,
      UF_ID_BITRIX: login,
      UF_APP_PASSWORD: password,
      UF_COLLEDGE_GROUP: group_name,
    };
  });
};

const getUmedUsers = async (token) => {
  const result = await fetchData(token);
  return umedUsersModel(result);
};

const getUmedStudents = async (token) => {
  const result = await fetchData(token);
  return umedUsersModel(result).filter((el) => el.umed_group.includes('9'));
};

const getUmedAbiturients = async (token) => {
  const result = await fetchData(token);
  return umedUsersModel(result).filter((el) => el.umed_group.includes('8'));
};

function is_student(user) {
  return user.status === 'Студент' && Object.hasOwn(user, 'phone');
}
function is_parent(user) {
  return (
    user.status === 'Студент' &&
    user.customer_is_org === 'false' &&
    Object.hasOwn(user, 'customer_name') &&
    Object.hasOwn(user, 'customer_phone') &&
    user.phone !== user.customer_phone
  );
}

function remove_student(user) {
  return user.status !== 'Студент' && user.status !== 'ВАкадемическомОтпуске';
}

function studentsToRemove(c1Users, umedUsers) {
  return umedUsers.filter((user) =>
    c1Users.some(
      (c1User) => remove_student(c1User) && c1User.student_id === user.student_id,
    ),
  );
}

function parentsToRemove(c1Users, umedUsers) {
  return umedUsers.filter((user) =>
    c1Users.some(
      (c1User) =>
        remove_student(c1User) &&
        c1User.login === user.umed_1c_login &&
        c1User.customer_name === user.umed_fullname &&
        c1User.customer_phone === user.umed_phone,
    ),
  );
}

function studentsToSync(c1Users, umedUsers) {
  return c1Users.filter((c1User) => {
    const foundUser = umedUsers.find((user) => c1User.phone === user.umed_phone);

    return is_student(c1User) && !foundUser;
  });
}

function parentsToSync(c1Users, umedUsers) {
  return c1Users.filter((c1User) => {
    const foundUser = umedUsers.find(
      (user) =>
        c1User.customer_name === user.umed_fullname &&
        c1User.customer_phone === user.umed_phone,
    );

    return is_parent(c1User) && !foundUser;
  });
}

const syncUmed = async (token, c1Users) => {
  const umedUsers = umedUsersModel(await fetchData(token));
  await utils.writeToJson('umedUsers.json', umedUsers);

  const usersToRemove = studentsToRemove(c1Users, umedUsers);

  const usersToRemove2 = parentsToRemove(c1Users, umedUsers);

  const usersToSync = c1ToStudentsModel(studentsToSync(c1Users, umedUsers));

  const usersToSync2 = c1ToParentsModel(parentsToSync(c1Users, umedUsers));

  //const testUser = await fetchData(token, 2269);

  //const testPost = await putData(token, 2269, { LAST_NAME: 'Руслан1' });
  //console.log(testPost);

  await utils.writeToJson('usersToSync.json', usersToSync);

  await utils.writeToJson('usersToRemove.json', usersToRemove);

  await utils.writeToJson('parentsToSync.json', usersToSync2);

  await utils.writeToJson('parentsToRemove.json', usersToRemove2);
  console.log(`Users to sync Umed: ${usersToSync.length}`);
  console.log(`Users to remove Umed: ${usersToRemove.length}`);
  console.log(`Parents to sync Umed: ${usersToSync2.length}`);
  console.log(`Parents to remove Umed: ${usersToRemove2.length}`);
};

module.exports = { syncUmed, getUmedUsers, getUmedStudents, getUmedAbiturients };
