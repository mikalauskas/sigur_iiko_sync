const fs = require('fs');
const Sigur = require('./lib/sigur.js');
const umed = require('./lib/umed.js');
const iiko = require('./lib/iiko.js');
const dotenv = require('dotenv');
const { stringSimilarity } = require('string-similarity-js');
require('log-timestamp');
dotenv.config();

const sigurDbHost = process.env.SIGUR_HOST;
const SigurDbPort = process.env.SIGUR_PORT;
const SigurDbUser = process.env.SIGUR_USER;
const SigurDbPassword = process.env.SIGUR_PASSWORd;
const SigurDbName = process.env.SIGUR_DATABASE;
const umedToken = process.env.UMED_TOKEN;
const iikoApi = process.env.IIKO_API;
const iikoCategoryId = process.env.IIKO_STUDENT_CATEGORY;

const sigur = new Sigur(sigurDbHost, SigurDbPort, SigurDbUser, SigurDbPassword, SigurDbName);

const dumpToJsonFile = (filename, data) => {
    if (data) {
        console.log(`Writing data to ${filename}`);
        fs.writeFile(filename, "\ufeff" + JSON.stringify(data, null, 4).replace(/\n/g, "\r\n"), err => {
            if (err) {
                console.error(err);
            }
        });
    }
};

// Compare cards of iiko users
// Add a new card, remove old cards
async function compareCards(token, orgId, fio, phone, customerId, userCards, newCard) {
    iiko.addCard(token, orgId, customerId, newCard);
    for (let i in userCards) {
        if (userCards[i].number !== newCard) {
            console.log(`User: ${fio} (${phone}) current card: ${userCards[i].number}, newcard: ${newCard}`);
            iiko.removeCard(token, orgId, customerId, userCards[i].number);

        }
    }
}

// Compare Sigur users and Umed users
async function compareUsers(umedUsers, sigurUsers, token, orgId) {
    console.log('Comparing job started');
    let foundUsersinIiko = [];
    let fioUmed,
        fioSigur,
        firstNameUmed,
        lastNameUmed,
        secondNameUmed,
        loginUmed,
        codeKeySigur = undefined;

    for (let i in umedUsers) {
        firstNameUmed = umedUsers[i]['NAME'];
        lastNameUmed = umedUsers[i]['LAST_NAME'];
        secondNameUmed = umedUsers[i]['SECOND_NAME'];
        fioUmed = lastNameUmed + ' ' + firstNameUmed + ' ' + secondNameUmed;
        loginUmed = umedUsers[i]['LOGIN'];
        for (let j in sigurUsers) {
            fioSigur = sigurUsers[j]['NAME'];
            codeKeySigur = sigurUsers[j]['CODEKEY'];
            let compare = stringSimilarity(fioUmed, fioSigur)
            if (compare > 0.95) {
                // Search user in iiko
                let response = await iiko.getCustomerInfo(token, orgId, loginUmed);
                if (response === 400) {
                    // Create user in iiko
                    console.log(`Creating user ${loginUmed}`);
                    let customerId = await iiko.createUser(token, orgId, loginUmed, firstNameUmed, lastNameUmed, secondNameUmed, codeKeySigur);
                    if (customerId) {
                        console.log(`Created user with id: ${customerId['id']}`);
                    }
                    console.log(`Adding user ${loginUmed} to student category`);
                    let userInCategory = await iiko.addUserToCategory(token, orgId, customerId['id'], iikoCategoryId);
                    if (userInCategory) console.log(`User ${loginUmed} added to category`);
                    continue;
                }

                // compare cards and add/remove
                compareCards(token, orgId, fioUmed, loginUmed, response.id, response.cards, codeKeySigur);
                foundUsersinIiko.push(response);
                continue;
            }
        }
    }
    console.log(`Found users in iiko db: ${foundUsersinIiko.length}`);
    return foundUsersinIiko;
}

async function syncUsers(sigurUsers) {
    try {
        console.log('Sync job started');
        const umedUsers = await umed.getStudents(umedToken);
        console.log(`Total users in umed: ${umedUsers.length}`);

        const token = await iiko.getToken(iikoApi);
        const orgId = await iiko.getOrgId(token);

        console.log('Comparing user between Sigur and Umed');
        const compareResult = await compareUsers(umedUsers, sigurUsers, token, orgId);
        console.log('Comparing job finished');
        dumpToJsonFile('iikoUsers.json', compareResult);
    } catch (error) {
        console.log(error);
    }
}

sigur.getPersonal('%туден%', sigurUsers => {
    console.log(`Total users in sigur: ${sigurUsers.length}`);
    syncUsers(sigurUsers);
    dumpToJsonFile('personal.json', sigurUsers);
});

