import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

import { isAdmin } from "./actions/auth";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Cozinha Janela – Gestão Integrada",
  description: "Sistema integrado de estoque e CMV – Cozinha Janela",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await isAdmin();
  const cookieStore = await cookies();
  const username = cookieStore.get('username')?.value;

  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="antialiased" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fb' }}>
        <Sidebar isAdmin={admin} username={username} />
        <main 
          style={{ 
            flex: 1, 
            minWidth: 0, 
            overflowX: 'hidden',
            animation: 'fadeIn 0.5s ease-out' 
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
