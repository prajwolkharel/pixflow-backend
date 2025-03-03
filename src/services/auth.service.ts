import { PrismaClient } from '@prisma/client';
import { RegisterRequest, RegisterResponse } from '../types/auth.types.js';
import { AuthenticationError } from '../types/errors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
  private prisma: PrismaClient;
  private readonly JWT_SECRET: string;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  async registerUser({ name, email, password, role }: RegisterRequest): Promise<RegisterResponse> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    return user;
  }

  async loginUser(email: string, password: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AuthenticationError('Invalid email or password');
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, this.JWT_SECRET, { expiresIn: '1h' });
    return token;
  }
}