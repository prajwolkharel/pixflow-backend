import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { RegisterRequest, RegisterResponse } from '../types/auth.types.js';
import { registerSchema } from '../validations/auth.validation.js';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body as RegisterRequest;
      const user: RegisterResponse = await this.authService.registerUser({ name, email, password, role });
      res.ok({ status: 201, message: 'User registered successfully', data: user });
    } catch (error) {
      next(error);
    }
  }
}

export { registerSchema };