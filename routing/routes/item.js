const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Got a get Request");
  //   res.sendFile("../index.html", { root: __dirname });
});

// acha i have checked this on postman
router.post("/items", (req, res) => {
  // res.send("Got a post request");
  res.json({ a: 1, b: 2, c: 3 });
});

router.put("/items/:id", (req, res) => {
  res.send("Got a put request");
});

router.delete("/items/:id", (req, res) => {
  res.send("Got a delete request");
});

module.exports = router;
