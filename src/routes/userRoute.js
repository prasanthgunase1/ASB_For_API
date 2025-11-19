const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

router.get("/me", authMiddleware, userController.getLoggedInUserInfo);
router.get("/data", authMiddleware, userController.getUserData);
module.exports = router;
