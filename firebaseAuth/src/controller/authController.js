const bcrypt = require("bcrypt");
const path = require("path");
// const admin = require("../config/firebaseConfig");
const admin = require('firebase-admin');
const { default: axios } = require("axios");

const API_KEY = 'AIzaSyDPTN85cP-03QcSBRseSEnpV6yEjvOgoq'

exports.register = async (req, res) => {
  const { email, password, firstName, lastName, age } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userDetails = await admin.auth().createUser({
      email,
      password: hashedPassword,
    });

    const userRef = admin.firestore().collection("users").doc(userDetails.uid);
    await userRef.set({
      email: email,
      firstName: firstName,
      lastName: lastName,
      age: age,
      password: hashedPassword,
    });

    const token = await admin.auth().createCustomToken(userDetails.uid);

    res.json({
      uid: userDetails.uid,
      token: token,
      message: "User registered",
    });
  } catch (error) {
    res.json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRef = admin
      .firestore()
      .collection("users")
      .where("email", "==", email);
    const userDoc = await userRef.get();

    if (userDoc.empty) {
      return res.json({ error: "User not found" });
    }

    let user;
    userDoc.forEach((doc) => {
      user = doc.data();
      user.uid = doc.id;
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.json({ error: "Invalid password" });
    }

    const customToken = await admin.auth().createCustomToken(user.uid);

    // CALL AXIOS API
    const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
      token: customToken,
      returnSecureToken: true
    })
    // GET TOKEN
    const idToken = response.data.idToken
    // PASS THAT TOKEN


    res.send({
      uid: user.uid,
      token: idToken,
      message: "Login successful",
    });
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
  const uid = req.user.uid;
  console.log(req.user)
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.json({ error: "User not found" });
  }

  const userData = userDoc.data();

  res.json({
    uid: req.user.uid,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    age: userData.age,
  });
};

exports.authToken = async (req, res, next) => {
  console.log(req.headers);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ error: "Authorization header not found" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token: ", token);
  if (!token) {
    return res.json({ error: "Token not found" });
  }

  try {
    const verifyToken = await admin.auth().verifyIdToken(token);
    req.user = verifyToken;

    next();
  } catch (error) {
    res.send({ error: error.message });
  }
};
