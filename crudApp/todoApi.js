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
    user.uid = uid;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send("Authentication failed");
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
      email,
      password: hashedPassword,
      name,
      role,
    });

    const token = await admin.auth().createCustomToken(userDetails.uid);
    res.status(201).json({ uid: userDetails.uid, token });
  } catch (error) {
    res.status(500).send("Could not register user");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRef = admin.firestore().collection("users").where("email", "==", email);
    const userDoc = await userRef.get();

    if (userDoc.empty) {
      return res.status(404).send("User not found");
    }

    let user;
    userDoc.forEach((doc) => {
      user = doc.data();
      user.uid = doc.id;
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    }

    const customToken = await admin.auth().createCustomToken(user.uid);
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
      { token: customToken, returnSecureToken: true }
    );

    const idToken = response.data.idToken;
    res.status(200).send({ uid: user.uid, token: idToken });
  } catch (error) {
    res.status(500).send("Could not login user");
  }
});

router.post("/todos", authorization, async (req, res) => {
  const { todoValue, isCompleted } = req.body;
  const userId = req.user.uid;

  try {
    const todo = await db.collection("todos").add({ userId, todoValue, isCompleted });
    res.status(201).send(todo.id);
  } catch (error) {
    res.status(500).send("Todo creation failed");
  }
});

router.get("/todos", authorization, async (req, res) => {
  try {
    let todoQuery;
    if (req.user.role === "admin") {
      todoQuery = db.collection("todos");
    } else {
      todoQuery = db.collection("todos").where("userId", "==", req.user.uid);
    }

    const getTodos = await todoQuery.get();
    const todos = [];
    getTodos.forEach((todo) => {
      todos.push({ id: todo.id, ...todo.data() });
    });

    res.status(200).json(todos);
  } catch (error) {
    res.status(500).send("Unable to fetch todos");
  }
});

router.put("/todos/:id", authorization, async (req, res) => {
  const { id } = req.params;
  const { todoValue, isCompleted } = req.body;

  try {
    const todoRef = db.collection("todos").doc(id);
    const todoDoc = await todoRef.get();

    if (!todoDoc.exists) {
      return res.status(404).send("Todo not found");
    }

    const todoData = todoDoc.data();

    if (req.user.role !== "admin" && todoData.userId !== req.user.uid) {
      return res.status(401).send("Access denied");
    }

    await todoRef.update({ todoValue, isCompleted });
    res.status(200).send("Todo updated");
  } catch (error) {
    res.status(500).send("Unable to update todo");
  }
});

router.delete("/todos/:id", authorization, async (req, res) => {
  const { id } = req.params;

  try {
    const todoRef = db.collection("todos").doc(id);
    const todoDoc = await todoRef.get();

    if (!todoDoc.exists) {
      return res.status(404).send("Todo not found");
    }

    const todoData = todoDoc.data();

    if (req.user.role !== "admin" && todoData.userId !== req.user.uid) {
      return res.status(401).send("Access denied");
    }

    await todoRef.delete();
    res.status(200).send("Todo deleted");
  } catch (error) {
    res.status(500).send("Unable to delete todo");
  }
});

module.exports = router;
