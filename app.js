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
  const testUser = {
    student_id: '0270c460-433e-11ee-bba5-fc3497b09f94',
    person_id: 'b1c6bd5e-427d-11ee-bba5-fc3497b09f94',
    speciality_id: '9ff71a04-93f0-11e9-80d0-e0d55e04ef59',
    application_id: '712f3aae-4277-11ee-bba5-fc3497b09f94',
    bitrix_id: '2305218977',
    program_id: '9e2576d3-a132-11ed-bb9e-fc3497b09f94',
    student_code: '2022001761',
    fullname: 'Тесто Тест Тестович',
    login: '2305218977',
    password: '382035467033',
    phone: '+79507521007',
    speciality_name: 'Медицинская оптика',
    speciality_code: '31.02.04  ',
    group_id: 'ccda57b3-4179-11ee-bba5-fc3497b09f94',
    period: '2023-09-01T12:00:33',
    status: 'Студент',
    rup_id: '42b50f49-416f-11ee-bba5-fc3497b09f94',
    group_code: '00353',
    group_name: 'МОЗу-1-23',
    group_year: '2023',
    edu_form: 'Заочная',
    edu_end: '2025-02-28T00:00:00',
    contract_id: 'bd62f414-427d-11ee-bba5-fc3497b09f94',
    contract_code: '000003939',
    contract_date: '2023-08-24T17:57:20',
    contract_end: '2026-07-31T00:00:00',
    contract_total_payment: '70000',
  };
  CUsers.push(testUser);
  await utils.writeToJson('CUsers.json', CUsers);

  /* const sigurUsers = await getSigurUsers();

  console.log('Sync users in Iiko');
  const iikoInstance = new Iiko(iikoApi, iikoCategoryId);
  const iikoUsers = await iikoInstance.syncIiko(CUsers, sigurUsers);
  utils.writeToJson('iikoUsers.json', iikoUsers); */

  const syncUmed = await umed.syncUmed(umedToken, CUsers);

  console.log(`Total users in 1c: ${CUsers.length}`);
  /* console.log(`Total users in sigur: ${sigurUsers.length}`);
  console.log(`Total users in iiko: ${iikoUsers.length}`); */
  console.log('Main job finished');
}

main();
