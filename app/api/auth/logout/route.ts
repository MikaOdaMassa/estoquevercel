import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('user_role');
  cookieStore.delete('username');
  
  // Redireciona para o login após o logout
  const url = new URL('/login', request.url);
  return Response.redirect(url);
}
