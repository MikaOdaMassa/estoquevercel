import { redirect } from 'next/navigation';
import { checkAuth } from '../../actions/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAuth();
  
  if (!isAdmin) {
    redirect('/login');
  }

  return <>{children}</>;
}
