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
    el.NAME = el.NAME.replace(/\u00A0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    el.NAME = utils.titleCase(el.NAME);
    el.CODEKEY = utils.buf2hex(el.CODEKEY).slice(-8).toUpperCase().padStart(14, '0');

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

      for (const person of persons) {
        const eduEnd = Date.parse(person.period);
        const isValid = now - eduEnd < THIRTY_DAYS_MS;

        const isStudentValid =
          (isValid && (person.status === 'Выпущен' || person.status === 'Отчислен')) ||
          person.status === 'Студент' ||
          person.status === 'ВАкадемическомОтпуске';

        if (isStudentValid) {
          acc.CStudents_valid.push(person);
          break;
        } else {
          acc.CStudents_invalid.push(person);
        }
      }

      return acc;
    },
    { CStudents_valid: [], CStudents_invalid: [] },
  );

  let counter = 1;

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

    // get user by fullname
    const sigUser1 = JSON.parse(
      JSON.stringify(await sigur.getPersonal(CUser['fullname'])),
    )[0];
    //// get user by fullname

    // get user by person_id
    const sigUser2 = JSON.parse(
      JSON.stringify(await sigur.getPersonal('', CUser['person_id'])),
    )[0];
    //// get user by person_id

    let sigUser;
    if (sigUser1?.ID && sigUser2?.ID && sigUser1.ID !== sigUser2.ID) {
      const isFoundUser1Deletable =
        sigUser1.CODEKEY === null && sigUser1.STATUS === 'AVAILABLE';
      const isFoundUser2Deletable =
        sigUser2.CODEKEY === null && sigUser2.STATUS === 'AVAILABLE';

      if (isFoundUser1Deletable) {
        sigur.deletePersonal(sigUser1.ID);
        sigUser = sigUser2;
      } else if (isFoundUser2Deletable) {
        sigur.deletePersonal(sigUser2.ID);
        sigUser = sigUser1;
      }
    }

    if (!sigUser?.ID) {
      sigUser = JSON.parse(
        JSON.stringify(await sigur.getPersonal('', CUser['person_id'])),
      )[0];
    }

    if (sigUser?.ID) {
      // update user

      // console.log(
      //   `[${counter}/${CStudents_valid.length}] sigur: updating user [${sigUser.ID}] ${CUser.fullname} in group ${CUser.group_name}`,
      // );

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
    const sigUser = JSON.parse(
      JSON.stringify(await sigur.getPersonal('', CUser['person_id'])),
    )[0];
    if (sigUser?.ID && sigUser.STATUS !== CUser.status && sigUser.CODEKEY) {
      console.log(
        `[${counter}/${CStudents_invalid.length}] sigur: disabling user [${sigUser.ID}] ${CUser.fullname} with ID: ${sigUser.ID}. Status from ${sigUser.POS} to ${CUser.status}`,
      );

      await sigur.disablePersonal(sigUser.ID, CUser.status);
    }
    counter++;
    //// loop
  }

  // Log the total number of students processed in Sigur
  console.log(`Sigur: Total students processed in Sigur: ${sigurStudents.length}`);

  // Filter out users with a specific key and map their data for export
  const sigurUsersDump = sigurStudents
    .filter(
      (user) =>
        user.sigur_key !== '00000000000000' &&
        (user.sigur_pos === 'Студент' || user.sigur_pos === 'ВАкадемическомОтпуске'),
    )
    .map((user) => ({
      ID: user.sigur_id,
      POS: user.sigur_pos,
      NAME: user.sigur_fullname,
      CODEKEY: user.sigur_key,
    }));

  // Write the filtered and mapped data to a JSON file
  console.log('Sigur: Writing user data to personal.json');
  await utils.writeToJsonBOM('personal.json', sigurUsersDump);

  // Finish the Sigur process and return the list of students
  console.log('Sigur: Process completed.');
  sigur.finish();
  return sigurStudents;
};

(async () => {
  console.log('app started');

  const CUsers = await create1cJsonData();

  try {
    await await syncTeachers();
  } catch (e) {
    console.error(e);
  }

  try {
    await syncUmed(CUsers);
  } catch (e) {
    console.error(e);
  }

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

  try {
    await syncMoodle(CUsers);
  } catch (e) {
    console.error(e);
  }
})().catch((e) => console.error(e));
