const utils = require('./utils.js');
const dotenv = require('dotenv');
dotenv.config();

const iikoApi = process.env.IIKO_API;
const iikoCategoryId = process.env.IIKO_STUDENT_CATEGORY;

module.exports = class Iiko {
  #token;
  #orgId;

  constructor() {
    this._apiLogin = iikoApi;
    this._iikoCategoryId = iikoCategoryId;
    this.#initialize();
  }

  async #initialize() {
    await this.#getToken();
    await this.#getOrgId();
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

  async #getOrgId() {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({});

    try {
      const response = await fetch('https://api-ru.iiko.services/api/1/organizations', {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      });

      if (response.ok) {
        const data = await response.json();
        const organization = data['organizations'][data['organizations'].length - 1];

        if (organization) {
          this.#orgId = organization.id;
        } else {
          console.error('iiko: Organization not found with the specified name.');
          return false;
        }
      }
    } catch (err) {
      console.error('iiko: Error getting organization ID:', err.message);
    }
  }

  async getCustomerInfo(phone) {
    await Promise.all([this.#getToken(), this.#getOrgId()]);

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
      type: 'phone',
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
        if (response.status === 400) {
          /* const error = await response.json();
          console.log('getCustomerInfo', error.message); */
          return false;
        } else {
          console.error(
            'iiko: getCustomerInfo',
            `HTTP error! Status: ${response.status}`,
          );
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error('iiko: Error getting customer info:', err.message);
    }
  }

  async addCard(customerId, cardNumber) {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
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
        if (response.status === 400) {
          /* const error = await response.json();
          console.log('addCard', error.message); */
          return false;
        } else {
          console.error('iiko: addCard', `HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error('iiko: addCard', 'Error during fetch:', err.message);
    }
  }

  async removeCard(customerId, cardNumber) {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
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
        if (response.status === 400) {
          /* const error = await response.json();
          console.log('removeCard', error.message); */
          return false;
        } else {
          console.error('iiko: removeCard', `HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  async createUser(user) {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const nameParts = user.fullname.split(' ');

    const [lastName, firstName, secondName] = nameParts;

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
      phone: user.phone,
      name: firstName,
      surName: lastName,
      middleName: secondName,
      cardTrack: user.sigur_key,
      cardNumber: user.sigur_key,
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
        if (response.status === 400) {
          /* const error = await response.json();
          console.log(error.message); */
          return false;
        } else {
          console.error('iiko: createUser: ', `HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  async addUserToCategory(customerId) {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
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

      if (!response.ok) {
        if (response.status === 400) {
          /* const error = await response.json();
          console.log(error.message); */
          return false;
        } else {
          console.error(
            'iiko: addUserToCategory: ',
            `HTTP error! Status: ${response.status}`,
          );
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error(err.message);
    }
  }
  /**
   * Compare Sigur users and Umed users
   * @date 2/20/2024 - 1:58:43 PM
   * @param {Array} c1Users array
   * @param {Array} sigurUsers array
   * @async
   * @returns {Array} array
   */
  async syncIiko(c1Users = [], sigurUsers = []) {
    if (utils.isArrayEmpty(c1Users) || utils.isArrayEmpty(sigurUsers)) return false;
    console.log('syncIiko job started');
    const users = utils.mergeArraysUsingSimilarity(
      c1Users,
      sigurUsers,
      'fullname',
      'sigur_fullname',
    );

    const iikoUsers = [];

    const usersToSync = users.filter(
      (user) => user.phone && user.sigur_key && user.status === 'Студент',
    );

    // Iterate through each user
    for (const user of usersToSync) {
      const iikoUser = await this.getCustomerInfo(user.phone);
      if (!utils.isEmpty(iikoUser) && iikoUser.id) {
        iikoUsers.push(iikoUser);
        const cardsToRemove = iikoUser.cards
          .filter((card) => card.number !== user.sigur_key)
          .map((card) => card.number);

        if (cardsToRemove.length > 0) {
          for (const card of cardsToRemove) {
            if (card) {
              console.log(`iiko: Update: ${user.phone} ${user.fullname}`);
              console.log(`iiko: remove card ${card.number}`);
              await this.removeCard(iikoUser.id, card);
            }
          }
        }

        const userCard = iikoUser.cards.filter((card) => card.number === user.sigur_key);

        if (userCard.length < 1) {
          console.log(`iiko: Update: ${user.phone} ${user.fullname}`);
          console.log(`iiko: add card ${user.sigur_key}`);
          await this.addCard(iikoUser.id, user.sigur_key);
        }
      } else {
        console.log(`iiko: Update: ${user.phone} ${user.fullname}`);
        console.log(`iiko: Create: ${user.phone} ${user.fullname}`);
        const createdUser = await this.createUser(user);

        if (!utils.isEmpty(createdUser) && createdUser.id) {
          console.log(`iiko: Update: ${user.phone} ${user.fullname}`);
          console.log(`iiko: addusertocategory ${createdUser.id}`);
          await this.addUserToCategory(createdUser.id);
        } else {
          continue;
        }
      }
    }

    utils.writeToJson('iikoUsers.json', await iikoUsers);
    console.log(`Total users in iiko: ${iikoUsers.length}`);
    console.log('syncIiko job finished');
    return iikoUsers;
  }
};
