const { groupArrayByKey, mergeArrays, shouldFetchData } = require('./utils.js');
const convert = require('xml-js');
const fs = require('node:fs/promises');
const path = require('path');
const parsePhoneNumber = require('libphonenumber-js/mobile');
const parseEmail = require('email-addresses');

const queryOdata = async (catalog) => {
  const headersList = {
    'Content-Type': 'application/xml',
  };

  console.log(`Fetching data: ${catalog}`);

  const response = await fetch('http://192.168.0.7/umk/odata/standard.odata/' + catalog, {
    method: 'GET',
    headers: headersList,
  });

  try {
    if (response.ok) {
      const xml = await response.text();
      const data = convert.xml2js(xml, { compact: true });

      return data;
    }
  } catch (err) {
    console.error(err);
  }
};

const sendOdata = async (catalog, id, data) => {
  const headersList = {
    'Content-Type': 'application/xml',
  };

  if (typeof data !== 'object' || data === null) return false;

  const xmlProperties = Object.keys(data).map(
    (key) => `<d:${key}>${data[key]}</d:${key}>`,
  );

  const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
    <entry  xmlns="http://www.w3.org/2005/Atom" 
            xmlns:at="http://purl.org/atompub/tombstones/1.0" 
            xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" 
            xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
      <category term="StandardODATA.${catalog}"
            scheme="http://schemas.microsoft.com/ado/2007/08/dataservices/scheme"/>
      <content type="application/xml">
        <m:properties>
          ${xmlProperties.join(' ')}
        </m:properties>
      </content>
    </entry>`;

  console.log(`Sending data: ${catalog}`);

  const response = await fetch(
    `http://192.168.0.7/umk/odata/standard.odata/${catalog}(guid'${id}')`,
    {
      method: 'PATCH',
      headers: headersList,
      body: xmlPayload,
    },
  );

  try {
    if (!response.ok) {
      throw new Error(`Failed to patch resource. Status: ${response.status}`);
    }

    const xml = await response.text();
    const data = convert.xml2js(xml, { compact: true });
    console.log(data.entry.content['m:properties']);
    return data;
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
const studentModel = (data) => {
  return data
    .map((el) => {
      const properties = el.content['m:properties'];
      const { _text: is_folder } = properties['d:IsFolder'];
      const { _text: deleted } = properties['d:DeletionMark'];

      if (is_folder === 'true' || deleted === 'true') return null;

      const { _text: student_id } = properties['d:Ref_Key'];
      const { _text: person_id } = properties['d:ФизЛицо_Key'];
      const { _text: student_code } = properties['d:Code'];
      const { _text: fullname } = properties['d:Description'];
      const { _text: speciality_id } = properties['d:Специальность_Key'];
      const { _text: application_id } = properties['d:АнкетаАбитуриента_Key'];
      const { _text: bitrix_id } = properties['d:ИдБитрикс'];
      const { _text: login } = properties['d:Логин'];
      const { _text: password } = properties['d:Пароль'];
      const { _text: program_id } = properties['d:ПрограммаСПО_Key'];

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

const specialityModel = (data) => {
  return data.map((el) => {
    const properties = el.content['m:properties'];

    const { _text: speciality_id } = properties['d:Ref_Key'];
    const { _text: speciality_name } = properties['d:Description'];
    const { _text: speciality_code } = properties['d:Code'];

    return {
      speciality_id,
      speciality_name,
      speciality_code,
    };
  });
};

const personModel = (data) => {
  return data.map((el) => {
    const properties = el.content['m:properties'];

    const { _text: person_id } = properties['d:Ref_Key'];
    const { _text: phone } = properties['d:НомерТелефона'];
    const { _text: email } = properties['d:АдресЭП'];

    return {
      person_id,
      phone,
      email,
    };
  });
};

const statusModel = (data) => {
  // Map through the 'data' array and extract relevant information
  const objArray = data
    .map((el) => {
      // Extract the 'd:element' property from the nested structure
      const recordSetElement = el.content['m:properties']['d:RecordSet']['d:element'];

      // Check if 'recordSetElement' is an array; if not, wrap it in an array
      const elementsArray = Array.isArray(recordSetElement)
        ? recordSetElement
        : [recordSetElement];

      // Map through 'elementsArray' to extract specific properties
      const result = elementsArray.map((element) => {
        const { _text: student_id } = element['d:Студент_Key'];
        const { _text: group_id } = element['d:Группа_Key'];
        const { _text: period } = element['d:Period'];
        const { _text: status } = element['d:Статус'];

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

const groupModel = (data) => {
  return data
    .map((el) => {
      const properties = el.content['m:properties'];

      if (
        properties['d:IsFolder']._text === 'true' ||
        properties['d:Статус']._text !== 'Учится'
      )
        return null;

      const { _text: group_id } = properties['d:Ref_Key'];
      const { _text: program_id } = properties['d:ПрограммаСПО_Key'];
      const { _text: rup_id } = properties['d:РабочийУчебныйПлан_Key'];
      const { _text: group_code } = properties['d:Code'];
      const { _text: group_name } = properties['d:Description'];
      const { _text: group_year } = properties['d:ГодПоступления'];
      const { _text: edu_form } = properties['d:ФормаОбучения'];
      const { _text: edu_end } = properties['d:ДатаОкончанияОбучения'];

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

const contractModel = (data) => {
  return data.map((el) => {
    const properties = el.content['m:properties'];

    const { _text: contract_id } = properties['d:Ref_Key'];
    const { _text: person_id } = properties['d:Абитуриент_Key'];
    const { _text: speciality_id } = properties['d:Специальность_Key'];
    const { _text: program_id } = properties['d:ПрограммаОбучения_Key'];
    const { _text: contract_code } = properties['d:Number'];
    const { _text: contract_date } = properties['d:Date'];
    const { _text: contract_end } = properties['d:ДатаОкончанияКонтракта'];
    const { _text: student_is_customer } = properties['d:ЗаказчикОнЖе'];
    const { _text: customer_name } = properties['d:Заказчик'];
    const { _text: customer_phone } = properties['d:ТелефонЗаказчика'];
    const { _text: customer_email } = properties['d:ЭлектроннаяПочтаЗаказчика'];
    const { _text: customer_is_org } = properties['d:ЗаказчикЮридическоеЛицо'];
    const { _text: contract_total_payment } = properties['d:СтоимостьОбучения'];
    const { _text: payment_table } = properties['d:умкГрафикОплаты'];

    if (student_is_customer === 'true') {
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
      const data = res.feed.entry;
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

const filterValid = (data) => {
  // Find students with empty logins
  return data
    .filter((el) => Object.hasOwn(el, 'status'))
    .map((el) => {
      // format phone
      if (el.phone && Object.hasOwn(el, 'phone')) {
        const phone = parsePhoneNumber(el.phone, 'RU');
        if (phone && phone.isValid()) {
          el.phone = phone.number;
        } else {
          delete el.phone;
        }
      }

      if (el.email && Object.hasOwn(el, 'email')) {
        const parsedEmail = parseEmail.parseOneAddress(el.email);
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
          delete el.customer_phone;
        }
      }

      if (el.customer_email && Object.hasOwn(el, 'customer_email')) {
        const parsedEmail = parseEmail.parseOneAddress(el.customer_email);
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
    const contactInfoList = await fetchData(
      'Catalog_ФизическиеЛица_КонтактнаяИнформация',
      '1c_persons_contact_info.json',
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

    const merge1 = mergeArrays(studentList, contactInfoList, 'person_id');
    const merge2 = mergeArrays(merge1, specialityList, 'speciality_id');
    const merge3 = mergeArrays(merge2, statusList, 'student_id');
    const merge4 = mergeArrays(merge3, groupList, 'group_id');
    const merge5 = mergeArrays(merge4, contractList, 'person_id');
    const finalValidData = filterValid(merge5);

    return finalValidData;
  } catch (err) {
    console.error(err);
  }
};
/* sendOdata('Catalog_Специальности', '89c519f9-e761-11ea-8101-e0d55e04ef59', {
  Description: 'Стоматология ортопедическая',
  Code: '31.02.05',
}); */

module.exports = { create1cJsonData };
