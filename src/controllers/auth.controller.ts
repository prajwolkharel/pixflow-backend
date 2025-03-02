import { Request, Response, NextFunction } from 'express';
import { registerUser } from '../services/user.service.js';
import { RegisterRequest } from '../types/auth.types.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body as RegisterRequest;
    console.log(`Controller:: name: ${name}, ${email}, ${password}, ${role}`);
    const user = await registerUser({ name, email, password, role });
    res.ok({ status: 201, message: 'User registered successfully', data: user });
  } catch (error) {
    console.log(error);
    res.fail({ status: 400, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};