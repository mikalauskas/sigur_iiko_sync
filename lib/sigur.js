const Database = require('./db.js');

module.exports = class Sigur extends Database {
  constructor(host, port, user, password, database) {
    super(host, port, user, password, database);
    this.results = [];
  }

  buf2hex(buffer) {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  }

  getPersonal(callback) {
    const query = `
          SELECT
              t1.ID AS ID,
              t1.NAME AS NAME,
              t1.POS AS POS,
              t1.CODEKEY AS CODEKEY
          FROM
              \`tc-db-main\`.personal AS t1
          JOIN
              \`tc-db-log\`.\`logs\` AS t2
          ON
              t1.ID = t2.EMPHINT
          WHERE
              t1.NAME IS NOT NULL
              AND t1.CODEKEY IS NOT NULL
              AND t2.LOGTIME >= DATE_SUB(NOW(), INTERVAL 60 DAY)
              AND EXISTS (
                  SELECT 1
                  FROM
                      \`tc-db-main\`.personal AS subquery
                  WHERE
                      subquery.TYPE = 'DEP'
                      AND subquery.PARENT_ID = 1653
                      AND subquery.ID = t1.PARENT_ID
              )
          GROUP BY
              ID, NAME
        `;

    const options = { sql: query };

    this.db.query(options, (error, results) => {
      console.log(`Fetching data from ${this.database}`);
      if (error) throw error;

      if (!this.results) return callback(false);

      const cleanedResults = results.map((el) => {
        el.CODEKEY = this.buf2hex(el.CODEKEY);
        return {
          ID: el.ID,
          NAME: el.NAME.replace(/\u00A0/g, ' ').trim(),
          CODEKEY: el.CODEKEY.substring(el.CODEKEY.length - 8)
            .toUpperCase()
            .padStart(14, '0'),
        };
      });

      this.results = cleanedResults.filter(
        (el) => el.CODEKEY !== '00000000000000',
      );

      console.log(this.results);

      this.closeConnection();

      return callback(this.results);
    });
  }
};
