const express = require("express");
const db = require("./firebaseAdmin");
const router = express.Router();

router.post("/todos", (req, res) => {
  console.log(db);
  const { todoValue, isCompleted } = req.body;
  const ref = db.ref("todos").push();
  ref.set({ todoValue, isCompleted }, (error) => {
    if (error) {
      res.send(error.message);
    } else {
      res.send("Todo created successfully");
    }
  });
});

router.get("/todos", (req, res) => {
  db.ref("todos").once(
    "value",
    (snapshot) => {
      const todos = [];
      snapshot.forEach((childSnapShot) => {
        todos.push({
          id: childSnapShot.key,
          ...childSnapShot.val(),
        });
      });
      res.json(todos);
    },
    (error) => {
      res.send(error.message);
    }
  );
});

router.put("/todos/:id", (req, res) => {
  const { id } = req.params;
  const { todoValue, isCompleted } = req.body;
  db.ref(`todos/${id}`).update({ todoValue, isCompleted }, (error) => {
    if (error) {
      console.log(error.message);
    } else {
      res.send("updated successfully");
    }
  });
});

router.delete("/todos", (req, res) => {
  const { id } = req.query;
  db.ref(`todos/${id}`).remove((error) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log("todo deleted");
    }
  });
});

module.exports = router;
