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
      sigur_pos: el.POS,
      sigur_fullname: el.NAME,
      sigur_key: el.CODEKEY,
    };
  });
  await utils.writeToJsonBOM('sigurStudents.json', sigurStudents);

  const groupsToCreate = [];

  CUsers.forEach((user) => {
    if (
      user.group_name &&
      (user.status === 'Студент' || user.status === 'ВАкадемическомОтпуске')
    ) {
      const newGroupName = user.group_name.replace(/\/\d+/, '');

      const foundGroupInSigur = sigurGroups.find((group) => group.NAME === newGroupName);

      if (
        !foundGroupInSigur &&
        !groupsToCreate.find((group_name) => group_name === user.group_name)
      ) {
        groupsToCreate.push(user.group_name);
      }
    }
  });
  await utils.writeToJsonBOM('groupsToCreate.json', groupsToCreate);
  for (const group_name of groupsToCreate) {
    await sigur.addGroup(group_name);
  }

  sigurGroups = await sigur.getGroups();

  const mergedSigur1CUsers = utils.mergeArraysUsingSimilarity(
    CUsers,
    sigurStudents,
    'fullname',
    'sigur_fullname',
  );
  await utils.writeToJsonBOM('mergedSigur1CUsers.json', mergedSigur1CUsers);

  const sigurUsersToCreate = mergedSigur1CUsers.filter(
    (el) =>
      (el.status === 'Студент' || el.status === 'ВАкадемическомОтпуске') &&
      !el.sigur_id &&
      el.group_name,
  );
  await utils.writeToJsonBOM('sigurUsersToCreate.json', sigurUsersToCreate);
  for (const user of sigurUsersToCreate) {
    const newGroupName = user.group_name.replace(/\/\d+/, '');

    // find group id in sigurGroups
    const group = sigurGroups.find((group) => group.NAME === newGroupName);
    await sigur.addPersonal(group.ID, user.fullname, 'студент', user.person_id);
  }

  const sigurUsersToDelete = mergedSigur1CUsers.filter(
    (el) =>
      el.status !== 'Студент' && el.status !== 'ВАкадемическомОтпуске' && el.sigur_id,
  );
  await utils.writeToJsonBOM('sigurUsersToDelete.json', sigurUsersToDelete);

  const sigurUsersToUpdate = mergedSigur1CUsers.filter(
    (el) =>
      (el.status === 'Студент' || el.status === 'ВАкадемическомОтпуске') && el.sigur_id,
  );
  await utils.writeToJsonBOM('sigurUsersToUpdate.json', sigurUsersToUpdate);

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
