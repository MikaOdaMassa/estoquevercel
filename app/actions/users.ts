'use server';

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { isAdmin } from './auth';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  if (!(await isAdmin())) throw new Error('Não autorizado');
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, role: true, location: true, createdAt: true }
  });
}

export async function createUser(data: any) {
  if (!(await isAdmin())) throw new Error('Não autorizado');
  
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      role: data.role,
      location: data.location || 'COZINHA'
    }
  });
  
  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function updateUser(id: string, data: any) {
  if (!(await isAdmin())) throw new Error('Não autorizado');
  
  const updateData: any = {
    username: data.username,
    role: data.role,
    location: data.location
  };

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: updateData
  });

  revalidatePath('/admin/usuarios');
  return { success: true };
}

export async function deleteUser(id: string) {
  if (!(await isAdmin())) throw new Error('Não autorizado');
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.username === 'chefe') {
    return { success: false, message: 'O usuário mestre (chefe) não pode ser excluído.' };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/usuarios');
  return { success: true };
}
