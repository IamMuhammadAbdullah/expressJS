const path = require("path");
const admin = require("../config//firebaseConfig");
const { default: firebase } = require("firebase/compat/app");

exports.register = async (req, res) => {
  const { email, password, firstName, lastName, age } = req.body;
  try {
    const userDetails = await admin.auth().createUser({
      email: email,
      password: password,
    });
    const token = await admin.auth().createCustomToken(userDetails.uid);

    const userRef = admin.firestore().collection("users").doc(userDetails.uid);
    await userRef.set({
      email: email,
      firstName: firstName,
      lastName: lastName,
      age: age,
    });

    res.json({ uid: userDetails.uid, token: token, message: "User created" });
  } catch (error) {
    res.json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userDetail = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await admin.auth().createCustomToken(userDetail.user.uid);
    req.send({ uid: userDetail.user.uid, token: token });
  } catch (error) {
    res.json({ error: error.message });
  }
};

exports.renderRegisterPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/register.html"));
};

exports.renderLoginPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
};

exports.renderProfilePage = async (req, res) => {
  if (!req.user) {
    return res.send("User not found");
  }
  res.json({ user: req.user });
};

exports.authToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  // console.log(token);
  if (!token) {
    return res.json({ error: "Token not found" });
  }
  try {
    const verifyToken = await admin.auth().verifyIdToken(token);
    req.user = verifyToken;
    console.log("Chala");
    next();
  } catch (error) {
    res.send(error.message);
  }
};
