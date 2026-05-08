'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

export async function login(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const cookieStore = await cookies();
      
      cookieStore.set('auth_token', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      
      cookieStore.set('user_role', user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      cookieStore.set('user_location', user.location, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      cookieStore.set('username', user.username, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return { success: true };
    }
    
    return { success: false, message: 'Senha incorreta' };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: 'Erro ao processar login' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('user_role');
  cookieStore.delete('user_location');
  cookieStore.delete('username');
  redirect('/login');
}

export async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value === 'true';
}

export async function getRole() {
  const cookieStore = await cookies();
  return cookieStore.get('user_role')?.value || 'OPERATOR';
}

export async function getUserLocation() {
  const cookieStore = await cookies();
  return cookieStore.get('user_location')?.value || 'COZINHA';
}

export async function getUsername() {
  const cookieStore = await cookies();
  return cookieStore.get('username')?.value || '';
}

export async function isAdmin() {
  const role = await getRole();
  return role === 'ADMIN';
}
