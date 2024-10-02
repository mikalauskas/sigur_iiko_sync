const {
  groupArrayByKey,
  mergeArrays,
  mergeArrays3Way,
  shouldFetchData,
  isObjectEmpty,
  isArrayEmpty,
  writeToJson,
  betweenRandomNumber,
  titleCase,
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

      if (el.Description) el.Description = el.Description.trim().replace(/\s+/g, ' ');
      if (el.ИдБитрикс) el.ИдБитрикс = el.ИдБитрикс.trim().replace(/\s+/g, ' ');
      if (el.Логин) el.Логин = el.Логин.trim().replace(/\s+/g, '');
      if (el.Пароль) el.Пароль = el.Пароль.trim().replace(/\s+/g, '');

      const student_id = el.Ref_Key;
      const person_id = el.ФизЛицо_Key;
      const student_code = el.Code;
      const fullname = el.Description;
      // const speciality_id = el.Специальность_Key;
      const application_id = el.АнкетаАбитуриента_Key;
      let bitrix_id = el.ИдБитрикс;
      let login = el.Логин;
      let password = el.Пароль;
      const program_id = el.ПрограммаСПО_Key;

      const foundUser = data.filter(
        (el) => el.ИдБитрикс && bitrix_id && el.ИдБитрикс.trim() === bitrix_id.trim(),
      );

      if (Array.isArray(foundUser) && foundUser.length > 1) {
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

const isSnilsValid = (checkedValue) => {
  checkedValue = String(checkedValue);

  const checkSum = parseInt(checkedValue.slice(-2), 10);

  const sum = checkedValue
    .slice(0, 9)
    .split('')
    .reduce((acc, digit, index) => {
      return acc + parseInt(digit, 10) * (9 - index);
    }, 0);

  if (sum < 100 && sum === checkSum) {
    return true;
  } else if ((sum === 100 || sum === 101) && checkSum === 0) {
    return true;
  } else if (sum > 101) {
    const mod = sum % 101;
    if (mod === checkSum || (mod === 100 && checkSum === 0)) {
      return true;
    }
  }

  return false;
};

const personModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data.map((el) => {
    const person_id = el.Ref_Key;
    let person_snils = undefined;
    let person_birthday = undefined;
    let person_gender = undefined;
    let person_citizenship = undefined;

    if (el.СтраховойНомерПФР) {
      person_snils = el.СтраховойНомерПФР.replace(/\D/g, '');
      if (!isSnilsValid(person_snils)) {
        person_snils = undefined;
      }
    }

    if (el.ДатаРождения) {
      person_birthday = el.ДатаРождения.trim();
    }

    if (el.Пол) {
      person_gender = el.Пол.trim();
    }

    if (el.Гражданство) {
      person_citizenship = el.Гражданство.trim();
    }

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

            if (emailLine && Number(emailLine) < Number(line)) {
              emailLine = line;
              email = emailValue;
            } else if (!emailLine) {
              emailLine = line;
              email = emailValue;
            }
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

          if (emailLine && Number(emailLine) < Number(line)) {
            emailLine = line;
            email = emailValue;
          } else if (!emailLine) {
            emailLine = line;
            email = emailValue;
          }
        }
      }
    }

    return {
      person_id,
      person_snils,
      phone,
      phoneLine,
      email,
      emailLine,
      person_birthday,
      person_gender,
      person_citizenship,
    };
  });
};

const statusModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data.map((el) => {
    const student_id = el.Студент_Key;
    const group_id = el.Группа_Key;
    const period = el.Period;
    const status = el.Статус;

    return {
      student_id,
      group_id,
      period,
      status,
    };
  });
};

