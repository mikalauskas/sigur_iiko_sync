const Sigur = require('./lib/sigur.js');
const syncIiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const { syncUmed } = require('./lib/umed.js');
const { syncMoodle } = require('./lib/moodle.js');
const { create1cJsonData } = require('./lib/1c.js');
const syncTeachers = require('./lib/googleSheets.js');

require('log-timestamp');
dotenv.config();

const syncSigurUsers = async (CUsers) => {
  const sigur = new Sigur();
  const sigurUsers = await sigur.getPersonal();

  const sigurStudents = sigurUsers.map((el) => {
    el.NAME = el.NAME.replace(/\u00A0/g, ' ');
    el.NAME = utils.sanitizeFullName(el.NAME);
    if (el.CODEKEY?.data) {
      el.CODEKEY = utils
        .buf2hex(Buffer.from(el.CODEKEY.data))
        .slice(-8)
        .toUpperCase()
        .padStart(14, '0');
    }

    return {
      sigur_id: el.ID,
      sigur_group_id: el.PARENT_ID,
      sigur_pos: el.POS,
      sigur_fullname: el.NAME,
      sigur_key: el.CODEKEY,
      sigur_person_id: el.TABID,
      sigur_last_active: el.LOCATIONACT,
    };
  });
  await utils.writeToJsonBOM('sigurStudents.json', sigurStudents);

  const sigurUsersDump = sigurStudents
    .filter(
      (user) =>
        user.sigur_key &&
        user.sigur_key !== '00000000000000' &&
        (user.sigur_pos === 'Студент' || user.sigur_pos === 'ВАкадемическомОтпуске'),
    )
    .map((user) => ({
      ID: user.sigur_id,
      POS: user.sigur_pos,
      NAME: user.sigur_fullname,
      CODEKEY: user.sigur_key,
    }));
  await utils.writeToJsonBOM('personal.json', sigurUsersDump);

  CUsers = utils.groupArrayByKey(CUsers, 'person_id');

  const now = Date.now();
  const THIRTY_DAYS_MS = 2592000000;

  /**
   * Description placeholder
   *
   * @type {Object}
   */
  const { CStudents_valid, CStudents_invalid } = Object.entries(CUsers).reduce(
    (acc, persons) => {
      persons = persons[1];

      // need find
      const valid = persons.find((person) => {
        const eduEnd = Date.parse(person.period);
        const isValid = now - eduEnd < THIRTY_DAYS_MS;

        const isStudentValid =
          (isValid && (person.status === 'Выпущен' || person.status === 'Отчислен')) ||
          person.status === 'Студент' ||
          person.status === 'ВАкадемическомОтпуске';

        if (isStudentValid) return true;
        return false;
      });

      if (valid) {
        // @ts-ignore
        acc.CStudents_valid.push(valid);
      } else {
        // @ts-ignore
        acc.CStudents_invalid.push(persons[0]);
      }

      return acc;
    },
    { CStudents_valid: [], CStudents_invalid: [] },
  );

  let counter = 1;

  /**
   * Description placeholder
   *
   * @async
   * @param {string} person_id
   * @param {string} fullname
   * @returns {Promise<Array>}
   */
  const sigurGetPersonal = async (person_id, fullname) => {
    // get user by fullname
    // const sigUsers1 = await sigur.getPersonal(fullname);
    //// get user by fullname

    // get user by person_id
    const sigUsers2 = await sigur.getPersonal('', person_id);
    //// get user by person_id

    return [...(Array.isArray(sigUsers2) ? sigUsers2 : [])].filter(
      (item, index, self) =>
        index === self.findIndex((i) => i.ID === item.ID) && item.STATUS === 'AVAILABLE',
    );
  };

  for (const CUser of CStudents_valid) {
    // loop
    if (!CUser?.group_name) continue;

    // create group
    const CUserGroupName = CUser.group_name.replace(/\/\d+/, '');
    const sigGroup = JSON.parse(JSON.stringify(await sigur.getGroup(CUserGroupName)))[0];
    if (!sigGroup?.ID) {
      console.log(
        `[${counter}/${CStudents_valid.length}] sigur: adding new group with name: ${CUserGroupName}`,
      );
      await sigur.addGroup(CUserGroupName);
    }
    //// create group

    let sigUsers = await sigurGetPersonal(CUser['person_id'], CUser['fullname']);

    // Function to check if CODEKEY.data is all zeroes
    const isAllZeroes = (arr) => arr.every((num) => num === 0);

    // Main function to filter the array
    function filterData(arr) {
      // Step 1: Skip if the array has only one record
      if (arr.length <= 1) return arr;

      const hasValidCodeKey = (obj) =>
        obj.CODEKEY &&
        obj.CODEKEY.data &&
        obj.CODEKEY.data.length > 0 &&
        !isAllZeroes(obj.CODEKEY.data);

      // Find objects with valid CODEKEYs
      const validCodeKeys = arr.filter((obj) => hasValidCodeKey(obj));

      // If only one object has a valid CODEKEY and others don't, remove that object
      if (validCodeKeys.length === 1) {
        return arr.filter((obj) => !hasValidCodeKey(obj)); // Remove the one with a valid CODEKEY
      }

      // If multiple objects have valid CODEKEYs, compare LOCATIONACT and remove the most recent
      if (validCodeKeys.length > 1) {
        // @ts-ignore
        validCodeKeys.sort((a, b) => new Date(b.LOCATIONACT) - new Date(a.LOCATIONACT)); // Sort by newest LOCATIONACT
        const mostRecent = validCodeKeys[0]; // Get the most recent
        return arr.filter((obj) => obj !== mostRecent); // Remove the most recent
      }

      return arr;
    }

    /* if (sigUsers.length > 1) {
      const filteredData = filterData(sigUsers);
      console.log(sigUsers, filteredData);
      if (sigUsers.length - filteredData.length === 1) {
        for (const user of filteredData) {
          console.log(user.NAME);
        }
      }
      continue;
    } else {
      continue;
    } */

    let sigUser;
    sigUsers = await sigurGetPersonal(CUser['person_id'], CUser['fullname']);
    if (Array.isArray(sigUsers) && sigUsers.length > 0) {
      sigUser = sigUsers[sigUsers.length - 1];
    }

    if (sigUser?.ID) {
      // update user

      const sigGroup = JSON.parse(
        JSON.stringify(await sigur.getGroup(CUser.group_name.replace(/\/\d+/, ''))),
      )[0];

      if (sigGroup?.ID) {
        await sigur.updatePersonal(
          sigUser.ID,
          sigGroup.ID,
          CUser.fullname,
          CUser.status,
          CUser.person_id,
          CUser?.phone,
        );
      }
      //// update user
    } else {
      // create user
      console.log(
        `[${counter}/${CStudents_valid.length}] sigur: creating user ${CUser.fullname} in group ${CUser.group_name}`,
      );

      const sigGroup = JSON.parse(
        JSON.stringify(await sigur.getGroup(CUser.group_name.replace(/\/\d+/, ''))),
      )[0];

      if (sigGroup?.ID) {
        await sigur.addPersonal(
          sigGroup.ID,
          CUser.fullname,
          CUser.status,
          CUser.person_id,
          CUser?.phone,
        );
      }
      //// create user
    }
    counter++;
    //// loop
  }

  counter = 1;
  for (const CUser of CStudents_invalid) {
    // loop
    const sigUsers = await sigur.getPersonal('', CUser['person_id']);

    let sigUser;
    if (Array.isArray(sigUsers) && sigUsers.length > 0) {
      sigUser = sigUsers[sigUsers.length - 1];
    }

    if (sigUser?.ID && sigUser.POS !== CUser.status) {
      console.log(
        `[${counter}/${CStudents_invalid.length}] sigur: disabling user [${sigUser.ID}] ${CUser.fullname} with ID: ${sigUser.ID}. Status from ${sigUser.POS} to ${CUser.status}`,
      );

      await sigur.disablePersonal(sigUser.ID, CUser.status);
    }
    counter++;
    //// loop
  }

  console.log(`Sigur: Total students processed in Sigur: ${sigurStudents.length}`);

  console.log('Sigur: Process completed.');
  sigur.finish();
  return sigurStudents;
};

if (process.argv[2] && process.argv[2] === 'google') {
  (async () => {
    console.log('google started');
    try {
      await await syncTeachers();
    } catch (e) {
      console.error(e);
    }
  })().catch((e) => console.error(e));
}

if (process.argv[2] && process.argv[2] === 'umed') {
  (async () => {
    console.log('umed started');
    const CUsers = await create1cJsonData();

    try {
      await syncUmed(CUsers);
    } catch (e) {
      console.error(e);
    }
  })().catch((e) => console.error(e));
}

if (process.argv[2] && process.argv[2] === 'sigur_iiko') {
  (async () => {
    console.log('sigur started');

    const CUsers = await create1cJsonData();

    let sigurUsers;
    try {
      sigurUsers = await syncSigurUsers(CUsers);
    } catch (e) {
      console.error(e);
    }

    try {
      syncIiko(CUsers, sigurUsers);
    } catch (e) {
      console.error(e);
    }
  })().catch((e) => console.error(e));
}

if (process.argv[2] && process.argv[2] === 'moodle') {
  (async () => {
    console.log('moodle started');

    const CUsers = await create1cJsonData();

    try {
      await syncMoodle(CUsers);
    } catch (e) {
      console.error(e);
    }
  })().catch((e) => console.error(e));
}
