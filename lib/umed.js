const getStudents = async (token) => {
  const headersList = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token,
  };
  console.log('Fetching data from umedcollege.ru');
  const response = await fetch('https://umedcollege.ru/api/get_students.php', {
    method: 'GET',
    headers: headersList,
  });
  try {
    if (response.ok) {
      const data = await response.json();

      return data;
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = { getStudents };
