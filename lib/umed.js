const { match } = require('assert');
const utils = require('./utils.js');

const fetchData = async (token, id) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const fetchUrl = 'http://192.168.0.10/api/users/';

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

  const fetchUrl = 'http://192.168.0.10/api/users/' + id;

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

const UUsersModel = (data = []) => {
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
      UF_PERSON_ID: person_id,
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
      person_id,
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

const formatUUsers = (data = []) => {
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

const CToStudentsModel = (data) => {
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
    } = item;

    const result = {
      LOGIN: phone,
      PASSWORD: password,
      PHONE_NUMBER: phone,
      EMAIL: email,
      XML_ID: bitrix_id,
      GROUPS_ID: ['5', '9', '13', '2'],
      UF_PHONE: phone,
      UF_PERSON_ID: person_id,
      UF_GUID: student_id,
      UF_ID_BITRIX: login,
      UF_APP_PASSWORD: password,
      UF_COLLEDGE_GROUP: group_name,
    };

    if (fullname) {
      const [lastName, firstName, secondName] = fullname.split(' ');
      result.LAST_NAME = lastName;
      result.NAME = firstName;
      result.SECOND_NAME = secondName;
    }

    return result;
  });
};

const CToParentsModel = (data) => {
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

    const result = {
      LOGIN: customer_phone,
      PASSWORD: password,
      PHONE_NUMBER: customer_phone,
      EMAIL: customer_email,
      GROUPS_ID: ['5', '8', '13', '2'],
      UF_PHONE: phone,
      UF_PARENT_ID: student_id,
      UF_PARENT_STUDENT_PHONE: phone,
      UF_PARENT_STUDENT_NAME: fullname,
      UF_ID_BITRIX: login,
      UF_APP_PASSWORD: password,
      UF_COLLEDGE_GROUP: group_name,
    };

    if (customer_name) {
      const [lastName, firstName, secondName] = customer_name.split(' ');
      result.LAST_NAME = lastName;
      result.NAME = firstName;
      result.SECOND_NAME = secondName;
    }

    return result;
  });
};

const getUmedStudents = async (token) => {
  const result = await fetchData(token);
  return UUsersModel(result).filter((el) => el.umed_group.includes('9'));
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

function remove_student(CUser) {
  return CUser.status !== 'Студент' && CUser.status !== 'ВАкадемическомОтпуске';
}

function studentsToRemove(CUsers, UUsers) {
  const result = UUsers.filter((UUser) =>
    CUsers.find((CUser) => remove_student(CUser) && CUser.student_id === UUser.UF_GUID),
  );

  return result;
}

function studentsToCreate(CUsers, UUsers) {
  const result = CUsers.filter((CUser) => {
    const foundUser = UUsers.find((UUser) => CUser.phone === UUser.PHONE_NUMBER);

    return is_student(CUser) && !foundUser;
  });

  return CToStudentsModel(result);
}

function studentsToUpdate(token, CUsersRaw, UUsers) {
  const isStudent = (user) => is_student(user);
  const sortAndStringify = (arr) => arr.sort().toString();
  const reverseSortAndStringify = (str) =>
    str
      .split(',')
      .sort((a, b) => b.localeCompare(a))
      .toString();

  const CUsers = CToStudentsModel(CUsersRaw.filter(isStudent));

  const result = UUsers.map((UUser) => {
    const matchingCUser = CUsers.find((CUser) => UUser.UF_GUID === CUser.UF_GUID);

    if (matchingCUser) {
      const values = {};
      for (const key in matchingCUser) {
        const isGroupsID = key === 'GROUPS_ID';

        if (Array.isArray(matchingCUser[key]) && isGroupsID) {
          matchingCUser[key] = sortAndStringify(matchingCUser[key]);
        }

        if (Array.isArray(UUser[key]) && isGroupsID) {
          UUser[key] = sortAndStringify(UUser[key]);
        }

        if (
          matchingCUser[key] &&
          matchingCUser[key] !== UUser[key] &&
          key !== 'PASSWORD'
        ) {
          values['ID'] = UUser['ID'];
          values[key] = matchingCUser[key];
        }
      }
      return values;
    }
  }).filter(Boolean); // Remove undefined values (when matchingCUser is falsy)

  result.forEach(async ({ ID, ...el }) => {
    if (!ID) return false;
    await utils.delay(100);
    await putData(token, ID, el);
  });

  return result;
}

function parentsToRemove(CUsers, UUsers) {
  const result = UUsers.filter((UUser) =>
    CUsers.some(
      (CUser) =>
        remove_student(CUser) &&
        CUser.login === UUser.UF_ID_BITRIX &&
        CUser.customer_name === UUser.FULL_NAME &&
        CUser.customer_phone === UUser.PHONE_NUMBER,
    ),
  );

  return result;
}

function parentsToCreate(CUsers, UUsers) {
  const result = CUsers.filter((CUser) => {
    const foundUser = UUsers.find(
      (UUser) =>
        CUser.customer_name === UUser.FULL_NAME &&
        CUser.customer_phone === UUser.PHONE_NUMBER,
    );

    return is_parent(CUser) && !foundUser;
  });

  return CToParentsModel(result);
}

const syncUmed = async (token, CUsers) => {
  const UUsers = formatUUsers(await fetchData(token));

  await utils.writeToJson('UUsers.json', UUsers);

  const studentsRemoveResult = studentsToRemove(CUsers, UUsers);
  const studentsCreateResult = studentsToCreate(CUsers, UUsers);

  const parentsRemoveResult = parentsToRemove(CUsers, UUsers);
  const parentsCreateResult = parentsToCreate(CUsers, UUsers);

  const studentsUpdateResult = studentsToUpdate(token, CUsers, UUsers);

  await utils.writeToJson('studentsRemoveResult.json', studentsRemoveResult);
  await utils.writeToJson('studentsCreateResult.json', studentsCreateResult);
  await utils.writeToJson('studentsUpdateResult.json', studentsUpdateResult);

  await utils.writeToJson('parentsRemoveResult.json', parentsRemoveResult);
  await utils.writeToJson('parentsCreateResult.json', parentsCreateResult);

  console.log(`studentsRemoveResult: ${studentsRemoveResult.length}`);
  console.log(`studentsCreateResult: ${studentsCreateResult.length}`);
  console.log(`studentsUpdateResult: ${studentsUpdateResult.length}`);

  console.log(`parentsRemoveResult: ${parentsRemoveResult.length}`);
  console.log(`parentsCreateResult: ${parentsCreateResult.length}`);
};

module.exports = { syncUmed };
