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

  await utils.writeToJsonBOM('personal.json', sigurUsers);

  function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  }

  return sigurUsers.map((el) => {
    return {
      sigur_id: el.ID,
      sigur_pos: el.POS,
      sigur_fullname: el.NAME.replace(/\u00A0/g, ' ').trim(),
      sigur_key: buf2hex(el.CODEKEY).slice(-8).toUpperCase().padStart(14, '0'),
    };
  });
};

(async () => {
  console.log('app started');
  try {
    const CUsers = await create1cJsonData();

    await syncUmed(CUsers);

    const sigurUsers = await getSigurUsers();
    const iikoInstance = new Iiko();
    await iikoInstance.syncIiko(CUsers, sigurUsers);

    await syncMoodle(CUsers);
  } catch (e) {
    console.error(e);
  }
})()
  .then(() => console.log('app finished'))
  .catch((e) => console.error(e));
