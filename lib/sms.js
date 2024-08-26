const dotenv = require('dotenv');
const utils = require('./utils.js');
dotenv.config();

const token = process.env.SMSINT_TOKEN;
const endpoint = 'https://lcab.smsint.ru/json/v1.0/sms/';

/**
 * Sends a message to the specified chat or phone number.
 * @async
 * @param {Object} data - The data object containing message details.
 * @param {string} data.phone - The phone number. Either this or `chatId` must be provided.
 * @param {string} [data.text] - The text content of the message.
 * @returns {Promise<*>|boolean} A promise resolving to the response data upon success, or `false` if there was a 400 error.
 * @throws {Error} If neither `chatId` nor `phone` is provided, or if neither `text` nor `contentUri` is provided.
 */
const sendMessage = async (data) => {
  if (!data?.text || !data?.phone) {
    console.error('sms: Either text or phone must be provided');
    return false;
  }

  if (!token) {
    console.error('sms: token must be provided');
    return false;
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Token': token,
  };

  const url = new URL('send/text', endpoint);

  const body = {
    messages: [
      {
        recipient: data.phone,
        text: data.text,
      },
    ],
  };

  // delay before sending sms
  await utils.delay(Math.floor(Math.random() * (60000 - 15000 + 1)) + 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: headers,
    });

    if (!response.ok) {
      const result = await response.json();
      console.log(`sms: error: ${data.phone}`, result.error.descr);

      return false;
    } else {
      const result = await response.json();
      console.log(`sms: sent message to ${data.phone}: ${data.text}`);

      // return message id of sent message
      return result.messages[0].id;
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports = { sendMessage };
