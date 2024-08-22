const Sigur = require('./lib/sigur.js');
const Iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const { syncUmed } = require('./lib/umed.js');
const { syncMoodle } = require('./lib/moodle.js');
const { create1cJsonData } = require('./lib/1c.js');

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
    };
  });
  await utils.writeToJsonBOM('sigurStudents.json', sigurStudents);

  let counter = 1;
  for (const CUser of CUsers) {
    // create group
    if (
      CUser.group_name &&
      (CUser.status === 'Студент' || CUser.status === 'ВАкадемическомОтпуске')
    ) {
      const CUserGroupName = CUser.group_name.replace(/\/\d+/, '');

      const foundGroup = JSON.parse(
        JSON.stringify(await sigur.getGroup(CUserGroupName)),
      )[0];

      if (!foundGroup?.ID) {
        console.log(
          `[${counter}/${CUsers.length}] sigur: adding new group with name: ${CUserGroupName}`,
        );
        await sigur.addGroup(CUserGroupName);
      }
    }
    ////

    /* // get user by fullname
    let foundUser = JSON.parse(
      JSON.stringify(await sigur.getPersonal(CUser['fullname'])),
    )[0];
    ////

    // get user by person_id
    if (!foundUser?.ID) {
      let foundUser = JSON.parse(
        JSON.stringify(await sigur.getPersonal('', CUser['person_id'])),
      )[0];
    }
    //// */

    // get user by person_id

    let foundUser = JSON.parse(
      JSON.stringify(await sigur.getPersonal('', CUser['person_id'])),
    )[0];

    ////

    if (foundUser?.ID) {
      // update user
      if (
        CUser.group_name &&
        (CUser.status === 'Студент' || CUser.status === 'ВАкадемическомОтпуске')
      ) {
        const matchingGroup = JSON.parse(
          JSON.stringify(await sigur.getGroup(CUser.group_name.replace(/\/\d+/, ''))),
        )[0];

        if (matchingGroup?.ID) {
          await sigur.updatePersonal(
            foundUser.ID,
            matchingGroup.ID,
            CUser.fullname,
            CUser.status,
            CUser.person_id,
            CUser?.phone,
          );
        }
        ////

        // disable user
      } else if (
        foundUser.POS !== 'Отчислен' &&
        foundUser.POS !== 'Выпущен' &&
        CUser.status !== 'Студент' &&
        CUser.status !== 'ВАкадемическомОтпуске' &&
        !CUsers.find(
          (user) =>
            user.person_id === CUser.person_id &&
            (user.status === 'Студент' || user.status === 'ВАкадемическомОтпуске'),
        ) &&
        foundUser.TABID === CUser.person_id
      ) {
        console.log(
          `[${counter}/${CUsers.length}] sigur: disabling user: ${CUser.fullname} with ID: ${foundUser.ID}. Status from ${foundUser.POS} to ${CUser.status}`,
        );

        await sigur.disablePersonal(foundUser.ID, CUser.status);
      } ////
    } else {
      // create user
      if (
        CUser.group_name &&
        (CUser.status === 'Студент' || CUser.status === 'ВАкадемическомОтпуске')
      ) {
        console.log(
          `[${counter}/${CUsers.length}] sigur: creating user ${CUser.fullname} in group ${CUser.group_name}`,
        );

        const matchingGroup = JSON.parse(
          JSON.stringify(await sigur.getGroup(CUser.group_name.replace(/\/\d+/, ''))),
        )[0];

        if (matchingGroup?.ID) {
          await sigur.addPersonal(
            matchingGroup.ID,
            CUser.fullname,
            CUser.status,
            CUser.person_id,
            CUser?.phone,
          );
        }
      }
      ////
    }

    counter++;
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
  try {
    const CUsers = await create1cJsonData();
    await syncUmed(CUsers);

    const sigurUsers = await syncSigurUsers(CUsers);

    const iikoInstance = new Iiko();
    await iikoInstance.syncIiko(CUsers, sigurUsers);

    await syncMoodle(CUsers);
  } catch (e) {
    console.error(e);
  }
})()
  .then(() => console.log('app finished'))
  .catch((e) => console.error(e));
