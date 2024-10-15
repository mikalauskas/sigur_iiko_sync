const utils = require('./utils.js');
const sms = require('./sms.js');
const dotenv = require('dotenv');
dotenv.config();
const dry_run = Number(process.env.DRY_RUN) > 0;

const token = process.env.WAZZUP_API;
const endpoint = 'https://api.wazzup24.com/v3/';

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
      console.error('wa: error getiing channel id', await response.json());
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
 * @returns {Promise<*|boolean>} A promise resolving to the response data upon success, or `false` if there was a 400 error.
 * @throws {Error} If neither `chatId` nor `phone` is provided, or if neither `text` nor `contentUri` is provided.
 */
const sendMessage = async (data) => {
  if (dry_run) return true;

  const channels = await getChannelId();

  const whatsAppId = channels.find(
    (el) => el.transport === 'whatsapp' && el.state === 'active',
  )?.channelId;
  const telegramId = channels.find(
    (el) => el.transport === 'tgapi' && el.state === 'active',
  )?.channelId;
  const viberId = channels.find(
    (el) => el.transport === 'viber' && el.state === 'active',
  )?.channelId;

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
    // await utils.delay(Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
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
      // await utils.delay(Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(bodyContent),
        headers: headersList,
      });

      if (!response.ok) {
        result = await response.json();
      } else {
        result = await response.json();
        console.log(
          `wazzup: sent message to telegram: ${data.phone}: ${bodyContent.text}`,
        );

        return result;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  // send viber
  if (!result?.messageId && viberId) {
    bodyContent.channelId = viberId;
    bodyContent.chatType = 'viber';
    bodyContent.chatId = data.phone;
    delete bodyContent.phone;

    try {
      // await utils.delay(Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(bodyContent),
        headers: headersList,
      });

      if (!response.ok) {
        result = await response.json();
      } else {
        result = await response.json();
        console.log(`wazzup: sent message to viber: ${data.phone}: ${bodyContent.text}`);

        return result;
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  // send sms
  if (!result?.messageId) {
    // await utils.delay(Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000);
    sms.sendMessage({
      phone: bodyContent.phone,
      text: bodyContent.text,
    });
  }
};

module.exports = { sendMessage };
