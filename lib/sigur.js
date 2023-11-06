const Database = require('./db.js');

module.exports = class Sigur extends Database {
    constructor(host, port, user, password, database) {
        super(host, port, user, password, database)
        this.results = [];
    }

    buf2hex(buffer) { // buffer is an ArrayBuffer
        return [...new Uint8Array(buffer)]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }

    getPersonal(position, callback) {
        const options = {
            sql: 'SELECT t1.ID AS ID, t1.NAME AS NAME, t1.POS AS POS, t1.CODEKEY AS CODEKEY FROM `tc-db-main`.personal AS t1 WHERE t1.POS LIKE "' + position + '" AND t1.NAME IS NOT NULL AND t1.CODEKEY IS NOT NULL'
        };
        this.db.query(options, (error, results) => {
            console.log(`Fetching data from ${this.database}`);
            if (error) throw error;
            results = Object.values(JSON.parse(JSON.stringify(results)));
            results.forEach(el => {
                el.NAME = el.NAME.replace(/\u00A0/g, " ").trim();
                el.CODEKEY = this.buf2hex(el.CODEKEY.data);
                el.CODEKEY = el.CODEKEY.substring(el.CODEKEY.length - 8);
                el.CODEKEY = el.CODEKEY.toUpperCase();
                el.CODEKEY = '000000' + el.CODEKEY;
                if (el.CODEKEY !== '00000000000000') {
                    this.results.push(el);
                }
            });

            this.closeConnection();
            return callback(this.results);
        });
    }
}