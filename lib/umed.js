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

const umedUsersModel = (data = []) => {
  return data.map((el) => {
    const {
      ID: umed_id,
      ACTIVE: umed_active,
      LOGIN: umed_login,
      LAST_NAME: umed_lastname,
      NAME: umed_firstname,
      SECOND_NAME: umed_secondname,
      EMAIL: umed_email,
      XML_ID: umed_xml_id,
      GROUPS_ID: umed_group,
      UF_GUID: umed_guid,
      UF_PHONE: umed_phone,
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

    function parseDate(date) {
      if (!data) return null;
      const [datePart, timePart] = date.split(' ');
      const [day, month, year] = datePart.split('.');
      const [hours, minutes, seconds] = timePart.split(':');
      return new Date(year, month - 1, day, hours, minutes, seconds).toISOString();
    }

    const umed_fullname = `${umed_lastname} ${umed_firstname} ${umed_secondname}`;

    const umed_date_login = new Date(LAST_ACTIVITY_DATE).toISOString();
    const umed_date_create = parseDate(DATE_REGISTER);
    const umed_date_update = parseDate(TIMESTAMP_X);
    //const umed_group_student = el.GROUPS_ID.includes('9');

    return {
      umed_id,
      umed_active,
      //umed_group_student,
      umed_date_login,
      umed_date_create,
      umed_date_update,
      umed_login,
      umed_fullname,
      umed_lastname,
      umed_firstname,
      umed_secondname,
      umed_email,
      umed_xml_id,
      umed_group,
      umed_guid,
      umed_phone,
      umed_parent_id,
      umed_1c_login,
      umed_1c_password,
      umed_college_group,
      umed_moodle_id,
      umed_moodle_group,
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

module.exports = { getUmedUsers, getUmedStudents, getUmedAbiturients };
