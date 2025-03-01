const express = require("express");
const db = require("./firebaseAdmin");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const router = express.Router();
const { default: axios } = require("axios");

const API_KEY = "AIzaSyDnUt_8QyJjpgiJzjHf4vLlAyzDVMgWRJM";

async function authorization(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).send("No token found");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRef = admin.firestore().collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).send("User data does not exist");
    }

    const user = doc.data();
    user.uid = uid; // attach UID to user data
    req.user = user;

    // Check user role if the user is found and token is valid
    if (req.user.role !== "admin") {
      return res.status(403).send("Access denied. You are not an admin.");
    }

    next(); // Continue to next middleware or route handler if all checks pass
  } catch (error) {
    res.status(401).send("Authentication failed: " + error.message);
  }
}

router.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userDetails = await admin.auth().createUser({
      email,
      password: hashedPassword,
    });

    const userRef = admin.firestore().collection("users").doc(userDetails.uid);
    await userRef.set({
      email: email,
      password: hashedPassword,
      name: name,
      role: role,
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
});

router.post("/login", async (req, res) => {
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
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true,
      }
    );
    // GET TOKEN
    const idToken = response.data.idToken;
    // PASS THAT TOKEN

    res.send({
      uid: user.uid,
      token: idToken,
      message: "Login successful",
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.post("/todos", authorization, async (req, res) => {
  const { todoValue, isCompleted } = req.body;
  try {
    const todo = await db.collection("todos").add({ todoValue, isCompleted });
    res.send(`Todo creation id: ${todo.id}`);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/todos", authorization, async (req, res) => {
  try {
    const getTodos = await db.collection("todos").get();
    const todos = [];

    getTodos.forEach((todo) => {
      todos.push({
        id: todo.id,
        ...todo.data(),
      });
    });
    res.json(todos);
  } catch (error) {
    res.send(error.message);
  }
});

router.put("/todos/:id", authorization, async (req, res) => {
  const { id } = req.params;
  const { todoValue, isCompleted } = req.body;
  try {
    await db.collection("todos").doc(id).update({ todoValue, isCompleted });
    res.send("Todo updated");
  } catch (error) {
    res.send(error.message);
  }
});

router.delete("/todos/:id", authorization, async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("todos").doc(id).delete();
    res.send("Todo deleted");
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;
