const fs = require('node:fs/promises');
const path = require('path');
const { stringSimilarity } = require('string-similarity-js');

const delay = (ms) => {
  //console.log(`delay for ${ms} ms`);

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Group array of objects by the specified key
 * @date 2/18/2024 - 2:00:41 PM
 * @param {Array} array
 * @param {String} key
 * @returns {Array}
 */
const groupArrayByKey = (array, key) => {
  return array.reduce((result, obj) => {
    const keyValue = obj[key];

    if (!result[keyValue]) {
      result[keyValue] = [];
    }

    result[keyValue].push(obj);

    return result;
  }, {});
};

/**
 * Merge arrays of objects with one common property key
 * @param {Array} array1 array1
 * @param {Array} array2 array2
 * @param {String} commonProperty string
 */
const mergeArrays = (array1, array2, commonProperty) => {
  return array1.map((item1) => {
    const matchingItems = array2.filter(
      (item2) => item2[commonProperty] === item1[commonProperty],
    );

    // If there is a match, merge the objects
    if (matchingItems.length > 0) {
      let mergedList;
      matchingItems.forEach((item3) => {
        mergedList = Object.assign(item1, item3);
      });

      return mergedList;
    }

    // If there is no match, return the original object from array1
    return item1;
  });
};

const mergeArrays3Way = (array1, array2, commonProperty, commonProperty2) => {
  return array1.map((item1) => {
    const matchingItems = array2.filter(
      (item2) =>
        item2[commonProperty] === item1[commonProperty] &&
        item2[commonProperty2] === item1[commonProperty2],
    );

    // If there is a match, merge the objects
    if (matchingItems.length > 0) {
      let mergedList;
      matchingItems.forEach((item3) => {
        mergedList = Object.assign(item1, item3);
      });

      return mergedList;
    }

    // If there is no match, return the original object from array1
    return item1;
  });
};

/**
 * Merge arrays of objects with one common property key
 * @param {Array} array1 array1
 * @param {Array} array2 array2
 * @param {String} commonProperty1 string
 * @param {String} commonProperty2 string
 */
const mergeArraysDiff = (array1, array2, commonProperty1, commonProperty2) => {
  return array1.map((item1) => {
    const matchingItems = array2.filter(
      (item2) => item2[commonProperty2] === item1[commonProperty1],
    );

    // If there is a match, merge the objects
    if (matchingItems.length > 0) {
      let mergedList;
      matchingItems.forEach((item3) => {
        mergedList = Object.assign(item1, item3);
      });

      return mergedList;
    }

    // If there is no match, return the original object from array1
    return item1;
  });
};

const isSimilar = (string1, string2) => {
  if (!string1 || typeof string1 !== 'string') return false;
  if (!string2 || typeof string2 !== 'string') return false;

  const similar = stringSimilarity(
    string1.replace(/[^a-zA-Zа-яёА-ЯЁ]/g, '').toLowerCase(),
    string2.replace(/[^a-zA-Zа-яёА-ЯЁ]/g, '').toLowerCase(),
  );
  if (similar && Number(similar) > 0.94) return true;
  return false;
};

/**
 * Uses string-similarity-js lib.  Merge arrays of objects with 2 common properties wich similar to 0.95 and more
 * @param {Array} arr1 array1
 * @param {Array} arr2 array2
 * @param {String} prop1 string
 * @param {String} prop2 string
 */
const mergeArraysUsingSimilarity = (arr1, arr2, prop1, prop2) => {
  return arr1.map((item1) => {
    const matchingItems = arr2.filter((item2) => isSimilar(item1[prop1], item2[prop2]));

    if (matchingItems.length > 0) {
      let mergedList;
      matchingItems.forEach((item3) => {
        mergedList = Object.assign(item1, item3);
      });

      return mergedList;
    }

    return item1;
  });
};

const writeToJsonBOM = async (filename, data) => {
  if (data) {
    console.log(`Writing data to ${filename}`);
    try {
      await fs.writeFile(
        filename,
        '\ufeff' + JSON.stringify(data, null, 2).replace(/\n/g, '\r\n'),
      );
      console.log(`Data written to file ${filename}`);
    } catch (err) {
      console.error(`Error writing to file ${filename}:`, err);
    }
  }
};

/**
 * Dump array to json
 * @date 2/20/2024 - 2:04:58 PM
 * @param {Array} data array
 * @param {String} filename string
 * @async
 */
const writeToJson = async (filename, data) => {
  if (data) {
    console.log(`Writing data to ${filename}`);
    try {
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`Data written to file ${filename}`);
    } catch (err) {
      console.error(`Error writing to file ${filename}:`, err);
    }
  }
};

