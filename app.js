const Sigur = require('./lib/sigur.js');
const Iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const umed = require('./lib/umed.js');
const { create1cJsonData } = require('./lib/1c.js');
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

const getSigurUsers = async () => {
  const sigur = new Sigur(
    sigurDbHost,
    SigurDbPort,
    SigurDbUser,
    SigurDbPassword,
    SigurDbName,
  );
  const sigurUsers = await sigur.getPersonal();

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

async function main() {
  console.log('Main job started');

  const CUsers = await create1cJsonData();
  await utils.writeToJson('CUsers.json', CUsers);

  /* const sigurUsers = getSigurUsers();

  const iikoInstance = new Iiko(iikoApi, iikoCategoryId);
  const iikoUsers = iikoInstance.syncIiko(await CUsers, await sigurUsers);
  utils.writeToJson('iikoUsers.json', await iikoUsers); */

  const syncUmed = await umed.syncUmed(umedToken, CUsers);

  /* console.log(`Total users in sigur: ${sigurUsers.length}`);
  console.log(`Total users in iiko: ${iikoUsers.length}`); */
  console.log('Main job finished');
}

main();
