const express = require("express");
const router = express.Router();

router.get("/:slug", (req, res) => {
  // res.send("Got a get Request");
  //   res.sendFile("../index.html", { root: __dirname });
  res.send(req.query)
});

// acha i have checked this on postman
router.post("/first", (req, res) => {
  // res.send("Got a post request");
  res.json({ a: 1, b: 2, c: 3 });
});

router.put("/first/:id", (req, res) => {
  res.send(req.params);
});

router.delete("/first/:id", (req, res) => {
  res.send("Got a delete request");
});

module.exports = router;
