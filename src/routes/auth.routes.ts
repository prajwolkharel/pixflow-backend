import express from "express";
import { register, registerSchema } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);

export default router;