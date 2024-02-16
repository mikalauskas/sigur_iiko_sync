async function getToken(api) {
    const headersList = {
        'Content-Type': 'application/json'
    }

    const bodyContent = JSON.stringify({
        'apiLogin': api
    });

    const response = await fetch('https://api-ru.iiko.services/api/1/access_token', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });
    try {
        if (response.ok) {
            const data = await response.json();

            return data['token'];
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function getOrgId(token) {
    const headersList = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    }

    const bodyContent = JSON.stringify({

    });

    const response = await fetch('https://api-ru.iiko.services/api/1/organizations', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });
    try {
        if (response.ok) {
            const data = await response.json();
            for (let org of data['organizations']) {
                if (org['name'] === 'ИП Винников') {
                    return org['id'];
                }
            }
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function getCustomerInfo(token, orgId, phone) {

    const headersList = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    }

    const bodyContent = JSON.stringify({
        'organizationId': orgId,
        'type': 'phone',
        'phone': phone,
    });

    const response = await fetch('https://api-ru.iiko.services/api/1/loyalty/iiko/customer/info', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });


    try {
        if (!response.ok) {
            console.error(`HTTP error! Status: ${response.status}`);
            return response.status;
        } else {
            const data = await response.json();
            return data;
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function addCard(token, orgId, customerId, cardNumber) {
    const headersList = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    }

    const bodyContent = JSON.stringify({
        'organizationId': orgId,
        'customerId': customerId,
        'cardTrack': cardNumber,
        'cardNumber': cardNumber,
    });

    const response = await fetch('https://api-ru.iiko.services/api/1/loyalty/iiko/customer/card/add', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });
    try {
        if (response.ok) {
            const data = await response.json();

            return data;
        } else {
            console.error(`HTTP error! Status: ${response.status}`);
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function removeCard(token, orgId, customerId, cardNumber) {
    const headersList = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    }

    const bodyContent = JSON.stringify({
        'organizationId': orgId,
        'customerId': customerId,
        'cardTrack': cardNumber,
    });

    const response = await fetch('https://api-ru.iiko.services/api/1/loyalty/iiko/customer/card/remove', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });
    try {
        if (response.ok) {
            const data = await response.json();

            return data;
        } else {
            console.error(`HTTP error! Status: ${response.status}`);
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function createUser(token, orgId, phone, name, surName, middleName, cardNumber) {
    const headersList = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    }

    const bodyContent = JSON.stringify({
        'organizationId': orgId,
        'phone': phone,
        'name': name,
        'surName': surName,
        'middleName': middleName,
        'cardTrack': cardNumber,
        'cardNumber': cardNumber,
    });

    const response = await fetch('https://api-ru.iiko.services/api/1/loyalty/iiko/customer/create_or_update', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });
    try {
        if (response.ok) {
            const data = await response.json();

            return data;
        } else {
            console.error(`HTTP error! Status: ${response.status}`);
        }
    } catch (err) {
        console.error(err.message);
    }
}

async function addUserToCategory(token, orgId, customerId, categoryId) {
    const headersList = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    }

    const bodyContent = JSON.stringify({
        'organizationId': orgId,
        'customerId': customerId,
        'categoryId': categoryId,
    });

    const response = await fetch('https://api-ru.iiko.services/api/1/loyalty/iiko/customer_category/add', {
        method: 'POST',
        body: bodyContent,
        headers: headersList
    });
    try {
        if (response.ok) {
            const data = await response.json();

            return data;
        } else {
            console.error(`HTTP error! Status: ${response.status}`);
        }
    } catch (err) {
        console.error(err.message);
    }
}

module.exports = { getToken, getOrgId, getCustomerInfo, addCard, removeCard, createUser, addUserToCategory };