const Database = require('./db.js');
const dotenv = require('dotenv');
dotenv.config();

const sigurDbHost = process.env.SIGUR_HOST;
const SigurDbPort = process.env.SIGUR_PORT;
const SigurDbUser = process.env.SIGUR_USER;
const SigurDbPassword = process.env.SIGUR_PASSWORD;
const SigurDbName = process.env.SIGUR_DATABASE;

module.exports = class Sigur extends Database {
  constructor() {
    super(sigurDbHost, SigurDbPort, SigurDbUser, SigurDbPassword, SigurDbName);
    this.results = [];
  }

  buf2hex(buffer) {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('');
  }

  async getPersonal() {
    return new Promise((resolve, reject) => {
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
            AND t2.LOGTIME >= DATE_SUB(NOW(), INTERVAL 120 DAY)
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
        if (error) reject(error);

        this.results = results
          .map((el) => {
            return {
              sigur_id: el.ID,
              sigur_pos: el.POS,
              sigur_fullname: el.NAME.replace(/\u00A0/g, ' ').trim(),
              sigur_key: this.buf2hex(el.CODEKEY)
                .slice(-8)
                .toUpperCase()
                .padStart(14, '0'),
            };
          })
          .filter((el) => el.sigur_key !== '00000000000000');

        this.closeConnection();

        resolve(this.results);
      });
    });
  }
};
