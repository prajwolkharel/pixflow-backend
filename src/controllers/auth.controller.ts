import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { RegisterRequest, RegisterResponse } from '../types/auth.types.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body as RegisterRequest;
      const user: RegisterResponse = await this.authService.registerUser(userData);
      res.ok({ status: 201, message: 'User registered successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const token = await this.authService.loginUser(email, password);
      res.ok({ status: 200, message: 'Login successful', data: { token } });
    } catch (error) {
      next(error);
    }
  }
}

export { registerSchema, loginSchema };