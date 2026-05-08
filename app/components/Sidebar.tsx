'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  exact?: boolean;
}

const SECTION_ESTOQUE: NavItem[] = [
  { href: '/', icon: 'fa-warehouse', label: 'Estoque', exact: true },
];

const SECTION_CMV: NavItem[] = [
  { href: '/cmv/novo-turno', icon: 'fa-clock-rotate-left', label: 'Novo Turno' },
  { href: '/cmv/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
  { href: '/cmv/historico', icon: 'fa-list-ul', label: 'Histórico' },
];

function NavLink({ item, collapsed, pathname }: { item: NavItem; collapsed: boolean; pathname: string }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? '0' : '12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '12px' : '11px 14px',
        borderRadius: '12px',
        fontWeight: 500,
        fontSize: '14px',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        color: isActive ? '#6366f1' : '#4b5563',
        background: isActive ? '#eef2ff' : 'transparent',
        borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = '#f5f3ff';
          (e.currentTarget as HTMLElement).style.color = '#6366f1';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = '#4b5563';
        }
      }}
    >
      <i className={`fas ${item.icon}`} style={{ fontSize: '16px', width: '18px', textAlign: 'center', flexShrink: 0 }} />
      {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar({ isAdmin, username }: { isAdmin: boolean; username?: string }) {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // fechar sidebar mobile ao navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebarWidth = collapsed ? 64 : 220;

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: isMobile ? (mobileOpen ? 0 : -260) : 0,
    height: '100vh',
    width: isMobile ? 220 : sidebarWidth,
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    transition: isMobile ? 'left 0.25s ease' : 'width 0.2s ease',
    zIndex: 100,
    boxShadow: isMobile && mobileOpen ? '4px 0 20px rgba(0,0,0,0.15)' : (collapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.05)'),
    overflowX: 'hidden',
  };

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            zIndex: 99, backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Botão hamburguer mobile */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(v => !v)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 101,
            background: '#6366f1', color: '#fff', border: 'none',
            borderRadius: '50%', width: 56, height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
          }}
        >
          <i className={`fas ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`} style={{ fontSize: 20 }} />
        </button>
      )}

      <aside style={sidebarStyle}>
        {/* Logo / Header */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 68,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                borderRadius: 10,
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="fas fa-utensils" style={{ color: '#fff', fontSize: 15 }} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', whiteSpace: 'nowrap' }}>Cozinha Janela</div>
                <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>Gestão Integrada</div>
              </div>
            </div>
          )}

          {/* Botão colapsar — somente desktop */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(v => !v)}
              title={collapsed ? 'Expandir' : 'Colapsar'}
              style={{
                background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 8, width: 28, height: 28,
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af', flexShrink: 0,
              }}
            >
              <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} style={{ fontSize: 11 }} />
            </button>
          )}
        </div>
        
        {/* Perfil do Usuário no Topo */}
        {!collapsed && (
          <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '16px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '12px', background: isAdmin ? '#4f46e5' : '#10b981', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px' 
              }}>
                <i className={`fas ${isAdmin ? 'fa-user-tie' : 'fa-user'}`}></i>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {username || 'Usuário'}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: isAdmin ? '#6366f1' : '#16a34a', textTransform: 'uppercase' }}>
                  {isAdmin ? 'Administrador' : 'Operador'}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
          {/* Seção Estoque */}
          {!collapsed && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>
              Estoque
            </div>
          )}
          {SECTION_ESTOQUE.map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
          ))}

          <div style={{ height: 1, background: '#f3f4f6', margin: '10px 0' }} />

          {/* Seção CMV */}
          {!collapsed && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>
              CMV
            </div>
          )}
          <NavLink key={SECTION_CMV[0].href} item={SECTION_CMV[0]} collapsed={collapsed} pathname={pathname} />
          {isAdmin && (
            <>
              <NavLink key={SECTION_CMV[1].href} item={SECTION_CMV[1]} collapsed={collapsed} pathname={pathname} />
              <NavLink key={SECTION_CMV[2].href} item={SECTION_CMV[2]} collapsed={collapsed} pathname={pathname} />
              <div style={{ height: 1, background: '#f3f4f6', margin: '10px 0' }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>
                Sistema
              </div>
              <NavLink item={{ href: '/admin/usuarios', icon: 'fa-users-gear', label: 'Usuários' }} collapsed={collapsed} pathname={pathname} />
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #f3f4f6',
          padding: collapsed ? '12px 0' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: isAdmin ? '#10b981' : '#f59e0b',
              boxShadow: isAdmin ? '0 0 0 3px #d1fae5' : '0 0 0 3px #fef3c7',
            }} />
          </div>
          
          {!collapsed && (
            <form action="/api/auth/logout" method="POST">
              <button type="submit" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                Sair
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Spacer para empurrar o conteúdo */}
      {!isMobile && (
        <div style={{ width: sidebarWidth, flexShrink: 0, transition: 'width 0.2s ease' }} />
      )}
    </>
  );
}
