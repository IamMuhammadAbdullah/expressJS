const express = require("express");
const db = require("./firebaseAdmin");
const router = express.Router();

router.post("/todos", async (req, res) => {
  const { todoValue, isCompleted } = req.body;
  try {
    const todo = await db.collection("todos").add({ todoValue, isCompleted });
    res.send(`Todo creation id: ${todo.id}`);
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/todos", async (req, res) => {
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

router.put('/todos/:id', async (req, res) => {
    const {id} = req.params;
    const {todoValue, isCompleted} = req.body;
    try {
        await db.collection('todos').doc(id).update({todoValue, isCompleted});
        res.send("Todo updated");
    } catch (error) {
        res.send(error.message);
    }
})

router.delete('/todos/:id', async(req, res) => {
    const {id} = req.params;

    try {
        await db.collection('todos').doc(id).delete();
        res.send("Todo deleted");
    } catch (error) {
        res.send(error.message);
    }
})

module.exports = router;
