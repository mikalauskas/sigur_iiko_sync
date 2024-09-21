const utils = require('./utils.js');
const dotenv = require('dotenv');
dotenv.config();

const dry_run = process.env.DRY_RUN > 0;
const iikoApi = process.env.IIKO_API;
const iikoOrgId = process.env.IIKO_ORG_ID;
const iikoCategoryId = process.env.IIKO_STUDENT_CATEGORY;

module.exports = class Iiko {
  #token;

  constructor() {
    this._apiLogin = iikoApi;
    this._iikoCategoryId = iikoCategoryId;
    this.#initialize();
  }

  async #initialize() {
    await this.#getToken();
  }

  async #getToken() {
    const headersList = {
      'Content-Type': 'application/json',
    };

    const bodyContent = JSON.stringify({
      apiLogin: this._apiLogin,
    });

    try {
      const response = await fetch('https://api-ru.iiko.services/api/1/access_token', {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      });

      if (response.ok) {
        const data = await response.json();

        this.#token = data['token'];
      }
    } catch (err) {
      console.error('iiko: Error getting token:', err.message);
    }
  }

  async getCustomerInfo(phone, type) {
    // await Promise.all([this.#getToken()]);

    await utils.delay(Math.floor(Math.random() * (1000 - 500 + 1)) + 500);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: iikoOrgId,
      type: type,
      phone: phone,
    });

    try {
      const response = await fetch(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info',
        {
          method: 'POST',
          body: bodyContent,
          headers: headersList,
        },
      );

      if (!response.ok) {
        const result = await response.json();
        if (result?.errorDescription || result?.message)
          console.error(
            `iiko: getCustomerInfo error: ${result?.errorDescription || result?.message}`,
          );
        return false;
      } else {
        const result = await response.json();
        return result;
      }
    } catch (err) {
      console.error('iiko: Error getting customer info:', err.message);
    }
  }

  async addCard(customerId, cardNumber) {
    if (dry_run) return true;

    await utils.delay(Math.floor(Math.random() * (1000 - 500 + 1)) + 500);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: iikoOrgId,
      customerId: customerId,
      cardTrack: cardNumber,
      cardNumber: cardNumber,
    });

    try {
      const response = await fetch(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/card/add',
        {
          method: 'POST',
          body: bodyContent,
          headers: headersList,
        },
      );

      if (!response.ok) {
        const result = await response.json();
        if (result?.errorDescription || result?.message)
          console.error(
            `iiko: addCard error: ${result?.errorDescription || result?.message}`,
          );
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.error('iiko: addCard', 'Error during fetch:', err.message);
    }
  }

  async removeCard(customerId, cardNumber) {
    if (dry_run) return true;

    await utils.delay(Math.floor(Math.random() * (1000 - 500 + 1)) + 500);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: iikoOrgId,
      customerId: customerId,
      cardTrack: cardNumber,
    });

    try {
      const response = await fetch(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/card/remove',
        {
          method: 'POST',
          body: bodyContent,
          headers: headersList,
        },
      );

      if (!response.ok) {
        const result = await response.json();
        if (result?.errorDescription || result?.message)
          console.error(
            `iiko: removeCard error: ${result?.errorDescription || result?.message}`,
          );
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  async createUser(user) {
    if (dry_run) return true;

    await utils.delay(Math.floor(Math.random() * (1000 - 500 + 1)) + 500);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const nameParts = user.fullname.split(' ');

    const [lastName, firstName, secondName] = nameParts;

    const bodyContent = JSON.stringify({
      organizationId: iikoOrgId,
      phone: user.phone,
      email: user.email,
      name: firstName,
      surName: lastName,
      middleName: secondName,
      cardTrack: user.sigur_key,
      cardNumber: user.sigur_key,
      userData: user.student_id,
      shouldReceivePromoActionsInfo: true,
      consentStatus: 1,
    });

    try {
      const response = await fetch(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
        {
          method: 'POST',
          body: bodyContent,
          headers: headersList,
        },
      );

      if (!response.ok) {
        const result = await response.json();
        if (result?.errorDescription || result?.message)
          console.error(
            `iiko: createUser error: ${result?.errorDescription || result?.message}`,
          );
        return false;
      } else {
        const result = await response.json();
        return result;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  async updateUser(id, user) {
    if (dry_run) return true;
    if (!id) return false;

    await utils.delay(Math.floor(Math.random() * (1000 - 500 + 1)) + 500);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const nameParts = user.fullname.split(' ');

    const [lastName, firstName, secondName] = nameParts;

    const bodyContent = JSON.stringify({
      organizationId: iikoOrgId,
      id: id,
      phone: user.phone,
      email: user.email,
      name: firstName,
      surName: lastName,
      middleName: secondName,
      cardTrack: user.sigur_key,
      cardNumber: user.sigur_key,
      userData: user.student_id,
      shouldReceivePromoActionsInfo: true,
      consentStatus: 1,
    });

    try {
      const response = await fetch(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
        {
          method: 'POST',
          body: bodyContent,
          headers: headersList,
        },
      );

      if (!response.ok) {
        const result = await response.json();
        if (result?.errorDescription || result?.message)
          console.error(
            `iiko: updateUser error: ${result?.errorDescription || result?.message}`,
          );
        return false;
      } else {
        const result = await response.json();
        return result;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  async addUserToCategory(customerId) {
    if (dry_run) return true;

    await utils.delay(Math.floor(Math.random() * (1000 - 500 + 1)) + 500);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: iikoOrgId,
      customerId: customerId,
      categoryId: this._iikoCategoryId,
    });

    try {
      const response = await fetch(
        'https://api-ru.iiko.services/api/1/loyalty/iiko/customer_category/add',
        {
          method: 'POST',
          body: bodyContent,
          headers: headersList,
        },
      );

      if (response.ok) {
        return true;
      }
      return false;
    } catch (err) {
      console.error(err.message);
    }
  }
  /**
   * Compare Sigur users and Umed users
   * @date 2/20/2024 - 1:58:43 PM
   * @param {Array} CUsers array
   * @param {Array} sigurUsers array
   * @async
   * @returns {Array} array
   */
  async syncIiko(CUsers = [], sigurUsers = []) {
    if (utils.isArrayEmpty(CUsers) || utils.isArrayEmpty(sigurUsers)) return false;
    console.log('syncIiko job started');

    const valid1CUsers = CUsers.filter((user) => user.phone && user.status === 'Студент');

    const sigurActiveUsers = sigurUsers.filter((user) => user.sigur_last_active);

    const mergedSigur1CUsers = utils.mergeArraysUsingSimilarity(
      valid1CUsers,
      sigurActiveUsers,
      'fullname',
      'sigur_fullname',
    );

    const iikoUsers = [];

    const validUsers = mergedSigur1CUsers.filter(
      (user) => user.sigur_key && user.sigur_key !== '00000000000000',
    );

    for (const user of validUsers) {
      const iikoUser = await this.getCustomerInfo(user.phone, 'phone');
      const iikoUser2 = await this.getCustomerInfo(user.sigur_key, 'cardTrack');
      if (iikoUser?.id && iikoUser2?.id && iikoUser.id !== iikoUser2.id) {
        if (await this.removeCard(iikoUser2.id, user.sigur_key)) {
          console.log(
            `iiko: double user, removed card ${user.phone} ${user.fullname} ${card.number}`,
          );
        }
      }
      if (iikoUser?.id) {
        const cardsToRemove = iikoUser.cards
          .filter((card) => card.number !== user.sigur_key)
          .map((card) => card.number);

        if (cardsToRemove.length > 0) {
          for (const card of cardsToRemove) {
            if (await this.removeCard(iikoUser.id, card)) {
              console.log(`iiko: removed card ${user.phone} ${user.fullname} ${card}`);
            }
          }
        }

        // UPDATE USER
        const updateResult = await this.updateUser(iikoUser.id, user);
        /* if (updateResult?.id) {
          console.log(
            `iiko: updated user ${user.phone} ${user.fullname} new card: ${user.sigur_key} old cards:`,
            iikoUser?.cards,
          );
        } */
        iikoUsers.push(iikoUser);

        /* const userCard = iikoUser.cards.filter((card) => card.number === user.sigur_key);

        if (userCard.length < 1) {
          if (await this.addCard(iikoUser.id, user.sigur_key)) {
            console.log(
              `iiko: added card ${user.phone} ${user.fullname} ${user.sigur_key}`,
            );
          }
        } */
      } else {
        // CREATE USER
        const createdUser = await this.createUser(user);
        if (createdUser?.id) {
          console.log(
            `iiko: created user: ${user.phone} ${user.fullname} ${user.sigur_key}`,
          );

          if (await this.addUserToCategory(createdUser.id)) {
            console.log(
              `iiko: added user to category ${user.phone} ${user.fullname} ${createdUser.id}`,
            );
          }
        } else {
          continue;
        }
      }
    }

    await utils.writeToJson('iikoUsers.json', iikoUsers);
    console.log(`Total users in iiko: ${iikoUsers.length}`);
    console.log('syncIiko job finished');
    return iikoUsers;
  }
};
