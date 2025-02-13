const express = require("express");
const app = express();
const port = 3000;

const item = require("./routes/item");
const first = require("./routes/first");

app.use("/abc", item);
app.use("/def", first);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
