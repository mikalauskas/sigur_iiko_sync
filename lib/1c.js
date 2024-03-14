const {
  groupArrayByKey,
  mergeArrays,
  shouldFetchData,
  isObjectEmpty,
  isArrayEmpty,
  writeToJson,
} = require('./utils.js');
const fs = require('node:fs/promises');
const path = require('path');
const parsePhoneNumber = require('libphonenumber-js/mobile');
const emailValidator = require('email-validator');

const queryOdata = async (catalog) => {
  if (!catalog) return false;

  const headersList = {
    Accept: 'application/json',
  };

  console.log(`Fetching data: ${catalog}`);

  const response = await fetch('http://192.168.0.7/umk/odata/standard.odata/' + catalog, {
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

function betweenRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Constructs students object
 * @date 2/18/2024 - 2:06:22 PM
 * @param {Array} data array of objects
 * @returns {Array} returns array of objects
 */
const studentModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      const is_folder = el.IsFolder;
      const deleted = el.DeletionMark;

      if (is_folder || deleted) return null;

      const student_id = el.Ref_Key;
      const person_id = el.ФизЛицо_Key;
      const student_code = el.Code;
      const fullname = el.Description;
      const speciality_id = el.Специальность_Key;
      const application_id = el.АнкетаАбитуриента_Key;
      let bitrix_id = el.ИдБитрикс;
      let login = el.Логин;
      let password = el.Пароль;
      const program_id = el.ПрограммаСПО_Key;

      if (!bitrix_id || !login || bitrix_id.trim() !== login.trim()) {
        const newLogin = String(betweenRandomNumber(1000000000, 9999999999));
        const newPassword = String(betweenRandomNumber(100000000000, 999999999999));

        const result = sendOdata('Catalog_Студенты', student_id, {
          ИдБитрикс: newLogin,
          Логин: newLogin,
          Пароль: newPassword,
        });

        if (result) {
          bitrix_id = newLogin;
          login = newLogin;
          password = newPassword;
        }
      }

      return {
        student_id,
        person_id,
        speciality_id,
        application_id,
        bitrix_id,
        program_id,
        student_code,
        fullname,
        login,
        password,
      };
    })
    .filter(Boolean);
};

const specialityModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data.map((el) => {
    const speciality_id = el.Ref_Key;
    const speciality_name = el.Description;
    const speciality_code = el.Code;

    return {
      speciality_id,
      speciality_name,
      speciality_code,
    };
  });
};

const personModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data.map((el) => {
    const person_id = el.Ref_Key;

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
      phone,
      phoneLine,
      email,
      emailLine,
    };
  });
};

const statusModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  const objArray = data
    .map((el) => {
      // Extract the 'd:element' property from the nested structure
      const recordSetElement = el.RecordSet;

      // Check if 'recordSetElement' is an array; if not, wrap it in an array
      const elementsArray = Array.isArray(recordSetElement)
        ? recordSetElement
        : [recordSetElement];

      // Map through 'elementsArray' to extract specific properties
      const result = elementsArray.map((element) => {
        const student_id = element.Студент_Key;
        const group_id = element.Группа_Key;
        const period = element.Period;
        const status = element.Статус;

        // Return an object with extracted properties
        return {
          student_id,
          group_id,
          period,
          status,
        };
      });

      // Return the result as an array of objects
      return result;
    })
    .flat()
    .filter(Boolean);

  // Group the array of objects by 'student_id'
  const groupedItems = groupArrayByKey(objArray, 'student_id');

  // Reduce the grouped items to get the latest period for each student
  const result = Object.entries(groupedItems).reduce((acc, [studentId, periods]) => {
    // Find the latest period using the 'reduce' function
    const latestPeriod = periods.reduce((latest, period) => {
      // Compare dates to find the latest one
      return new Date(period.period) > new Date(latest.period) ? period : latest;
    });

    // Assign an array with the latest period to the student ID in the accumulator
    acc[studentId] = [latestPeriod];

    // Return the accumulator for the next iteration
    return acc;
  }, {});

  // Flatten the result object's values and return the final array
  return Object.values(result).flat();
};

const groupModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      if (el.IsFolder || el.Статус !== 'Учится') return null;

      const group_id = el.Ref_Key;
      const program_id = el.ПрограммаСПО_Key;
      const rup_id = el.РабочийУчебныйПлан_Key;
      const group_code = el.Code;
      const group_name = el.Description;
      const group_year = el.ГодПоступления;
      const edu_form = el.ФормаОбучения;
      const edu_end = el.ДатаОкончанияОбучения;

      return {
        group_id,
        rup_id,
        program_id,
        group_code,
        group_name,
        group_year,
        edu_form,
        edu_end,
      };
    })
    .filter(Boolean);
};

const contractModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data.map((el) => {
    const contract_id = el.Ref_Key;
    const person_id = el.Абитуриент_Key;
    const speciality_id = el.Специальность_Key;
    const program_id = el.ПрограммаОбучения_Key;
    const contract_code = el.Number;
    const contract_date = el.Date;
    const contract_end = el.ДатаОкончанияКонтракта;
    const student_is_customer = el.ЗаказчикОнЖе;
    const customer_name = el.Заказчик;
    const customer_phone = el.ТелефонЗаказчика;
    const customer_email = el.ЭлектроннаяПочтаЗаказчика;
    const customer_is_org = el.ЗаказчикЮридическоеЛицо;
    const contract_total_payment = el.СтоимостьОбучения;
    const payment_table = el.умкГрафикОплаты;

    if (student_is_customer) {
      return {
        person_id,
        speciality_id,
        program_id,
        contract_id,
        contract_code,
        contract_date,
        contract_end,
        contract_total_payment,
        payment_table,
      };
    }

    return {
      person_id,
      speciality_id,
      program_id,
      contract_id,
      contract_code,
      contract_date,
      contract_end,
      customer_name,
      customer_phone,
      customer_email,
      customer_is_org,
      contract_total_payment,
      payment_table,
    };
  });
};

const disciplinesModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      if (el.isFolder || el.DeletionMark) return false;

      const discipline_id = el.Ref_Key;
      const discipline_code = el.Code;
      const discipline_name = el.ПолноеНаименование;
      const discipline_shortname = el.СокращенноеНаименование;

      return {
        discipline_id,
        discipline_code,
        discipline_name,
        discipline_shortname,
      };
    })
    .filter(Boolean);
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
    .filter((el) => Object.hasOwn(el, 'status'))
    .map((el) => {
      // format phone
      if (Object.hasOwn(el, 'phone') && el.phone) {
        const phone = parsePhoneNumber(el.phone, 'RU');
        if (phone && phone.isValid()) {
          el.phone = phone.number;
        } else {
          delete el.phone;
          /* if (el.status === 'Студент') {
            const generatedPhone = '7998' + el.student_id.replace(/\D/g, '').substr(0, 7);

            const result = sendOdataContactInfo(
              'Catalog_ФизическиеЛица_КонтактнаяИнформация',
              el.person_id,
              el.phoneLine,
              {
                LineNumber: el.phoneLine,
                Тип: 'Телефон',
                Вид_key: '8b31ba8c-fe43-11e8-80b3-e0d55e04ef59',
                Представление: '+' + generatedPhone,
                НомерТелефона: generatedPhone,
              },
            );

            if (result) {
              el.phone = generatedPhone;
              console.log(el.phone);
            }
          } */
        }
      }

      /* // generate phone number
      if (!el.phone && el.status === 'Студент') {
        let userPhone = String('+7998' + betweenRandomNumber(1000000, 9999999));
      } */

      if (Object.hasOwn(el, 'email') && el.email) {
        const parsedEmail = emailValidator.validate(el.email);
        if (!parsedEmail) {
          delete el.email;
        }
      }

      if (el.login && Object.hasOwn(el, 'login')) {
        el.login = el.login.trim();
      }

      if (el.password && Object.hasOwn(el, 'password')) {
        el.password = el.password.trim();
      }

      if (el.fullname && Object.hasOwn(el, 'fullname')) {
        el.fullname = el.fullname.trim();
      }

      if (el.customer_phone && Object.hasOwn(el, 'customer_phone')) {
        const customer_phone = parsePhoneNumber(el.customer_phone, 'RU');
        if (customer_phone && customer_phone.isValid()) {
          el.customer_phone = customer_phone.number;
        } else {
          //el.customer_phone = '+7998' + el.student_id.replace(/\D/g, '').substr(0, 7);
          delete el.customer_phone;
        }
      }

      if (el.customer_email && Object.hasOwn(el, 'customer_email')) {
        const parsedEmail = emailValidator.validate(el.customer_email);
        if (!parsedEmail) {
          delete el.customer_email;
        }
      }

      if (el.customer_name && Object.hasOwn(el, 'customer_name')) {
        el.customer_name = el.customer_name.trim();
      }

      return el;
    });
};

const create1cJsonData = async () => {
  try {
    const studentList = await fetchData(
      'Catalog_Студенты',
      '1c_students.json',
      studentModel,
    );
    const specialityList = await fetchData(
      'Catalog_Специальности',
      '1c_speciality.json',
      specialityModel,
    );
    const personList = await fetchData(
      'Catalog_ФизическиеЛица',
      '1c_persons.json',
      personModel,
    );
    const statusList = await fetchData(
      'InformationRegister_ДвижениеКонтингента',
      '1c_status_info.json',
      statusModel,
    );
    const groupList = await fetchData(
      'Catalog_УчебныеГруппы',
      '1c_groups.json',
      groupModel,
    );
    const contractList = await fetchData(
      'Document_КонтрактНаОбучение',
      '1c_contracts.json',
      contractModel,
    );

    if (
      !isArrayEmpty(
        personList && specialityList && statusList && groupList && contractList,
      )
    ) {
      const merge1 = mergeArrays(studentList, personList, 'person_id');
      const merge2 = mergeArrays(merge1, specialityList, 'speciality_id');
      const merge3 = mergeArrays(merge2, statusList, 'student_id');
      const merge4 = mergeArrays(merge3, groupList, 'group_id');
      const merge5 = mergeArrays(merge4, contractList, 'person_id');
      const finalValidData = filterValid(merge5);

      await writeToJson('CUsers.json', finalValidData);

      console.log(`Total users in 1c: ${finalValidData.length}`);

      return finalValidData;
    }
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports = { create1cJsonData };
