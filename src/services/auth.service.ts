import { PrismaClient } from '@prisma/client';
import { RegisterRequest, RegisterResponse } from '../types/auth.types.js';
import bcrypt from 'bcryptjs';

export class AuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
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
}