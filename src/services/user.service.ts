import { PrismaClient } from '@prisma/client';
import { RegisterRequest, RegisterResponse } from '../types/auth.types.js';

const prisma = new PrismaClient();

export const registerUser = async ({ name, email, password, role }: RegisterRequest): Promise<RegisterResponse> => {
  console.log(`Service:: name: ${name}, ${email}, ${password}, ${role}`);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  console.log(`Service:: user: ${user}`);

  return user;
};