const stringToISODate = (date) => {
  if (!date) return null;
  const [datePart, timePart] = date.split(' ');
  const [day, month, year] = datePart.split('.');
  const [hours, minutes, seconds] = timePart.split(':');
  return new Date(year, month - 1, day, hours, minutes, seconds).toISOString();
};

const shouldFetchData = async (filePath) => {
  const TWO_DAYS_IN_MILLISECONDS = 60 * 60 * 1000; // 1 hour
  try {
    const stats = await fs.stat(filePath);
    const currentTime = new Date().getTime();
    const fileModificationTime = new Date(stats.mtime).getTime();

    // Check if the file is older than 2 days
    return currentTime - fileModificationTime > TWO_DAYS_IN_MILLISECONDS;
  } catch (error) {
    // Handle the case where the file doesn't exist or other errors
    return true;
  }
};

/**
 * Reads data from a JSON file or writes data to it if the file doesn't exist.
 * @async
 * @param {string} filename - The name of the JSON file to read from or write to.
 * @param {*} [data=''] - The data to be written to the file if the file doesn't exist.
 * @returns {Promise<Array|Object>} A promise resolving to the parsed JSON data if the file exists and contains valid JSON content, otherwise an empty array.
 * @throws {Error} If any error occurs during file access, reading, or writing.
 */
