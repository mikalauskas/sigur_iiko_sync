const Sigur = require('./lib/sigur.js');
const Iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const { syncUmed } = require('./lib/umed.js');
const { syncMoodle } = require('./lib/moodle.js');
const { create1cJsonData } = require('./lib/1c.js');

require('log-timestamp');
dotenv.config();

const getSigurUsers = async () => {
  const sigur = new Sigur();
  const sigurUsers = await sigur.getPersonal();

  console.log(`Total users in sigur: ${sigurUsers.length}`);

  const sigurUsersDump = sigurUsers.map((el) => {
    return {
      ID: el.sigur_id,
      POS: el.sigur_pos,
      NAME: el.sigur_fullname,
      CODEKEY: el.sigur_key,
    };
  });
  await utils.writeToJsonBOM('personal.json', sigurUsersDump);
  return sigurUsers;
};

(async () => {
  console.log('app started');
  try {
    const CUsers = await create1cJsonData();

    await syncUmed(CUsers);

    const sigurUsers = await getSigurUsers();
    const iikoInstance = new Iiko();
    iikoInstance.syncIiko(CUsers, sigurUsers);

    await syncMoodle(CUsers);
  } catch (e) {
    console.error(e);
  }
})()
  .then(() => console.log('app finished'))
  .catch((e) => console.error(e));
