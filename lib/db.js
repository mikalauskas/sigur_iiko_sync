const mysql = require('mysql');

module.exports = class Database {
  constructor(host, port, user, password, database) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.database = database;

    console.log(`Trying to connect to ${this.user}@${this.host}:${this.port}/${this.database}`);
    this.db = mysql.createConnection({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      database: this.database,
    });

    this.db.connect((error) => {
      if (error) throw error;
      console.log(`Connected to ${this.user}@${this.host}:${this.port}/${this.database}`);
    });
  }

  closeConnection() {
    this.db.end();
    console.log(`Disconnected from ${this.user}@${this.host}:${this.port}/${this.database}`);
  }
};
