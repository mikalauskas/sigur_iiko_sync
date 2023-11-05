const fs = require('fs');
const Sigur = require('./sigur.js');
const umed = require('./umed.js');
const iiko = require('./iiko.js');
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
	console.log(`Writing data to ${filename}`);
	fs.writeFile(filename, JSON.stringify(data, null, 4), err => {
		if (err) {
			console.error(err);
		}
	});
};

// Compare cards of iiko users
// Add a new card, remove old cards
async function compareCards(token, orgId, fio, phone, customerId, userCards, newCard) {
	for (let i in userCards) {
		if (userCards[i].number !== newCard) {
			console.log(`User's: ${fio} (${phone}) current card: ${userCards[i].number}, newcard: ${newCard}`);
			iiko.removeCard(token, orgId, customerId, userCards[i].number);
			iiko.addCard(token, orgId, customerId, newCard);
		}
	}
} 

// Compare Sigur users and Umed users
async function compareUsers(user1, user2, token, orgId) {
	try {
		console.log('Comparing job started');
		let foundUsersinIiko = [];
		let fio = undefined;
		for (let i in user1) {
			fio = user1[i]['LAST_NAME'] + ' ' + user1[i]['NAME'] + ' ' + user1[i]['SECOND_NAME'];
			for (let j in user2) {
				let compare = stringSimilarity(fio, user2[j]['NAME'])
				if (compare > 0.95) {
					let res = await iiko.getCustomerInfo(token, orgId, user1[i]['LOGIN']);
					if (res.message) {
						// Create user in iiko
						console.log(res.message);
						console.log(`Creating user ${user1[i]['LOGIN']}`);
						let customerId = await iiko.createUser(token, orgId, user1[i]['LOGIN'], user1[i]['NAME'], user1[i]['LAST_NAME'], user1[i]['SECOND_NAME'], user2[j]['CODEKEY']);
						console.log(`User id: ${customerId['id']}`);
						console.log(`Adding user ${user1[i]['LOGIN']} to student category`);
						let userInCategory = await iiko.addUserToCategory(token, orgId, customerId['id'], iikoCategoryId);
						if (userInCategory) console.log(`User ${user1[i]['LOGIN']} added to category`);
						continue;	
					}
					// compare cards and add/remove
					compareCards(token, orgId, fio, user1[i]['LOGIN'], res.id, res.cards, user2[j]['CODEKEY']);
					foundUsersinIiko.push(res);
					continue;
				}
			}
		}
		console.log(`Found users in iiko db: ${foundUsersinIiko.length}`)
		return foundUsersinIiko;
	} catch (error) {
		console.log(error);
	}
}

async function syncUsers(sigurUsers) {
	try {
		console.log('Sync job started');
		const umedUsers = await umed.getStudents(umedToken);
		console.log(`Total users in umed: ${umedUsers.length}`)

		const token = await iiko.getToken(iikoApi);
		const orgId = await iiko.getOrgId(token);

		console.log('Comparing user between Sigur and Umed');
		const compareResult =  await compareUsers(umedUsers, sigurUsers, token, orgId);
		console.log('Comparing job finished');
		dumpToJsonFile('iikoUsers.json', compareResult);
	} catch (error) {
		console.log(error);
	}
}

sigur.getPersonal(sigurUsers => {
	console.log(`Total users in sigur: ${sigurUsers.length}`);
	syncUsers(sigurUsers);
	dumpToJsonFile('personal.json', sigurUsers);
});