const readDataJson = async (filename) => {
  try {
    const cacheDir = path.join(process.cwd(), 'cache');
    const filePath = path.join(cacheDir, filename);

    try {
      await fs.access(cacheDir);
    } catch (err) {
      console.log(`Creating ${cacheDir}`);
      await fs.mkdir(cacheDir, { recursive: true });
    }

    try {
      await fs.access(filePath);
      //console.log(`Reading data from file: ${filename}`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (err) {
      return [];
    }
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * Reads data from a JSON file or writes data to it if the file doesn't exist.
 * @async
 * @param {string} filename - The name of the JSON file to read from or write to.
 * @param {*} [data=''] - The data to be written to the file if the file doesn't exist.
 * @returns {Promise<Array|Object>} A promise resolving to the parsed JSON data if the file exists and contains valid JSON content, otherwise an empty array.
 * @throws {Error} If any error occurs during file access, reading, or writing.
 */
const writeJsonData = async (filename, data = []) => {
  try {
    const cacheDir = path.join(process.cwd(), 'cache');
    const filePath = path.join(cacheDir, filename);

    try {
      await fs.access(cacheDir);
    } catch (err) {
      console.log(`Creating ${cacheDir}`);
      await fs.mkdir(cacheDir, { recursive: true });
    }

    try {
      await fs.access(filePath);
      ///console.log(`Writing data from file: ${filename}`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      //console.log(`creating empty file: ${filename}`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    }
  } catch (err) {
    console.error(err);
    return [];
  }
};

const isObjectEmpty = (object) => {
  return Object.keys(object).length === 0 && object.constructor === Object;
};

const isArrayEmpty = (array) => {
  return Array.isArray(array) && array.length === 0;
};

/**
 * Check if a value is empty.
 *
 * @function
 * @param {*} value - The value to check for emptiness.
 * @returns {boolean} Returns true if the value is empty, otherwise false.
 */
const isEmpty = (value) => {
  return (
    value === false ||
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (value.constructor === Object && Object.keys(value).length === 0)
  );
};

/**
 * Find a value in array of objects
 * @date 2/27/2024 - 7:40:37 PM
 *
 * @param {Array} array
 * @param {String} key
 * @param {*} value
 * @returns {Object} object
 */
const findValueInArr = (array, key, value) => {
  // Use the find method to search for an object with the specified key and value
  const foundObject = array.find((obj) => obj[key] === value);

  // Return the found object or null if not found
  return foundObject || null;
};

const betweenRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const convertDate = (dateString) => {
  const date = new Date(dateString);

  if (dateString === '0001-01-01T00:00:00') return null;

  // Extract the day, month, and year from the date object
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();

  // Format the date as DD.MM.YYYY
  const formattedDate = `${day}.${month}.${year}`;

  return formattedDate;
};

const splitById = (arr1, arr2, arr1IdKey, arr2IdKey) => {
  const arr2Ids = new Set(arr2.map((obj) => obj[arr2IdKey]));

  const found = [];
  const notFound = [];

  arr1.forEach((obj) => {
    if (arr2Ids.has(obj[arr1IdKey])) {
      found.push(obj);
    } else {
      notFound.push(obj);
    }
  });

  return { found, notFound };
};

const otherNamesEnum = ['оглы', 'оглу', 'улы', 'уулу', 'кызы', 'гызы'];

/**
 * Sanitizes and formats a full name string by:
 * - Splitting the string into words based on whitespace.
 * - Removing trailing dashes, empty parentheses, and non-alphabetic characters (excluding dashes).
 * - Capitalizing the first letter of each word, and lowercasing remaining letters.
 * - Handling hyphenated names by capitalizing the letter following the hyphen.
 *
 * @param {string} fullName - The full name to sanitize.
 * @returns {string|null} The sanitized and formatted full name, or `null` if the input is invalid (not a string or empty).
 *
 * @example
 * sanitizeFullName("john doe-smith"); // Returns "John Doe-Smith"
 * @example
 * sanitizeFullName("anna-maria o'connor"); // Returns "Anna-Maria Oconnor"
 * @example
 * sanitizeFullName("123 john"); // Returns "John"
 */
const sanitizeFullName = (fullName) => {
  if (typeof fullName !== 'string' || fullName === '') return null;

  return fullName
    .split(/\s+/u)
    .map((part) =>
      part
        .replace(/-$/, '')
        .replace(/\(-\)/, '')
        .replace(/[^a-zA-Zа-яёА-ЯЁ-]/g, ''),
    )
    .filter(Boolean)
    .map((word) => {
      if (otherNamesEnum.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      const matchDash = word.match(/.-./);
      if (Array.isArray(matchDash) && matchDash['index']) {
        const letterUp = matchDash['index'] + 2;
        return (
          word[0].toUpperCase() +
          word.substring(1, letterUp).toLowerCase() +
          word[letterUp].toUpperCase() +
          word.substring(letterUp + 1).toLowerCase()
        );
      }

      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Splits a full name into first, middle, and last parts, with any remaining parts stored in `otherNames` as a single string.
 * Handles extra spaces, tabs, and hidden whitespace characters between names.
 *
 * @param {string} fullName - The full name string to be split.
 * @returns {Object} An object with properties:
 *  - `firstName` {string} - The first part of the name.
 *  - `middleName` {string} - The middle part of the name, or an empty string if not provided.
 *  - `lastName` {string} - The last part of the name, or an empty string if not provided.
 *  - `otherNames` {string} - All remaining parts of the name from the fourth part onward, joined as a single string.
 *
 * @example
 * // Returns { firstName: 'Ali', middleName: 'Ahmed', lastName: 'Hassan', otherNames: 'Khaled Omar Ibrahim Mohammed' }
 * explodeFullName("Ali Ahmed Hassan Khaled Omar Ibrahim Mohammed");
 */
const explodeFullName = (fullName) => {
  if (typeof fullName !== 'string' || fullName === '') return null;

  const nameParts = sanitizeFullName(fullName);

  const [lastName = '', firstName = '', middleName = '', ...otherParts] =
    nameParts.split(/\s+/u);

  const otherNames = otherParts.join(' ');

  return { lastName, firstName, middleName, otherNames };
};

const titleCase = (string) => {
  if (typeof string !== 'string' || string === '') return null;

  const words = string.split(' ');

  return words
    .map((word) => {
      return word[0].toUpperCase() + word.substring(1);
    })
    .join(' ');
};

const buf2hex = (buffer) => {
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join('');
};

const removeNullUndefinedProps = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null || obj[key] === undefined) {
      delete obj[key];
    }
  });
};

module.exports = {
  delay,
  groupArrayByKey,
  mergeArrays,
  mergeArrays3Way,
  mergeArraysDiff,
  mergeArraysUsingSimilarity,
  writeToJson,
  writeToJsonBOM,
  stringToISODate,
  shouldFetchData,
  isObjectEmpty,
  isArrayEmpty,
  isEmpty,
  findValueInArr,
  betweenRandomNumber,
  readDataJson,
  writeJsonData,
  convertDate,
  splitById,
  titleCase,
  buf2hex,
  removeNullUndefinedProps,
  sanitizeFullName,
  explodeFullName,
};
