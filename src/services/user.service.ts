import { PrismaClient } from '@prisma/client';
import { RegisterRequest, RegisterResponse } from '../types/auth.types.js';

const prisma = new PrismaClient();

export const registerUser = async ({ name, email, password, role }: RegisterRequest): Promise<RegisterResponse> => {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password, // Plaintext for now—hashing next
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
};