const groupModel = (data = []) => {
  if (isArrayEmpty(data)) return false;

  return data
    .map((el) => {
      if (el.IsFolder || el.Статус !== 'Учится') return null;

      if (el.Description) el.Description = el.Description.trim().replace(/\s+/g, ' ');
      if (el.Code) el.Code = el.Code.trim().replace(/\s+/g, ' ');

      const group_id = el.Ref_Key;
      const program_id = el.ПрограммаСПО_Key;
      const speciality_id = el.Специальность_Key;
      const rup_id = el.РабочийУчебныйПлан_Key;
      const group_code = el.Code;
      const group_name = el.Description;
      const group_year = el.ГодПоступления;

      let edu_form;

      if (el?.ФормаОбучения === 'Вечерняя') {
        edu_form = 'Очно-заочная';
      } else {
        edu_form = el.ФормаОбучения;
      }

      const edu_end = el.ДатаОкончанияОбучения;

      return {
        group_id,
        rup_id,
        program_id,
        speciality_id,
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

  return data
    .map((el) => {
      if (el.DeletionMark) return false;

      const contract_id = el.Ref_Key;
      const person_id = el.Абитуриент_Key;
      const speciality_id = el.Специальность_Key;
      const program_id = el.ПрограммаОбучения_Key;
      const contract_code = el.bma_РегистрационныйНомер
        ? el.bma_РегистрационныйНомер
        : el.Number;
      const contract_date = el.Date;
      const contract_end = el.ДатаОкончанияКонтракта;
      const student_is_customer = el.ЗаказчикОнЖе;
      const customer_name = el.Заказчик ? el.Заказчик.trim().replace(/\s+/g, ' ') : null;
      const customer_phone = el.ТелефонЗаказчика ? el.ТелефонЗаказчика.trim() : null;
      const customer_email = el.ЭлектроннаяПочтаЗаказчика
        ? el.ЭлектроннаяПочтаЗаказчика.trim()
        : null;
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
    })
    .filter(Boolean);
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
    return null;
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
    .filter((el) => el?.status)
    .map((el) => {
      // format phone
      if (el?.phone) {
        const phone = parsePhoneNumber(el.phone.trim(), 'RU');
        if (phone && phone.isValid()) {
          el.phone = phone.number;
        } else {
          delete el.phone;
          delete el.phoneLine;
        }
      }

      if (el?.email) {
        const parsedEmail = emailValidator.validate(el.email.trim());
        if (!parsedEmail) {
          delete el.email;
        }
        if (el.email) el.email = el.email.trim().toLowerCase();
      }

      if (el?.login) {
        el.login = el.login.trim();
      }

      if (el?.password) {
        el.password = el.password.trim();
      }

      if (el?.fullname) {
        el.fullname = titleCase(el.fullname.trim().replace(/\s+/g, ' '));
      }

      if (el?.contract_code) {
        el.contract_code = el.contract_code.trim();
      }

      if (el?.customer_phone) {
        const customer_phone = parsePhoneNumber(el.customer_phone.trim(), 'RU');
        if (customer_phone && customer_phone.isValid()) {
          el.customer_phone = customer_phone.number;
        } else {
          //el.customer_phone = '+7998' + el.student_id.replace(/\D/g, '').substr(0, 7);
          delete el.customer_phone;
        }
      }

      if (el?.customer_email) {
        const parsedEmail = emailValidator.validate(el.customer_email.trim());
        if (!parsedEmail) {
          delete el.customer_email;
        }
        if (el.customer_email) el.customer_email = el.customer_email.trim().toLowerCase();
      }

      if (el?.customer_name) {
        el.customer_name = titleCase(el.customer_name.trim().replace(/\s+/g, ' '));
      }

      return el;
    });
};

const create1cJsonData = async () => {
  console.log('1C job started');
  try {
    const studentList = await fetchData(
      'Catalog_Студенты?$select=Ref_Key,IsFolder,DeletionMark,ФизЛицо_Key,Code,Description,АнкетаАбитуриента_Key,ИдБитрикс,Логин,Пароль,ПрограммаСПО_Key',
      '1c_students.json',
      studentModel,
    );
    const personList = await fetchData(
      'Catalog_ФизическиеЛица?$select=Ref_Key,IsFolder,СтраховойНомерПФР,ДатаРождения,Пол,Гражданство,КонтактнаяИнформация',
      '1c_persons.json',
      personModel,
    );
    const statusList = await fetchData(
      'InformationRegister_ДвижениеКонтингента_RecordType/SliceLast()?$select=Period,Студент_Key,Группа_Key,Статус',
      '1c_status_info.json',
      statusModel,
    );
    const groupList = await fetchData(
      'Catalog_УчебныеГруппы?$select=Ref_Key,IsFolder,Статус,ПрограммаСПО_Key,Специальность_Key,РабочийУчебныйПлан_Key,Code,Description,ГодПоступления,ФормаОбучения,ДатаОкончанияОбучения',
      '1c_groups.json',
      groupModel,
    );
    const specialityList = await fetchData(
      'Catalog_Специальности?$select=Ref_Key,Description,Code',
      '1c_speciality.json',
      specialityModel,
    );
    const contractList = await fetchData(
      'Document_КонтрактНаОбучение?$select=Ref_Key,DeletionMark,Абитуриент_Key,Специальность_Key,ПрограммаОбучения_Key,Number,bma_РегистрационныйНомер,Date,ДатаОкончанияКонтракта,ЗаказчикОнЖе,Заказчик,ТелефонЗаказчика,ЭлектроннаяПочтаЗаказчика,ЭлектроннаяПочтаЗаказчика,ЗаказчикЮридическоеЛицо,СтоимостьОбучения,умкГрафикОплаты',
      '1c_contracts.json',
      contractModel,
    );

    if (
      !isArrayEmpty(
        personList && specialityList && statusList && groupList && contractList,
      )
    ) {
      const merge1 = mergeArrays(studentList, personList, 'person_id');
      const merge2 = mergeArrays(merge1, statusList, 'student_id');
      const merge3 = mergeArrays(merge2, groupList, 'group_id');
      const merge4 = mergeArrays(merge3, specialityList, 'speciality_id');
      const merge5 = mergeArrays3Way(merge4, contractList, 'person_id', 'speciality_id');
      const finalValidData = filterValid(merge5);

      await writeToJson('CUsers.json', finalValidData);

      console.log(`Total users in 1c: ${finalValidData.length}`);

      return finalValidData;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
  console.log('1C job finished');
};

module.exports = { create1cJsonData };
