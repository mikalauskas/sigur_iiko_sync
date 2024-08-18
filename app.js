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
  for (const student of CUsers) {
    if (
      student.group_name &&
      (student.status === 'Студент' || student.status === 'ВАкадемическомОтпуске')
    ) {
      const formattedGroupName = student.group_name.replace(/\/\d+/, '');

      const foundGroupInSigur = sigurGroups.find(
        (group) => group.NAME === formattedGroupName,
      );

      if (
        !foundGroupInSigur &&
        !groupsToCreate.find((group_name) => group_name === user.group_name)
      ) {
        groupsToCreate.push(user.group_name);
        await sigur.addGroup(group_name);
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
  for (const student of mergedSigur1CUsers) {
    const validGroup = sigurGroups.filter((group) => group.NAME === student.group_name);

    // delete user in sigur
    if (
      student.status !== 'Студент' &&
      student.status !== 'ВАкадемическомОтпуске' &&
      student.sigur_id
    ) {
      // change user's name in sigur to 'student.status student.fullname'
      if (validGroup) {
        await sigur.updatePersonal(
          student.sigur_id,
          validGroup.ID,
          `${student.status} ${student.fullname}`,
          'студент',
          student.person_id,
        );
      }
    }

    // update user in sigur
    if (
      (student.status === 'Студент' || student.status === 'ВАкадемическомОтпуске') &&
      student.sigur_id &&
      student.group_name
    ) {
      // update user's fullname and parent group id
      if (
        validGroup &&
        (validGroup.ID !== student.sigur_group_id ||
          student.fullname !== student.sigur_fullname)
      ) {
        await sigur.updatePersonal(
          student.sigur_id,
          validGroup.ID,
          student.fullname,
          'студент',
          student.person_id,
        );
      }
    }

    // create user
    if (
      (student.status === 'Студент' || student.status === 'ВАкадемическомОтпуске') &&
      !student.sigur_id &&
      student.group_name
    ) {
      const formattedGroupName = student.group_name.replace(/\/\d+/, '');

      const group = sigurGroups.find((group) => group.NAME === formattedGroupName);
      await sigur.addPersonal(group.ID, student.fullname, 'студент', student.person_id);
    }
  }

  console.log(`Total users in sigur: ${sigurStudents.length}`);

  const sigurUsers1CDump = sigurStudents
    .map((el) => {
      return {
        ID: el.sigur_id,
        POS: el.sigur_pos,
        NAME: el.sigur_fullname,
        CODEKEY: el.sigur_key,
      };
    })
    .filter((el) => el.CODEKEY !== '00000000000000');

  await utils.writeToJsonBOM('personal.json', sigurUsers1CDump);
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
