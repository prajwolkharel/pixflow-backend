import express from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

const authController = new AuthController();
const router = express.Router();

router.post("/register", validate(registerSchema), authController.register.bind(authController));
router.post("/login", validate(loginSchema), authController.login.bind(authController));

export default router;