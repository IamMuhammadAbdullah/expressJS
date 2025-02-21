const express = require("express");
const bodyParser = require('body-parser');
const todoRoutes = require('./todoApi');

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.json())

app.use('/', todoRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
