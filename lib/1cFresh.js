const {
  groupArrayByKey,
  mergeArrays,
  shouldFetchData,
  isObjectEmpty,
  isArrayEmpty,
  writeToJson,
  isEmpty,
} = require('./utils.js');
const fs = require('node:fs/promises');
const path = require('path');
const parsePhoneNumber = require('libphonenumber-js/mobile');
const emailValidator = require('email-validator');

let C1FreshUrl = '';
let C1FreshLogin = '';
let C1FreshPassword = '';

const queryOdata = async (catalog) => {
  if (!catalog) return false;

  const headersList = {
    Accept: 'application/json',
    Authorization:
      'Basic ' + Buffer.from(C1FreshLogin + ':' + C1FreshPassword).toString('base64'),
  };

  console.log(`Fetching data: ${catalog}`);

  const response = await fetch(C1FreshUrl + '/odata/standard.odata/' + catalog, {
    method: 'GET',
    headers: headersList,
  });

  try {
    if (response.ok) {
      const data = await response.json();

      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

/**
 * Send patch data to catalog endpoint
 * @date 3/5/2024 - 6:15:29 PM
 *
 * @async
 * @param {String} catalog Catalog_Специальности
 * @param {Number} id 89c519f9-e761-11ea-8101-e0d55e04ef59
 * @param {Object} data {Description: 'Стоматология ортопедическая'}
 * @returns {Object}
 */
const sendOdata = async (catalog, id, data) => {
  if (!catalog && !id && isObjectEmpty(data)) return false;

  const headersList = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify(data);

  console.log(`Sending data: ${catalog} ${id}`);

  try {
    const response = await fetch(
      `http://192.168.0.7/umk/odata/standard.odata/${catalog}(guid'${id}')`,
      {
        method: 'PATCH',
        headers: headersList,
        body: body,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to patch resource ${await response.text()}`);
    }

    const res = await response.json();

    return res;
  } catch (error) {
    console.error('Error during patch request:', error.message);
  }
};

/**
 * Send patch data to catalog endpoint (Contact info)
 * @date 3/5/2024 - 6:15:29 PM
 *
 * @async
 * @param {String} catalog Catalog_Специальности
 * @param {Number} id 89c519f9-e761-11ea-8101-e0d55e04ef59
 * @param {Object} data {Description: 'Стоматология ортопедическая'}
 * @returns {Object}
 */
const sendOdataContactInfo = async (catalog, id, LineNumber, data) => {
  if (!catalog && !id && isObjectEmpty(data)) return false;

  const headersList = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify(data);

  console.log(`Sending data: ${catalog}(guid'${id}')`, body);

  try {
    const response = await fetch(
      `http://192.168.0.7/umk/odata/standard.odata/${catalog}(Ref_Key=guid'${id}',LineNumber=` +
        Number(LineNumber) +
        '})',
      {
        method: 'PATCH',
        headers: headersList,
        body: body,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to patch resource ${await response.text()}`);
    }

    const res = await response.json();

    console.log(res);

    return res;
  } catch (error) {
    console.error('Error during patch request:', error.message);
  }
};

/**
 * Constructs students object
 * @date 2/18/2024 - 2:06:22 PM
 * @param {Array} data array of objects
 * @returns {Array} returns array of objects
 */
const employeeModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      const isArchived = el.ВАрхиве;
      const DeletionMark = el.DeletionMark;

      if (!DeletionMark) {
        // proceed
      } else {
        return null;
      }

      const employee_id = el.Ref_Key;
      const person_id = el.ФизическоеЛицо_Key;
      const employee_code = el.Code;
      const org_id = el.ГоловнаяОрганизация_Key;

      return {
        employee_id,
        isArchived,
        person_id,
        employee_code,
        org_id,
      };
    })
    .filter(Boolean);
};

const personModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data.map((el) => {
    const person_id = el.Ref_Key;
    const fullname = el.ФИО;

    const isFolder = el.IsFolder;
    let phone = undefined;
    let phoneLine = undefined;
    let email = undefined;
    let emailLine = undefined;

    if (!isFolder) {
      const contact = el.КонтактнаяИнформация;

      if (Array.isArray(contact)) {
        contact.forEach((el) => {
          const type = el.Тип;
          if (type === 'Телефон') {
            const line = el.LineNumber;
            const phoneNumber = el.НомерТелефона;

            if (phoneLine && Number(phoneLine) < Number(line)) {
              phoneLine = line;
              phone = phoneNumber;
            } else if (!phoneLine) {
              phoneLine = line;
              phone = phoneNumber;
            }
          }

          if (type === 'АдресЭлектроннойПочты') {
            const line = el.LineNumber;
            const emailValue = el.АдресЭП;
            emailLine = line;
            email = emailValue;
          }
        });
      } else if (contact && typeof contact === 'object') {
        const type = contact.Тип;

        if (type === 'Телефон') {
          const line = contact.LineNumber;
          const phoneNumber = contact.НомерТелефона;

          if (phoneLine && Number(phoneLine) < Number(line)) {
            phoneLine = line;
            phone = phoneNumber;
          } else if (!phoneLine) {
            phoneLine = line;
            phone = phoneNumber;
          }
        }

        if (type === 'АдресЭлектроннойПочты') {
          const line = contact.LineNumber;
          const emailValue = contact.АдресЭП;
          emailLine = line;
          email = emailValue;
        }
      }
    }

    return {
      person_id,
      fullname,
      phone,
      phoneLine,
      email,
      emailLine,
    };
  });
};

/**
 * Constructs students object
 * @date 2/18/2024 - 2:06:22 PM
 * @param {Array} data array of objects
 * @returns {Array} returns array of objects
 */
const orgModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      const DeletionMark = el.DeletionMark;

      if (!DeletionMark) {
        // proceed
      } else {
        return null;
      }

      const org_id = el.Ref_Key;
      const org_name = el.НаименованиеСокращенное;

      return {
        org_id,
        org_name,
      };
    })
    .filter(Boolean);
};

//InformationRegister_ДанныеСостоянийСотрудников
/**
 * Constructs students object
 * @date 2/18/2024 - 2:06:22 PM
 * @param {Array} data array of objects
 * @returns {Array} returns array of objects
 */
const statusModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      const record = el.RecordSet[0];
      const employee_id = record.Сотрудник_Key;
      const LineNumber = record.LineNumber;
      const status = record.Состояние;
      const startDate = record.Начало;
      const endDate = record.Окончание;

      return {
        employee_id,
        status: [
          {
            LineNumber,
            status,
            startDate,
            endDate,
          },
        ],
      };
    })
    .reduce((acc, curr) => {
      if (curr.employee_id !== undefined && curr.status !== undefined) {
        const found = acc.find((item) => item.employee_id === curr.employee_id);
        if (found) {
          if (curr.status) {
            found.status.push(...curr.status);
          }
        } else {
          acc.push({ employee_id: curr.employee_id, status: curr.status });
        }
      }
      return acc;
    }, []);
};

/**
 * Fetches data from an endpoint, optionally caching it to a file.
 * @param {string} endpoint The URL endpoint to fetch data from.
 * @param {string} filename The name of the file to cache the fetched data.
 * @param {function} modelFunction A function to process the fetched data.
 * @returns {Promise<Array>} A promise that resolves to an array of processed data.
 */
const fetchData = async (endpoint, filename, modelFunction) => {
  try {
    const cacheDir = path.join(process.cwd(), 'cache');
    const filePath = path.join(cacheDir, filename);

    try {
      await fs.access(cacheDir);
    } catch (err) {
      console.log(`Creating ${cacheDir}`);
      await fs.mkdir(cacheDir, { recursive: true });
    }

    const fileShouldBeFetched = await shouldFetchData(filePath);

    if (fileShouldBeFetched) {
      const res = await queryOdata(endpoint);
      const data = res.value;

      const dataList = modelFunction(data);

      console.log(`Writing data to file: ${filename}`);
      await fs.writeFile(filePath, JSON.stringify(dataList, null, 2));
      return dataList;
    } else {
      console.log(`Reading data from file: ${filename}`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * Filter valid properties
 * @date 3/10/2024 - 11:19:52 AM
 *
 * @param {Object[]} data
 * @returns {Oject[]}
 */
const filterValid = (data) => {
  // Find students with empty logins

  return data
    .filter(
      (el) =>
        !el.isArchived &&
        el.status &&
        el.org_id === '82eabbba-b2a1-11e9-f39e-0050568975d8',
    )
    .map((el) => {
      // format phone
      if (Object.hasOwn(el, 'phone') && el.phone) {
        const phone = parsePhoneNumber(el.phone, 'RU');
        if (phone && phone.isValid()) {
          el.phone = phone.number;
        } else {
          delete el.phone;
        }
      }

      if (Object.hasOwn(el, 'email') && el.email) {
        const parsedEmail = emailValidator.validate(el.email);
        if (!parsedEmail) {
          delete el.email;
        }
      }

      if (el.fullname && Object.hasOwn(el, 'fullname')) {
        el.fullname = el.fullname.trim();
      }

      const currentDate = new Date();

      if (el.status && Object.hasOwn(el, 'status')) {
        el.status.sort((a, b) => {
          // If current date is between startDate and endDate (and endDate is not '0001-01-01T00:00:00'), it should be sorted last
          const aStartDate = new Date(a.startDate);
          const aEndDate = new Date(a.endDate);
          const bStartDate = new Date(b.startDate);
          const bEndDate = new Date(b.endDate);

          const aIsBetween = currentDate >= aStartDate && currentDate <= aEndDate;
          const bIsBetween = currentDate >= bStartDate && currentDate <= bEndDate;

          if (aIsBetween && !bIsBetween) {
            return 1;
          } else if (!aIsBetween && bIsBetween) {
            return -1;
          }

          // If endDate is '0001-01-01T00:00:00', it should be sorted last
          if (
            a.endDate === '0001-01-01T00:00:00' &&
            b.endDate !== '0001-01-01T00:00:00'
          ) {
            return 1;
          } else if (
            a.endDate !== '0001-01-01T00:00:00' &&
            b.endDate === '0001-01-01T00:00:00'
          ) {
            return -1;
          }

          // If none of the above conditions are met, sort by startDate
          return new Date(a.startDate) - new Date(b.startDate);
        });
        el.currentStatus = el.status[el.status.length - 1].status;
        delete el.status;
      }

      return el;
    });
};

const create1cFreshJsonData = async (endpoint = '', login = '', password = '') => {
  if (!isEmpty(endpoint && login && password)) {
    // proceed
  } else {
    console.error('endpoint, login and password are empty');
    return false;
  }

  C1FreshUrl = endpoint;
  C1FreshLogin = login;
  C1FreshPassword = password;

  try {
    const employeeList = await fetchData(
      'Catalog_Сотрудники',
      '1cFresh_employees.json',
      employeeModel,
    );

    const personList = await fetchData(
      'Catalog_ФизическиеЛица',
      '1cFresh_persons.json',
      personModel,
    );

    const orgList = await fetchData('Catalog_Организации', '1cFresh_orgs.json', orgModel);

    const statusList = await fetchData(
      'InformationRegister_ДанныеСостоянийСотрудников',
      '1cFresh_status.json',
      statusModel,
    );

    if (!isArrayEmpty(employeeList && personList && statusList)) {
      const merge1 = mergeArrays(employeeList, personList, 'person_id');
      const merge2 = mergeArrays(merge1, orgList, 'org_id');
      const merge3 = mergeArrays(merge2, statusList, 'employee_id');
      const finalValidData = filterValid(merge3);

      await writeToJson('CFreshUsers.json', finalValidData);

      console.log(`Total users in 1c Fresh: ${finalValidData.length}`);

      return finalValidData;
    }
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports = { create1cFreshJsonData };
