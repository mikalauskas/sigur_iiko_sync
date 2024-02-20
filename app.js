const Sigur = require('./lib/sigur.js');
const Iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const { getUmedUsers, getUmedStudents, getUmedAbiturients } = require('./lib/umed.js');
const { create1cJsonData } = require('./lib/1c.js');
const { stringSimilarity } = require('string-similarity-js');
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

/**
 * Compare Sigur users and Umed users
 * @date 2/20/2024 - 1:58:43 PM
 * @param {Array} users array
 * @async
 * @returns {Array} array
 */
const syncIiko = async (users) => {
  console.log('Comparing job started');
  const iikoInstance = new Iiko(iikoApi, iikoCategoryId);
  const iikoUsers = [];

  const usersToSync = users.filter(
    (user) => user.phone && user.sigur_key && user.status === 'Студент',
  );

  // Iterate through each user
  for (const user of usersToSync) {
    const foundUser = await iikoInstance.getCustomerInfo(user.phone);
    if (foundUser.id) {
      //console.log(`Update: ${user.phone} ${user.fullname}`);
      iikoUsers.push(foundUser);
      const cardsToRemove = foundUser.cards
        .filter((card) => card.number !== user.sigur_key)
        .map((card) => card.number);

      if (cardsToRemove.length > 0) {
        for (const card of cardsToRemove) {
          await iikoInstance.removeCard(foundUser.id, card);
        }
      }
      await iikoInstance.addCard(foundUser.id, user.sigur_key);
    } else {
      const createdUser = await iikoInstance.createUser(user);

      if (createdUser.id) {
        await iikoInstance.addUserToCategory(createdUser.id, iikoCategoryId);
      }
    }
    continue;
  }

  return iikoUsers;
};

const getSigurUsers = async () => {
  const sigur = new Sigur(sigurDbHost, SigurDbPort, SigurDbUser, SigurDbPassword, SigurDbName);
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
  console.log('Sync job started');
  const umedUsers = await getUmedUsers(umedToken);
  await utils.writeToJson('umedUsers.json', umedUsers);

  /* const umedStudents = await getUmedStudents(umedToken);
  await utils.writeToJson('umedStudents.json', umedStudents);

  const umedAbiturients = await getUmedAbiturients(umedToken);
  await utils.writeToJson('umedAbiturients.json', umedAbiturients); */

  const sigurUsers = await getSigurUsers();

  const c1Users = await create1cJsonData();
  await utils.writeToJson('c1Users.json', c1Users);

  console.log('Merging 1C data with Sigur');
  const merge1cSigur = utils.mergeArraysUsingSimilarity(
    c1Users,
    sigurUsers,
    'fullname',
    'sigur_fullname',
  );

  console.log('Merging 1C and Sugur data with Umed');
  const merge1cSigurUmed = utils.mergeArraysDiff(
    merge1cSigur,
    umedUsers,
    'student_id',
    'umed_guid',
  );
  await utils.writeToJson('merge1cSigurUmed.json', merge1cSigurUmed);

  console.log('Sync users in Iiko');
  const iikoUsers = await syncIiko(merge1cSigurUmed);
  utils.writeToJson('iikoUsers.json', iikoUsers);

  console.log(`Total users in umed: ${umedUsers.length}`);
  console.log(`Total users in sigur: ${sigurUsers.length}`);
  console.log(`Total users in 1c: ${c1Users.length}`);
  console.log(`Total users in iiko: ${iikoUsers.length}`);
}

main();
