const dotenv = require('dotenv');
const utils = require('./utils.js');
const sms = require('./sms.js');
dotenv.config();

const token = process.env.WAZZUP_API;
const endpoint = 'https://api.wazzup24.com/v3/';

/**
 * Fetches the channel ID using the provided token.
 * @param {string} token - The authentication token.
 * @returns {Promise<object>} A Promise that resolves to the channel data.
 * @throws {Error} If there's an error during the fetch operation.
 */
const getChannelId = async () => {
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
 * @returns {Promise<*>|boolean} A promise resolving to the response data upon success, or `false` if there was a 400 error.
 * @throws {Error} If neither `chatId` nor `phone` is provided, or if neither `text` nor `contentUri` is provided.
 */
const sendMessage = async (data) => {
  const channels = await getChannelId(token);
  const whatsAppId = channels.find(
    (el) => el.transport === 'whatsapp' && el.state === 'active',
  ).channelId;
  const telegramId = channels.find(
    (el) => el.transport === 'tgapi' && el.state === 'active',
  ).channelId;

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

  let result;

  // send whatsapp
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(bodyContent),
      headers: headersList,
    });

    if (!response.ok) {
      result = await response.json();
    } else {
      result = await response.json();
      console.log(`wazzup: sent message to whatsapp: ${data.phone}: ${bodyContent.text}`);

      await utils.delay(Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000);

      return result;
    }
  } catch (err) {
    console.error(err.message);
  }

  // send telegram
  if (!result?.messageId) {
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
        result = await response.json();
      } else {
        const result = await response.json();
        console.log(
          `wazzup: sent message to telegram: ${data.phone}: ${bodyContent.text}`,
        );

        await utils.delay(Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000);

        return result;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  // send sms
  if (!result?.messageId) {
    sms.sendMessage({
      phone: bodyContent.phone,
      text: bodyContent.text,
    });
  }
};

module.exports = { sendMessage };
