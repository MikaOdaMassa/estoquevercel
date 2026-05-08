import { redirect } from 'next/navigation';
import { checkAuth } from '../../actions/auth';

export default async function HistoricoLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAuth();
  
  if (!isAdmin) {
    redirect('/login');
  }

  return <>{children}</>;
}
