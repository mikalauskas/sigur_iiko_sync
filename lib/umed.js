const getStudents = token => {
    console.log('Fetching data from umedcollege.ru');
    return fetch('https://umedcollege.ru/api/get_students.php', { headers: { 'Authorization': 'Bearer ' + token } })
        .then((response) => response.json())
        .catch(err => {
            throw Error(err)
        });
}

module.exports = { getStudents };