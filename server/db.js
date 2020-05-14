const mysql = require("mysql");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "profile_saving_popi",
  password: "",
});
const DatabaseLoaded = new Promise((resolve, reject) => {
  con.connect(function (err) {
    if (err) {
      reject();
      throw err;
    } 
    resolve(con);
    console.log("Connected to mysql!");
  });
});

module.exports = DatabaseLoaded;
