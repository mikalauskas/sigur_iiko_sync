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
        const organization = data['organizations'].find((org) => org['name'] === 'ИП Винников');

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

    const response = await fetch('https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info', {
      method: 'POST',
      body: bodyContent,
      headers: headersList,
    });

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

  async addUserToCategory(customerId, categoryId) {
    const headersList = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.#token,
    };

    const bodyContent = JSON.stringify({
      organizationId: this.#orgId,
      customerId: customerId,
      categoryId: categoryId,
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
};
