const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const User = {
  find: async function (userId, con) {
    return await this.findby("id", userId, con);
  },
  findby: async (field, value, con) => {
    let data = await new Promise((resolve, reject) => {
      con.query(
        `SELECT * FROM users WHERE ${field} = ?`,
        [value],
        (err, data) => {
          if (data.length === 0) {
            resolve(null);
          }
          resolve(data);
        }
      );
    });
    if (data !== null && typeof data[0] !== "undefined") {
      data = data[0];
    }
    return data;
  },
  update: async function (userId, data, oldData, con) {
    const valid = await this.validate(data, oldData, con);
    if (valid !== true) {
      return valid;
    }
    let queryParams = [data.email, data.first_name, data.last_name, data.age];
    if (data.password) {
      queryParams.push(data.password);
    }

    if (data.profile_pic) {
      const uploadedFilePath = await this.uploadFile(data.profile_pic);
      if (uploadedFilePath) {
        data.photo_path = uploadedFilePath;
      }
      queryParams.push(data.photo_path);
    }
    queryParams.push(userId);
    return new Promise((resolve, reject) => {
      con.query(
        `UPDATE users SET email = ?, first_name = ?, last_name = ?, age = ? ${
          data.password ? ", password_hash = ?" : ""
        } ${data.photo_path ? ", photo_path = ?" : ""} WHERE id = ?`,
        queryParams,
        (err, data, fields) => {
          if (err) {
            resolve("Failed to update");
          } else {
            resolve(true);
          }
        }
      );
    });
  },

  create: async function (data, con) {
    const valid = await this.validate(data, {}, con);
    if (valid !== true) {
      return valid;
    }
    let queryParams = [
      data.email,
      data.password,
      data.first_name,
      data.last_name,
      data.age,
    ];

    if (data.profile_pic) {
      const uploadedFilePath = await this.uploadFile(data.profile_pic);
      if (uploadedFilePath) {
        data.photo_path = uploadedFilePath;
        queryParams.push(data.photo_path);
      }
    }
    return new Promise((resolve, reject) => {
        console.log(`INSERT INTO users (email, password_hash, first_name, last_name, age ${
            data.photo_path ? ", photo_path" : ""
          }) VALUES (${Array(queryParams.length).fill("?").join(", ")})`);
      con.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, age ${
          data.photo_path ? ", photo_path" : ""
        }) VALUES (${Array(queryParams.length).fill("?").join(", ")})`,
        queryParams,
        (err, data, fields) => {
          if (err) {
            resolve("Failed to create");
          } else {
            resolve(true);
          }
        }
      );
    });
  },

  uploadFile: async (fileData) => {
    const filePath = `pictures/${uuidv4()}.jpeg`;
    fileData = fileData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

    return new Promise((resolve) => {
      fs.writeFile(filePath, fileData, 'base64', (err) => {
        
        if (err) {
            console.log(err);
          resolve(false);
        } else {
          resolve(filePath);
        }
      });
    });
  },

  validateEmail(email) {
    let ret = false;
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      ret = true;
    }
    return ret;
  },
  validate: async function (data, oldData = {}, con) {
    if (!this.validateEmail(data.email)) {
      return "Email validation failed";
    }
    if (oldData.email !== data.email) {
      const foundExistingUser = await this.findby("email", data.email, con);
      if (foundExistingUser) {
        return "Email already taken";
      }
    }
    if (data.first_name > 50) {
      return "First name is too long";
    }
    if (data.last_name > 50) {
      return "Last name is too long";
    }
    if (data.age < 0) {
      return "Age cannot be negative";
    }
    if (data.age > 999) {
      return "Are you a vampire?";
    }
    if (
      typeof data.password !== "undefined" &&
      data.password &&
      data.password.length < 6
    ) {
      return "The password should be at least 6 characters long";
    }
    return true;
  },
};

module.exports = User;
