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
  for (const CUserSigurUser of mergedSigur1CUsers) {
    const sigurGroup = sigurGroups.filter(
      (group) => group.NAME === CUserSigurUser.group_name,
    );

    // delete user in sigur
    if (
      CUserSigurUser.status !== 'Студент' &&
      CUserSigurUser.status !== 'ВАкадемическомОтпуске' &&
      CUserSigurUser.sigur_id
    ) {
      // change user's name in sigur to 'student.status student.fullname'
      if (sigurGroup) {
        await sigur.updatePersonal(
          CUserSigurUser.sigur_id,
          sigurGroup.ID,
          `${CUserSigurUser.status} ${CUserSigurUser.fullname}`,
          'студент',
          CUserSigurUser.person_id,
        );
      }
    }

    // update user in sigur
    if (
      (CUserSigurUser.status === 'Студент' ||
        CUserSigurUser.status === 'ВАкадемическомОтпуске') &&
      CUserSigurUser.sigur_id &&
      CUserSigurUser.group_name
    ) {
      // update user's fullname and parent group id
      if (
        sigurGroup &&
        (sigurGroup.ID !== CUserSigurUser.sigur_group_id ||
          CUserSigurUser.fullname !== CUserSigurUser.sigur_fullname)
      ) {
        await sigur.updatePersonal(
          CUserSigurUser.sigur_id,
          sigurGroup.ID,
          CUserSigurUser.fullname,
          'студент',
          CUserSigurUser.person_id,
        );
      }
    }

    // create user
    if (
      (CUserSigurUser.status === 'Студент' ||
        CUserSigurUser.status === 'ВАкадемическомОтпуске') &&
      !CUserSigurUser.sigur_id &&
      CUserSigurUser.group_name
    ) {
      const CUserGroupName = CUserSigurUser.group_name.replace(/\/\d+/, '');

      const foundGroupInSigur = sigurGroups.find(
        (sigurGroup) => sigurGroup.NAME === CUserGroupName,
      );
      await sigur.addPersonal(
        foundGroupInSigur.ID,
        CUserSigurUser.fullname,
        'студент',
        CUserSigurUser.person_id,
      );
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
