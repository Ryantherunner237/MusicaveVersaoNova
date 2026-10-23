const express = require("express");
const requireAuth = require("../authMiddleware");
const {
	register,
	login,
	getCurrentUser,
	updateCurrentUser,
	logout,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentUser);
router.patch("/me", requireAuth, updateCurrentUser);
router.post("/logout", requireAuth, logout);

module.exports = router;
