const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/register", authController.renderRegisterPage);
router.get("/login", authController.renderLoginPage);
router.get(
  "/profile",
  authController.authToken,
  authController.renderProfilePage
);

module.exports = router;
