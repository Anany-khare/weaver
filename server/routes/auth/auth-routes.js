const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  checkAuth,
  authMiddleware,
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/check-auth", checkAuth);

module.exports = router;
