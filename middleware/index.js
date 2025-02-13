const express = require('express')
const app = express()
const port = 5000

// inbuilt middleware
app.use(express.json())

// middleware - logging, auth, validation

// acha inka order matter krta hai jou middleware process horahe hai

// const firstMiddleWare = function(req, res, next) {
//   console.log("first");
//   next();
// }

// app.use(firstMiddleWare)

// const secondMiddleWare = function(req, res, next) {
//   console.log("second");
//   next();
// }

// app.use(secondMiddleWare)

// const thirdMiddleWare = function(req, res, next) {
//   console.log("third");
//   next();
// }

// app.use(thirdMiddleWare)


// Route Specific MiddleWare

const route = require("./routes/route")
app.use('/abc', route)

app.get('/', (req, res) => {
  console.log("Route handler");
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})