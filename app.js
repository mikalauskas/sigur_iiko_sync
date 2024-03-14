const Sigur = require('./lib/sigur.js');
const Iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const { syncUmed } = require('./lib/umed.js');
const { syncMoodle } = require('./lib/moodle.js');
const { create1cJsonData } = require('./lib/1c.js');
const { create1cFreshJsonData } = require('./lib/1cFresh.js');
require('log-timestamp');
dotenv.config();

const sigurDbHost = process.env.SIGUR_HOST;
const SigurDbPort = process.env.SIGUR_PORT;
const SigurDbUser = process.env.SIGUR_USER;
const SigurDbPassword = process.env.SIGUR_PASSWORD;
const SigurDbName = process.env.SIGUR_DATABASE;
const umedToken = process.env.UMED_TOKEN;
const iikoApi = process.env.IIKO_API;
const iikoCategoryId = process.env.IIKO_STUDENT_CATEGORY;
const moodleToken = process.env.MOODLE_TOKEN;
const C1FreshUrl = process.env.C1_FRESH_ENDPOINT;
const C1FreshLogin = process.env.C1_FRESH_LOGIN;
const C1FreshPassword = process.env.C1_FRESH_PASSWORD;

const getSigurUsers = async () => {
  const sigur = new Sigur(
    sigurDbHost,
    SigurDbPort,
    SigurDbUser,
    SigurDbPassword,
    SigurDbName,
  );
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
  /* const C1FreshUsers = await create1cFreshJsonData(
    C1FreshUrl,
    C1FreshLogin,
    C1FreshPassword,
  ); */
  const CUsers = await create1cJsonData();

  await syncUmed(umedToken, CUsers);
  await syncMoodle(moodleToken, CUsers);

  const sigurUsers = await getSigurUsers();
  const iikoInstance = new Iiko(iikoApi, iikoCategoryId);
  await iikoInstance.syncIiko(CUsers, sigurUsers);
})();
