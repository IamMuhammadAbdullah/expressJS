const express = require("express");
const router = express.Router();

// middleware
const auth = function (req, res, next) {
  // dummy user

  req.user = { userId: 1, role: "student" };

  if (req.user) {
    // if a valid user is present we move to the next middleware
    next();
  } else {
    res.json({
      success: false,
      message: "you are not a valid user",
    });
  }
};

const isStudent = function (req, res, next) {
  if (req.user.role === "student") {
    next();
  } else {
    res.json({
      success: false,
      message: "Acces Denied",
    });
  }
};

const isAdmin = function (req, res, next) {
  if (req.user.role === "admin") {
    next();
  } else {
    res.json({
      success: false,
      message: "Admin Access Denied",
    });
  }
};

// routes

router.get("/student", auth, isStudent, (req, res) => {
    console.log("Inside student route");
    res.send("Student Page")
})

router.get("/admin", auth, isAdmin, (req, res) => {
    console.log("Inside Admin route");
    res.send("Admin page")
})

module.exports = router


// req.body basically yeh krta kai agar aap ne koi data for ex json data as a body, app ne bheja and you use get req to aap woh data extract krsakte using req.body 