'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../actions/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(username, password);
      if (result.success) {
        router.push('/'); // Redireciona para o estoque por padrão
        router.refresh();
      } else {
        setError(result.message || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: '#f1f5f9' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)' }}>
            <i className="fas fa-user-shield" style={{ color: '#fff', fontSize: '30px' }}></i>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>Cozinha Janela</h1>
          <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500, margin: 0 }}>Identifique-se para acessar o sistema</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Usuário</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-user" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ex: chefe"
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '16px', background: '#f8fafc', transition: 'all 0.2s', fontWeight: 600 }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '16px', background: '#f8fafc', transition: 'all 0.2s', fontWeight: 600 }}
                required
              />
            </div>
          </div>
          
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff1f2', color: '#e11d48', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid #fecdd3' }}>
              <i className="fas fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '18px', borderRadius: '18px', border: 'none', 
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#fff', 
              fontSize: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)',
              marginTop: '8px'
            }}
          >
            {loading ? 'Processando...' : 'ENTRAR NO SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
}
