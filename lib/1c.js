const convert = require('xml-js');
const fs = require('node:fs/promises');

const TWO_DAYS_IN_MILLISECONDS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

const queryOdata = async (catalog) => {
    const headersList = {
        'Content-Type': 'application/xml',
    }

    console.log(`Fetching data: ${catalog}`);

    const response = await fetch('http://192.168.0.7/umk/odata/standard.odata/' + catalog, {
        method: 'GET',
        headers: headersList
    });

    try {
        if (response.ok) {
            const xml = await response.text();
            const data = convert.xml2js(xml, { compact: true });

            return data;
        }
    } catch (err) {
        console.log(err);
    }
}

/**
 * @param {Array} array array
 * @param {String} key string
 */
const groupBy = (array, key) => {
    return array.reduce((result, obj) => {
        const keyValue = obj[key];

        if (!result[keyValue]) {
            result[keyValue] = [];
        }

        result[keyValue].push(obj);

        return result;
    }, {});
}

const studentModel = (data) => {
    return data.map(el => {
        const properties = el.content['m:properties'];

        const { _text: student_id } = properties['d:Ref_Key'];
        const { _text: person_id } = properties['d:ФизЛицо_Key'];
        const { _text: parent_id } = properties['d:Parent_Key'];
        const { _text: is_folder } = properties['d:IsFolder'];
        const { _text: deleted } = properties['d:DeletionMark'];
        const { _text: code } = properties['d:Code'].trim();
        const { _text: fullname } = properties['d:Description'].trim();
        const { _text: speciality_id } = properties['d:Специальность_Key'];
        const { _text: anketa_id } = properties['d:АнкетаАбитуриента_Key'];
        const { _text: bitrix_id } = properties['d:ИдБитрикс'].trim();
        const { _text: login } = properties['d:Логин'].trim();
        const { _text: password } = properties['d:Пароль'].trim();
        const { _text: program_id } = properties['d:ПрограммаСПО_Key'];

        return {
            fullname,
            login,
            password,
            code,
            student_id,
            person_id,
            parent_id,
            speciality_id,
            anketa_id,
            bitrix_id,
            program_id,
            is_folder,
            deleted,
        };

    }).filter(el => el.is_folder === 'false' && el.deleted === 'false');
};

const personModel = (data) => {

    return data.map(el => {
        const properties = el.content['m:properties'];

        const { _text: person_id } = properties['d:Ref_Key'];
        const { _text: phone } = properties['d:НомерТелефона'].trim();
        const { _text: email } = properties['d:АдресЭП'].trim();

        return {
            person_id,
            phone,
            email,
        };

    });
};

const statusModel = (data) => {

    // Map through the 'data' array and extract relevant information
    const objArray = data.map(el => {
        // Extract the 'd:element' property from the nested structure
        const recordSetElement = el.content['m:properties']['d:RecordSet']['d:element'];

        // Check if 'recordSetElement' is an array; if not, wrap it in an array
        const elementsArray = Array.isArray(recordSetElement) ? recordSetElement : [recordSetElement];

        // Map through 'elementsArray' to extract specific properties
        const result = elementsArray.map(element => {
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
    }).flat().filter(Boolean);

    // Group the array of objects by 'student_id'
    const groupedItems = groupBy(objArray, 'student_id');

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

const shouldFetchData = async (filePath) => {
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
}

const fetchData = async (endpoint, filename, modelFunction) => {
    try {
        const fileShouldBeFetched = await shouldFetchData(filename);

        if (fileShouldBeFetched) {
            const res = await queryOdata(endpoint);
            const data = res.feed.entry;
            const dataList = modelFunction(data);

            console.log(`Writing data to file: ${filename}`);
            await fs.writeFile(filename, JSON.stringify(dataList, null, 2));
            return dataList;
        } else {
            console.log(`Reading data from file: ${filename}`);
            const fileContent = await fs.readFile(filename, 'utf8');
            return JSON.parse(fileContent);
        }

    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * @param {Array} array1 array1
 * @param {Array} array2 array2
 * @param {String} commonProperty string
 */
const mergeArrays = (array1, array2, commonProperty) => {
    return array1.map(item1 => {
        // const matchingItems = array2.find(item2 => item2[commonProperty] === item1[commonProperty]);
        const matchingItems = array2.filter(item2 => item2[commonProperty] === item1[commonProperty]);

        // If there is a match, merge the objects
        if (matchingItems.length > 0) {
            let mergedList;
            matchingItems.forEach(item3 => {
                mergedList = Object.assign(item1, item3);
            });

            return mergedList;
        }

        // If there is no match, return the original object from array1
        return item1;
    });
}

const main = async () => {
    try {
        let studentList = await fetchData('Catalog_Студенты', '1c_students.json', studentModel);
        let contactInfoList = await fetchData('Catalog_ФизическиеЛица_КонтактнаяИнформация', '1c_persons_contact_info.json', personModel);
        let statusList = await fetchData('InformationRegister_ДвижениеКонтингента', '1c_status_info.json', statusModel);

        const mergedArrayByPerson = mergeArrays(studentList, contactInfoList, 'person_id');
        const mergedFinal = mergeArrays(mergedArrayByPerson, statusList, 'student_id');
        console.log('Merging files');
        await fs.writeFile('1c_merged.json', JSON.stringify(mergedFinal, null, 2));
    } catch (err) {
        console.error(err);
    }
}

main();