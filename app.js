const Sigur = require('./lib/sigur.js');
const iiko = require('./lib/iiko.js');
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Compare cards of iiko users
// Add a new card, remove old cards
const compareCards = async (token, orgId, fio, phone, customerId, userCards, newCard) => {
  await delay(300);
  await iiko.addCard(token, orgId, customerId, newCard);
  //console.log(`User: ${fio} (${phone}) newCard: ${newCard}`);

  const cardsToRemove = userCards
    .filter((card) => card.number !== newCard)
    .map((card) => card.number);

  if (cardsToRemove.length > 0) {
    console.log('cards to remove:');
    console.log(cardsToRemove);
  }

  for (let cardNumber of cardsToRemove) {
    console.log(`User: ${fio} (${phone}) removing card: ${cardNumber}`);
    await delay(300);
    await iiko.removeCard(token, orgId, customerId, cardNumber);
  }
};

// Compare Sigur users and Umed users
const compareUsers = async (umedUsers, sigurUsers, token, orgId) => {
  console.log('Comparing job started');
  const foundUsersinIiko = [];

  // Iterate through each user from umedUsers
  for (const umedUser of umedUsers) {
    const { umed_login, umed_fullname, umed_firstname, umed_lastname, umed_secondname } = umedUser;

    // Iterate through each user from sigurUsers
    for (const sigurUser of sigurUsers) {
      const { sigur_fullname, sigur_key } = sigurUser;

      // Calculate similarity between names
      const similarity = stringSimilarity(umed_fullname, sigur_fullname);

      // If similarity is greater than 0.95, consider it a match
      if (similarity > 0.95) {
        // Search user in iiko
        await delay(300);
        const response = await iiko.getCustomerInfo(token, orgId, umed_login);

        // If user not found in iiko, create and add to category
        if (response === 400) {
          console.log(`Creating user ${umed_login}`);
          await delay(300);
          const customerId = await iiko.createUser(
            token,
            orgId,
            umed_login,
            umed_firstname,
            umed_lastname,
            umed_secondname,
            sigur_key,
          );

          if (customerId) {
            console.log(`Created user with id: ${customerId.id}`);
          }

          console.log(`Adding user ${umed_login} to student category`);
          await delay(300);
          const userInCategory = await iiko.addUserToCategory(
            token,
            orgId,
            customerId.id,
            iikoCategoryId,
          );

          if (userInCategory) {
            console.log(`User ${umed_login} added to category`);
          }

          continue;
        }

        // If user found in iiko, compare cards and add/remove
        compareCards(
          token,
          orgId,
          umed_fullname,
          umed_login,
          response.id,
          response.cards,
          sigur_key,
        );
        foundUsersinIiko.push(response);

        continue;
      }
    }
  }

  console.log(`Found users in iiko db: ${foundUsersinIiko.length}`);
  return foundUsersinIiko;
};

const syncUsers = async (sigurUsers) => {
  try {
    console.log('Sync job started');
    const umedUsers = await getUmedUsers(umedToken);
    console.log(`Total users in umed: ${umedUsers.length}`);

    const token = await iiko.getToken(iikoApi);
    const orgId = await iiko.getOrgId(token);

    console.log('Comparing user between Sigur and Umed');
    const compareResult = await compareUsers(umedUsers, sigurUsers, token, orgId);
    console.log('Comparing job finished');
    utils.writeToJson('iikoUsers.json', compareResult);
  } catch (error) {
    console.log(error);
  }
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
  await utils.writeToJson('umed_users.json', umedUsers);
  const umedStudents = await getUmedStudents(umedToken);
  await utils.writeToJson('umed_students.json', umedStudents);
  const umedAbiturients = await getUmedAbiturients(umedToken);
  await utils.writeToJson('umed_abiturients.json', umedAbiturients);

  const sigurUsers = await getSigurUsers();

  const c1Users = await create1cJsonData();
  await utils.writeToJson('1c_outputData.json', c1Users);

  console.log(`Total users in umed: ${umedUsers.length}`);
  console.log(`Total users in sigur: ${sigurUsers.length}`);
  console.log(`Total users in 1c: ${c1Users.length}`);

  const merge1cSigur = utils.mergeArraysUsingSimilarity(
    c1Users,
    sigurUsers,
    'fullname',
    'sigur_fullname',
  );

  const merge1cSigurUmed = utils.mergeArraysDiff(
    merge1cSigur,
    umedUsers,
    'student_id',
    'umed_guid',
  );
  await utils.writeToJson('umed_1c_sigur.json', merge1cSigurUmed);
}

main();
