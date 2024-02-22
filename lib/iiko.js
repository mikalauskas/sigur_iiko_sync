const utils = require('./utils.js');

module.exports = class Iiko {
  #token;
  #orgId;

  constructor(apiLogin, iikoCategoryId) {
    this._apiLogin = apiLogin;
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

    const response = await fetch('https://api-ru.iiko.services/api/1/access_token', {
      method: 'POST',
      body: bodyContent,
      headers: headersList,
    });
    try {
      if (response.ok) {
        const data = await response.json();

        this.#token = data['token'];
      }
    } catch (err) {
      console.error('Error getting token:', err.message);
    }
  }

  async #getOrgId() {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({});

    const response = await fetch('https://api-ru.iiko.services/api/1/organizations', {
      method: 'POST',
      body: bodyContent,
      headers: headersList,
    });
    try {
      if (response.ok) {
        const data = await response.json();
        const organization = data['organizations'].find(
          (org) => org['name'] === 'ИП Винников',
        );

        if (organization) {
          this.#orgId = organization.id;
        } else {
          console.error('Organization not found with the specified name.');
        }
      }
    } catch (err) {
      console.error('Error getting organization ID:', err.message);
    }
  }

  async getCustomerInfo(phone) {
    while (!this.#token) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Adjust the delay as needed
    }
    while (!this.#orgId) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Adjust the delay as needed
    }

    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
      type: 'phone',
      phone: phone,
    });

    const response = await fetch(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info',
      {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      },
    );

    try {
      if (!response.ok) {
        if (response.status === 400) {
          /* const error = await response.json();
          console.log('getCustomerInfo', error.message); */
          return false;
        } else {
          console.error('getCustomerInfo', `HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error('Error getting customer info:', err.message);
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

    const response = await fetch(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/card/add',
      {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      },
    );

    try {
      if (!response.ok) {
        if (response.status === 400) {
          /* const error = await response.json();
          console.log('addCard', error.message); */
          return false;
        } else {
          console.error('addCard', `HTTP error! Status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error(err.message);
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

    const response = await fetch(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/card/remove',
      {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      },
    );

    try {
      if (!response.ok) {
        if (response.status === 400) {
          /* const error = await response.json();
          console.log('removeCard', error.message); */
          return false;
        } else {
          console.error('removeCard', `HTTP error! Status: ${response.status}`);
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

    const [surName, name, middleName] = nameParts;

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
      phone: user.phone,
      name: name,
      surName: surName,
      middleName: middleName,
      cardTrack: user.sigur_key,
      cardNumber: user.sigur_key,
    });

    const response = await fetch(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update',
      {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      },
    );

    try {
      if (!response.ok) {
        if (response.status === 400) {
          /* const error = await response.json();
          console.log(error.message); */
          return false;
        } else {
          console.error('createUser: ', `HTTP error! Status: ${response.status}`);
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

    const response = await fetch(
      'https://api-ru.iiko.services/api/1/loyalty/iiko/customer_category/add',
      {
        method: 'POST',
        body: bodyContent,
        headers: headersList,
      },
    );

    try {
      if (!response.ok) {
        if (response.status === 400) {
          /* const error = await response.json();
          console.log(error.message); */
          return false;
        } else {
          console.error('addUserToCategory: ', `HTTP error! Status: ${response.status}`);
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
  async syncIiko(c1Users, sigurUsers) {
    console.log('Merging 1C data with Sigur');
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
      const foundUser = await this.getCustomerInfo(user.phone);
      if (foundUser.id) {
        //console.log(`Update: ${user.phone} ${user.fullname}`);
        iikoUsers.push(foundUser);
        const cardsToRemove = foundUser.cards
          .filter((card) => card.number !== user.sigur_key)
          .map((card) => card.number);

        if (cardsToRemove.length > 0) {
          for (const card of cardsToRemove) {
            await this.removeCard(foundUser.id, card);
          }
        }
        await this.addCard(foundUser.id, user.sigur_key);
      } else {
        const createdUser = await this.createUser(user);

        if (createdUser.id) {
          await this.addUserToCategory(createdUser.id);
        }
      }
    }

    return iikoUsers;
  }
};
