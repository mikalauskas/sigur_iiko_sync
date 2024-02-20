const fs = require('node:fs/promises');
const { stringSimilarity } = require('string-similarity-js');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const matchingItems = array2.filter((item2) => item2[commonProperty] === item1[commonProperty]);

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

/**
 * Uses string-similarity-js lib.  Merge arrays of objects with 2 common properties wich similar to 0.95 and more
 * @param {Array} array1 array1
 * @param {Array} array2 array2
 * @param {String} commonProperty1 string
 * @param {String} commonProperty2 string
 */
const mergeArraysUsingSimilarity = (array1, array2, commonProperty1, commonProperty2) => {
  return array1.map((item1) => {
    const matchingItems = array2.filter((item2) => {
      if (item1[commonProperty1] && item2[commonProperty2]) {
        const similarity = stringSimilarity(item1[commonProperty1], item2[commonProperty2]);

        if (similarity > 0.95) return true;
        return false;
      }
    });

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

const writeToJsonBOM = async (filename, data) => {
  if (data) {
    console.log(`Writing data to ${filename}`);
    await fs.writeFile(
      filename,
      '\ufeff' + JSON.stringify(data, null, 2).replace(/\n/g, '\r\n'),
      (err) => {
        if (err) {
          console.error('Error writing to file:', err);
        } else {
          console.log('Data written to file');
        }
      },
    );
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
    await fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('Data written to file');
      }
    });
  }
};

module.exports = {
  delay,
  groupArrayByKey,
  mergeArrays,
  mergeArraysDiff,
  mergeArraysUsingSimilarity,
  writeToJson,
  writeToJsonBOM,
};
