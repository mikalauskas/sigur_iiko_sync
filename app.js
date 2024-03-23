const Sigur = require('./lib/sigur.js');
const Iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const utils = require('./lib/utils.js');
const { syncUmed } = require('./lib/umed.js');
const { syncMoodle } = require('./lib/moodle.js');
const { create1cJsonData } = require('./lib/1c.js');
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

require('log-timestamp');
dotenv.config();

const sentryDSN = process.env.sentryDSN;

Sentry.init({
  dsn: sentryDSN,
  integrations: [nodeProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

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
    const sigurUsers = await getSigurUsers();

    syncUmed(CUsers);
    syncMoodle(CUsers);
    const iikoInstance = new Iiko();
    iikoInstance.syncIiko(CUsers, sigurUsers);
  } catch (e) {
    console.error(e);
  }
})()
  .then(() => console.log('app finished'))
  .catch((e) => console.error(e));
