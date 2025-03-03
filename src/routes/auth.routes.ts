import express from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.js";
import { registerSchema } from "../validations/auth.validation.js";

const authController = new AuthController();
const router = express.Router();

router.post("/register", validate(registerSchema), authController.register.bind(authController));

export default router;