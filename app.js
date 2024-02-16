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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const dumpToJson = (filename, data) => {
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
    await delay(300);
    await iiko.addCard(token, orgId, customerId, newCard);
    //console.log(`User: ${fio} (${phone}) newCard: ${newCard}`);

    const cardsToRemove = userCards
        .filter(card => card.number !== newCard)
        .map(card => card.number);

    if (cardsToRemove.length > 0) {
        console.log('cards to remove:');
        console.log(cardsToRemove);
    }

    for (let cardNumber of cardsToRemove) {
        console.log(`User: ${fio} (${phone}) removing card: ${cardNumber}`);
        await delay(300);
        await iiko.removeCard(token, orgId, customerId, cardNumber);
    }
}

// Compare Sigur users and Umed users
async function compareUsers(umedUsers, sigurUsers, token, orgId) {
    console.log('Comparing job started');
    const foundUsersinIiko = [];

    // Iterate through each user from umedUsers
    for (const umedUser of umedUsers) {
        const { NAME: firstNameUmed, LAST_NAME: lastNameUmed, SECOND_NAME: secondNameUmed, LOGIN: loginUmed } = umedUser;
        const fioUmed = `${lastNameUmed} ${firstNameUmed} ${secondNameUmed}`;

        // Iterate through each user from sigurUsers
        for (const sigurUser of sigurUsers) {
            const { NAME: fioSigur, CODEKEY: codeKeySigur } = sigurUser;

            // Calculate similarity between names
            const similarity = stringSimilarity(fioUmed, fioSigur);

            // If similarity is greater than 0.95, consider it a match
            if (similarity > 0.95) {
                // Search user in iiko
                await delay(300);
                const response = await iiko.getCustomerInfo(token, orgId, loginUmed);

                // If user not found in iiko, create and add to category
                if (response === 400) {
                    console.log(`Creating user ${loginUmed}`);
                    await delay(300);
                    const customerId = await iiko.createUser(token, orgId, loginUmed, firstNameUmed, lastNameUmed, secondNameUmed, codeKeySigur);

                    if (customerId) {
                        console.log(`Created user with id: ${customerId.id}`);
                    }

                    console.log(`Adding user ${loginUmed} to student category`);
                    await delay(300);
                    const userInCategory = await iiko.addUserToCategory(token, orgId, customerId.id, iikoCategoryId);

                    if (userInCategory) {
                        console.log(`User ${loginUmed} added to category`);
                    }

                    continue;
                }

                // If user found in iiko, compare cards and add/remove
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
        dumpToJson('iikoUsers.json', compareResult);
    } catch (error) {
        console.log(error);
    }
}

sigur.getPersonal(sigurUsers => {
    console.log(`Total users in sigur: ${sigurUsers.length}`);
    syncUsers(sigurUsers);
    dumpToJson('personal.json', sigurUsers);
});

