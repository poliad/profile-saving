const express = require("express");
const app = express();
const db = require("./db");
const user = require("./model/user");
const cors = require('cors');

const bodyParser = require("body-parser");
const session = require("express-session");
const sess = {
  secret: "sqGWCEuL2p1An8IgfImog7ovjREcwpyyz3CBt91We5ssF5y1PplVg0MpEzVP",
  cookie: {},
};
app.use(cors({origin: 'http://localhost:1234', credentials: true}));
app.use(session(sess));
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use('/pictures', express.static('pictures'));

db.then((con) => {
  app.get("/user/:userId", async (req, res) => {
    if (req.session.userId == req.params.userId) {
      const userData = await user.find(req.params.userId, con);
      if (userData) {
          delete userData.password_hash;
        res.send(JSON.stringify(userData));
      } else {
        throwError(res, 404, "User not found");
      }
    } else {
      throwError(res, 401, "Not allowed");
    }
  });

  app.put("/user/:userId", async (req, res) => {
    if (req.session.userId == req.params.userId) {
      const userData = await user.find(req.params.userId, con);
      if (userData) {
        const userUpdated = await user.update(req.params.userId, req.body, userData, con);
        if (userUpdated === true) {
          res.send(JSON.stringify({ message: "User updated successfully" }));
        } else {
          throwError(res, 500, userUpdated);
        }
      } else {
        throwError(res, 404, "User not found");
      }
    } else {
      throwError(res, 401, "Not allowed");
    }
  });

  app.post("/user", async (req, res) => {
    const createdUser = await user.create(req.body,con);
    if(createdUser === true){
        res.send(JSON.stringify({message: "User created!"}));
    }
    else{
        throwError(res, 400, createdUser);
    }
  });

  app.post("/login", async (req, res) => {
    const userData = await user.findby("email", req.body.email, con);
    if (userData && req.body.password === userData.password_hash) {
      req.session.userId = userData.id;
      res.send(JSON.stringify({ message: "Successfully logged in", userId: userData.id}));
    } else {
      throwError(res, 404, "Email/Password invalid");
    }
  });

  app.listen(3000, () => {
    console.log("Server started");
  });
});

const throwError = (res, code, message) => {
  res.setHeader("ContentType", "application/json");
  res.statusCode = code;
  res.send(`{"message": "${message || "Not found"}"}`);
};
