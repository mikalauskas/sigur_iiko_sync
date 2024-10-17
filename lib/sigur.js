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
        if (error) reject(error);

        resolve(results);
      });
    });
  }

  /**
   * add user to sigur
   *
   * @async
   * @param {number} groupId
   * @param {String} fullname
   * @param {String} position
   * @param {String} person_id
   * @param {String} description
   * @returns {Promise<false|void>}
   */
  async addPersonal(groupId, fullname, position, person_id, description) {
    // Log the incoming data for the new user
    /* console.log(
      `Sigur: Received request to add new user with details - Group ID: ${groupId}, Full Name: "${fullname}", Position: "${position}", Person ID: "${person_id}"`,
    ); */

    // Validate the essential parameters before proceeding
    if (!groupId || !fullname || !person_id) {
      console.log(
        `sigur: Missing required information (Group ID: ${groupId}, Full Name: "${fullname}", person_id: "${person_id}"). Insert aborted.`,
      );
      return false;
    }
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
        TABID,
        DESCRIPTION)
      VALUES (${groupId},
      'EMP',
      'EMP',
      '${fullname}',
      '${position}',
      'AVAILABLE',
      '${person_id}',
      '${description}');
      `;

      const options = { sql: query };

      // Execute the query on the database
      this.db.query(options, (error, results) => {
        if (error) {
          // Log the error if the query fails
          console.error(
            `Sigur: Error inserting new user into database - ${error.message}`,
          );
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * update user in sigur
   *
   * @async
   * @param {number} userId
   * @param {number} groupId
   * @param {String} fullname
   * @param {String} position
   * @param {String} person_id
   * @param {String} description
   * @returns {Promise<false|void>}
   */
  async updatePersonal(userId, groupId, fullname, position, person_id, description) {
    userId = Number(userId);
    groupId = Number(groupId);

    // Log the incoming data before processing
    /* console.log(
      `sigur: Received request to update user with details - User ID: ${userId}, Group ID: ${groupId}, Full Name: "${fullname}", Position: "${position}", Person ID: "${person_id}"`,
    ); */

    // Validate the userId and groupId before proceeding
    if (
      (typeof userId !== 'number' && userId < 1) ||
      (typeof groupId !== 'number' && groupId < 1)
    ) {
      console.log(
        `sigur: Invalid User ID (${userId}) or Group ID (${groupId}). Update aborted.`,
      );
      return false;
    }

    if (!fullname || !person_id) {
      console.log(`sigur: fullname or person_id is empty. Update aborted.`);
      return false;
    }

    return new Promise((resolve, reject) => {
      const query = `
      UPDATE \`tc-db-main\`.personal
      SET NAME = '${fullname}',
          PARENT_ID = ${groupId},
          POS = '${position}',
          TABID = '${person_id}',
          DESCRIPTION = '${description}',
          STATUS = 'AVAILABLE'
      WHERE ID = ${userId};
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        if (error) {
          // Log the error if the query fails
          console.error(`sigur: Error updating user in database - ${error.message}`);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * disable user in sigur
   *
   * @async
   * @param {number} userId
   * @param {String} position
   * @returns {Promise<false|void>}
   */
  async disablePersonal(userId, position) {
    userId = Number(userId);

    // Log the incoming data before processing
    /* console.log(
      `sigur: Received request to update user with details - User ID: ${userId}, Group ID: ${groupId}, Full Name: "${fullname}", Position: "${position}", Person ID: "${person_id}"`,
    ); */

    // Validate the userId and groupId before proceeding
    if (!userId) {
      console.log(`sigur: Invalid User ID (${userId}). Update aborted.`);
      return false;
    }

    return new Promise((resolve, reject) => {
      const query = `
      UPDATE \`tc-db-main\`.personal
      SET POS = '${position}'
      WHERE ID = ${userId};
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        if (error) {
          // Log the error if the query fails
          console.error(`sigur: Error updating user in database - ${error.message}`);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * delete user in sigur
   *
   * @async
   * @param {number} userId
   * @returns {Promise<false|void>}
   */
  async deletePersonal(userId) {
    userId = Number(userId);

    // Validate the userId before proceeding
    if (typeof userId !== 'number' && userId < 1) {
      console.log(`sigur: Invalid User ID (${userId}). delete aborted.`);
      return false;
    }

    return new Promise((resolve, reject) => {
      const query = `
      DELETE FROM \`tc-db-main\`.personal
      WHERE ID = ${userId};
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        if (error) {
          console.error(`sigur: Error deleting user in database - ${error.message}`);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * get all students
   *
   * @async
   * @returns {Promise<[{
   * ID: number,
   * PARENT_ID: number,
   * NAME: string,
   * POS: string,
   * CODEKEY: object,
   * DESCRIPTION: string,
   * TABID: string,
   * STATUS: string,
   * LOCATIONACT: Date}]>}
   */
  async getPersonal(fullname = '', person_id = '') {
    let andWhereFullName = '';
    let andWherePersonId = '';
    if (fullname) {
      fullname = fullname
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      andWhereFullName = `AND t1.NAME LIKE '%${fullname}%'`;
    }
    if (person_id) {
      andWherePersonId = `AND t1.TABID = '${person_id}'`;
    }
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
            t1.ID AS ID,
            t1.PARENT_ID AS PARENT_ID,
            t1.NAME AS NAME,
            t1.POS AS POS,
            t1.CODEKEY AS CODEKEY,
            t1.DESCRIPTION AS DESCRIPTION,
            t1.TABID AS TABID,
            t1.STATUS AS STATUS,
            t1.LOCATIONACT AS LOCATIONACT
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
            ${andWhereFullName}
            ${andWherePersonId}
        GROUP BY
            ID, NAME
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        if (error) {
          // Log the error if the query fails
          console.error(`sigur: Error get personal in database - ${error.message}`);
          reject(error);
        } else {
          const result = JSON.parse(JSON.stringify(results));
          resolve(result);
        }
      });
    });
  }

  /**
   * get groups
   *
   * @async
   * @returns {Promise<[{ID: Number, NAME: String}]>}
   */
  async getGroup(groupName = '') {
    let andWhereGroupName = '';
    if (groupName) {
      andWhereGroupName = `AND t1.NAME = '${groupName}'`;
    }
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          t1.ID AS ID,
          t1.NAME AS NAME
        FROM
          \`tc-db-main\`.personal AS t1
        WHERE
          t1.NAME IS NOT NULL
          ${andWhereGroupName}
          AND t1.\`TYPE\` = 'DEP'
          AND t1.PARENT_ID = 1653;
      `;

      const options = { sql: query };

      this.db.query(options, (error, results) => {
        if (error) {
          // Log the error if the query fails
          console.error(`sigur: Error get groups in database - ${error.message}`);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  finish() {
    this.closeConnection();
  }
};
