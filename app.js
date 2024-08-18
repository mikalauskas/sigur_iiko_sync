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
  let sigurGroups = await sigur.getGroups();
  await utils.writeToJsonBOM('sigurGroups.json', sigurGroups);

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

  // groups manipulations
  const groupsToCreate = [];
  for (const CUser of CUsers) {
    if (
      CUser.group_name &&
      (CUser.status === 'Студент' || CUser.status === 'ВАкадемическомОтпуске')
    ) {
      const CUserGroupName = CUser.group_name.replace(/\/\d+/, '');

      const foundGroupInSigur = sigurGroups.find(
        (sigurGroup) => sigurGroup.NAME === CUserGroupName,
      );

      if (
        !foundGroupInSigur &&
        !groupsToCreate.find((group_name) => group_name === CUserGroupName)
      ) {
        groupsToCreate.push(CUserGroupName);
        await sigur.addGroup(CUserGroupName);
      }
    }
  }

  sigurGroups = await sigur.getGroups();

  const mergedSigur1CUsers = utils.mergeArraysUsingSimilarity(
    CUsers,
    sigurStudents,
    'fullname',
    'sigur_fullname',
  );
  await utils.writeJsonData('mergedSigur1CUsers.json', mergedSigur1CUsers);

  // users manipulations
  // Loop through each user in the mergedSigur1CUsers array
  for (const cUser of mergedSigur1CUsers) {
    // Extract and clean up the group name by removing trailing digits
    const groupName = cUser.group_name?.replace(/\/\d+/, '');
    /* if (cUser?.fullname) {
      let [lastName, firstName, secondName] = cUser.fullname.split(' ');
      lastName = lastName
        ? lastName.charAt(0).toUpperCase() + lastName.substr(1).toLowerCase()
        : '';
      firstName = firstName
        ? firstName.charAt(0).toUpperCase() + firstName.substr(1).toLowerCase()
        : '';
      secondName = secondName
        ? secondName.charAt(0).toUpperCase() + secondName.substr(1).toLowerCase()
        : '';
      cUser.fullname =
        (lastName ? lastName : '') +
        (firstName ? ' ' + firstName : '') +
        (secondName ? ' ' + secondName : '');
    } */

    // Find the matching group in the sigurGroups array
    const matchingGroup = sigurGroups.find((group) => group.NAME === groupName);
    /* const matchingUser = sigurStudents.find((student) => student.NAME === cUser.fullname); */

    /* // Case 1: The user is not a student and has a sigur_id, so update their information
    if (
      cUser.status !== 'Студент' &&
      cUser.status !== 'ВАкадемическомОтпуске' &&
      cUser.sigur_id
    ) {
      if (matchingGroup?.ID) {
        await sigur.updatePersonal(
          cUser.sigur_id,
          matchingGroup.ID,
          `${cUser.status} ${cUser.fullname}`,
          'студент',
          cUser.person_id,
        );
      }
    } */

    /* // Case 2: The user is a student and has a sigur_id, so check if their information needs updating
    if (
      (cUser.status === 'Студент' || cUser.status === 'ВАкадемическомОтпуске') &&
      cUser.sigur_id
    ) {
      if (
        matchingGroup?.ID &&
        matchingGroup.ID !== cUser?.sigur_group_id &&
        cUser.fullname !== cUser?.sigur_fullname &&
        cUser.person_id !== cUser?.sigur_person_id &&
        cUser?.sigur_pos !== 'студент'
      ) {
        await sigur.updatePersonal(
          cUser.sigur_id,
          matchingGroup.ID,
          cUser.fullname,
          'студент',
          cUser.person_id,
        );
      }
    } */

    // Case 3: The user is a student without a sigur_id, so create a new entry in Sigur
    if (
      (cUser.status === 'Студент' || cUser.status === 'ВАкадемическомОтпуске') &&
      !cUser.sigur_id &&
      cUser.group_name
    ) {
      console.log(`Sigur: Creating a new student ${cUser.fullname} in Sigur.`);
      if (matchingGroup) {
        await sigur.addPersonal(
          matchingGroup.ID,
          cUser.fullname,
          'студент',
          cUser.person_id,
        );
      }
    }
  }

  // Log the total number of students processed in Sigur
  console.log(`Sigur: Total students processed in Sigur: ${sigurStudents.length}`);

  // Filter out users with a specific key and map their data for export
  const sigurUsersDump = sigurStudents
    .filter((user) => user.sigur_key !== '00000000000000')
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
