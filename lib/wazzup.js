const endpoint = 'https://api.wazzup24.com/v3/';

const getChannelId = async (token) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const url = new URL('channels', endpoint);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headersList,
    });

    if (!response.ok) {
      console.error(await response.json());
    } else {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.error(err.message);
  }
};

/**
 * Sends a message to the specified chat or phone number.
 * @async
 * @param {Object} data - The data object containing message details.
 * @param {string} data.phone - The phone number. Either this or `chatId` must be provided.
 * @param {string} [data.text] - The text content of the message.
 * @param {string} [data.contentUri] - The content URI of the message.
 * @returns {Promise<*>} A promise resolving to the response data upon success, or `false` if there was a 400 error.
 * @throws {Error} If neither `chatId` nor `phone` is provided, or if neither `text` nor `contentUri` is provided.
 */
const sendMessage = async (token, data) => {
  const channels = await getChannelId(token);
  const whatsAppId = channels.find((el) => el.transport === 'whatsapp').channelId;
  const telegramId = channels.find((el) => el.transport === 'tgapi').channelId;

  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };

  const url = new URL('message', endpoint);

  const bodyContent = {
    channelId: whatsAppId,
    chatType: 'whatsapp',
    chatId: data.phone,
  };

  if (data.text) {
    bodyContent.text = data.text;
  } else if (data.contentUri) {
    bodyContent.contentUri = data.contentUri;
  } else {
    throw new Error('Either text or contentUri must be provided');
  }

  let WAresponse;

  console.log(bodyContent);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(bodyContent),
      headers: headersList,
    });

    if (!response.ok) {
      const data = await response.json();
      WAresponse = data.status;
    } else {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.error(err.message);
  }

  if (WAresponse !== 200) {
    bodyContent.channelId = telegramId;
    bodyContent.chatType = 'telegram';
    bodyContent.phone = data.phone;
    delete bodyContent.chatId;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(bodyContent),
        headers: headersList,
      });

      if (!response.ok) {
        const data = await response.json();
        return false;
      } else {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error(err.message);
    }
  }
};

module.exports = { sendMessage };
