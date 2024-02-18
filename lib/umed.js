const fetchData = async (token, group) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };
  console.log(`Fetching users with group id: ${group} umedcollege.ru`);
  const response = await fetch(`https://umedcollege.ru/api/users.php?group=${group}`, {
    method: 'GET',
    headers: headersList,
  });
  try {
    if (response.ok) {
      const data = await response.json();

      return data;
    }
  } catch (err) {
    console.log(err);
  }
};

const umedUsersModel = (data) => {
  return data.map((el) => {
    const {
      ID: umed_id,
      ACTIVE: umed_active,
      LOGIN: umed_login,
      LAST_NAME,
      NAME,
      SECOND_NAME,
      EMAIL: umed_email,
      XML_ID: umed_xml_id,
      UF_GUID: umed_guid,
      UF_PHONE: umed_phone,
      UF_PARENT_ID: umed_parent_id,
      UF_ID_BITRIX: umed_1c_login,
      UF_APP_PASSWORD: umed_1c_password,
      UF_COLLEDGE_GROUP: umed_group,
      UF_ID_MOODLE: umed_moodle_id,
      UF_ID_MOODLE_GROUP: umed_moodle_group,
    } = el;

    const umed_fullname = `${LAST_NAME} ${NAME} ${SECOND_NAME}`;

    return {
      umed_id,
      umed_active,
      umed_login,
      umed_fullname,
      umed_email,
      umed_xml_id,
      umed_guid,
      umed_phone,
      umed_parent_id,
      umed_1c_login,
      umed_1c_password,
      umed_group,
      umed_moodle_id,
      umed_moodle_group,
    };
  });
};

const getUmedUsers = async (token, group) => {
  const result = await fetchData(token, group);
  return umedUsersModel(result);
};

module.exports = { getUmedUsers };
