const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const app = express();


app.use(bodyParser.json());
app.use(express.static("public"));
app.use('/', authRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
