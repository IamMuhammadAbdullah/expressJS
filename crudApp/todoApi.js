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
    return res.send("No token found");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRef = admin.firestore().collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.send("User data does not exist");
    }

    const user = doc.data();
    user.uid = uid;
    req.user = user;
    next();
  } catch (error) {
    res.send("Authentication failed");
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
    res.json({ uid: userDetails.uid, token });
  } catch (error) {
    res.send("could not register user");
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
      return res.send("User not found");
    }

    let user;
    userDoc.forEach((doc) => {
      user = doc.data();
      user.uid = doc.id;
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.send("Invalid password");
    }

    const customToken = await admin.auth().createCustomToken(user.uid);
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
      { token: customToken, returnSecureToken: true }
    );

    const idToken = response.data.idToken;
    res.send({ uid: user.uid, token: idToken });
  } catch (error) {
    res.send("could not login user");
  }
});

router.post("/todos", authorization, async (req, res) => {
  const { todoValue, isCompleted } = req.body;
  const userId = req.user.uid;

  try {
    const todo = await db
      .collection("todos")
      .add({ userId, todoValue, isCompleted });
    res.send(todo.id);
  } catch (error) {
    res.send("todo creation failed");
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

    res.json(todos);
  } catch (error) {
    res.send("unable to fetch todos");
  }
});

router.put("/todos/:id", authorization, async (req, res) => {
  const { id } = req.params;
  const { todoValue, isCompleted } = req.body;

  try {
    const todoRef = db.collection("todos").doc(id);
    const todoDoc = await todoRef.get();

    if (!todoDoc.exists) {
      return res.send("Todo not found");
    }

    const todoData = todoDoc.data();

    if (req.user.role !== "admin" && todoData.userId !== req.user.uid) {
      return res.send("Access denied");
    }

    await todoRef.update({ todoValue, isCompleted });
    res.send("Todo updated");
  } catch (error) {
    res.send("unable to update todo");
  }
});

router.delete("/todos/:id", authorization, async (req, res) => {
  const { id } = req.params;

  try {
    const todoRef = db.collection("todos").doc(id);
    const todoDoc = await todoRef.get();

    if (!todoDoc.exists) {
      return res.send("Todo not found");
    }

    const todoData = todoDoc.data();

    if (req.user.role !== "admin" && todoData.userId !== req.user.uid) {
      return res.send("Access denied");
    }

    await todoRef.delete();
    res.send("Todo deleted");
  } catch (error) {
    res.send("unable to delete todo");
  }
});

module.exports = router;
