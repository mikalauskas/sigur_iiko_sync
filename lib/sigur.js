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
  }

  async addGroup(groupName) {
    if (!groupName) return false;
    return new Promise((resolve, reject) => {
      const query = `
      INSERT
        INTO
        \`tc-db-main\`.personal (PARENT_ID,
        \`TYPE\`,
        EMP_TYPE,
        NAME,
        STATUS)
      VALUES (1653,
      'DEP',
      'EMP',
      '${groupName}',
      'AVAILABLE');
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        console.log(`Sending data to ${this.database}`);
        if (error) reject(error);

        resolve(results);
      });
    });
  }

  async addPersonal(groupId, fullname, position, person_id) {
    if (!groupId && !fullname && !position) return false;
    return new Promise((resolve, reject) => {
      const query = `
      INSERT
        INTO
        \`tc-db-main\`.personal (PARENT_ID,
        \`TYPE\`,
        EMP_TYPE,
        NAME,
        POS,
        STATUS,
        DESCRIPTION)
      VALUES (${groupId},
      'EMP',
      'EMP',
      '${fullname}',
      '${position}',
      'AVAILABLE',
      '${person_id}');
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        console.log(`Sending data to ${this.database}`);
        if (error) reject(error);

        resolve(results);
      });
    });
  }

  /**
   * get all students
   *
   * @async
   * @returns {[ID: Number, NAME: String, POS: String, CODEKEY: String]}
   */
  async getPersonal() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
            t1.ID AS ID,
            t1.NAME AS NAME,
            t1.POS AS POS,
            t1.CODEKEY AS CODEKEY,
            t1.DESCRIPTION AS DESCRIPTION
        FROM
            \`tc-db-main\`.personal AS t1
        WHERE
            t1.NAME IS NOT NULL
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

        resolve(results);
      });
    });
  }

  /**
   * get groups
   *
   * @async
   * @returns {[{ID: Number, NAME: String}]}
   */
  async getGroups() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          t1.ID AS ID,
          t1.NAME AS NAME
        FROM
          \`tc-db-main\`.personal AS t1
        WHERE
          t1.NAME IS NOT NULL
          AND t1.\`TYPE\` = 'DEP'
          AND t1.PARENT_ID = 1653;
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        console.log(`Fetching data from ${this.database}`);
        if (error) reject(error);

        resolve(results);
      });
    });
  }

  finish() {
    this.closeConnection();
  }
};
