import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Permitir acesso à página de login e arquivos estáticos
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 2. Permitir acesso às APIs
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. Redirecionar para login se não estiver autenticado
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
