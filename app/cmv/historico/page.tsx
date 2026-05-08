'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TurnoProduto {
  produtoNome: string;
  estoqueInicial: number;
  entradas: number;
  estoqueFinal: number;
  custoAplicado: number;
  consumo: number;
  custo: number;
}

interface Turno {
  ID: string;
  Data: string;
  Responsavel: string;
  Periodo: string;
  Status: string;
  ValorVendido: number;
  PercentualMeta: number;
  IfoodNet?: number;
  NinetynineNet?: number;
  CounterNet?: number;
  MachineFees?: number;
  Discounts?: number;
  RealFinalSales?: number;
  Produtos: TurnoProduto[];
}

const PERIODOS_ICONS: Record<string, string> = {
  'Manhã': 'fa-sun',
  'Tarde': 'fa-cloud-sun',
  'Noite': 'fa-moon',
};

import { getRole, getUserLocation } from '../../actions/auth';

export default function HistoricoPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState('COZINHA');
  const [userRole, setUserRole] = useState('OPERATOR');

  useEffect(() => {
    const init = async () => {
      const role = await getRole();
      const loc = await getUserLocation();
      setUserRole(role);
      if (role === 'OPERATOR') {
        setCurrentLocation(loc);
      }
    };
    init();
  }, []);

  useEffect(() => {
    loadTurnos();
  }, [currentLocation]);

  async function loadTurnos() {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/shifts?location=${currentLocation}`);
      const json = await res.json();
      if (json.result === 'success' && Array.isArray(json.data)) {
        setTurnos(json.data);
      } else {
        setErro(json.message || 'Erro ao carregar histórico do banco de dados.');
      }
    } catch (e: any) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(turnoId: string, data: string, periodo: string) {
    const Swal = (await import('sweetalert2')).default;
    const result = await Swal.fire({
      title: 'Excluir turno do Banco?',
      html: `<strong>${data} — ${periodo}</strong><br/>Isso não afetará o estoque atual dos produtos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    setDeleting(turnoId);
    try {
      const res = await fetch(`/api/shifts/${turnoId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.result === 'success') {
        setTurnos(prev => prev.filter(t => t.ID !== turnoId));
        await Swal.fire({ icon: 'success', title: 'Turno removido!', timer: 1500, showConfirmButton: false });
      } else {
        await Swal.fire({ icon: 'error', title: 'Erro', text: json.message });
      }
    } catch (e: any) {
      console.error('Delete error:', e);
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 md:py-10 md:px-5 pb-24">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Histórico de Turnos</h1>
            <p style={{ color: '#64748b', marginTop: '4px' }}>Base de dados local (Produção)</p>
          </div>

          {/* Tab Switcher */}
          {userRole === 'ADMIN' && (
            <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
              <button 
                onClick={() => setCurrentLocation('COZINHA')}
                style={{ 
                  padding: '8px 20px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                  background: currentLocation === 'COZINHA' ? '#fff' : 'transparent',
                  color: currentLocation === 'COZINHA' ? '#4f46e5' : '#64748b',
                  boxShadow: currentLocation === 'COZINHA' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s', fontSize: '13px'
                }}
              >
                <i className="fas fa-utensils" style={{ marginRight: '8px' }}></i> Cozinha
              </button>
              <button 
                onClick={() => setCurrentLocation('BAR')}
                style={{ 
                  padding: '8px 20px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                  background: currentLocation === 'BAR' ? '#fff' : 'transparent',
                  color: currentLocation === 'BAR' ? '#4f46e5' : '#64748b',
                  boxShadow: currentLocation === 'BAR' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s', fontSize: '14px'
                }}
              >
                <i className="fas fa-glass-martini-alt" style={{ marginRight: '8px' }}></i> Bar
              </button>
            </div>
          )}

          <Link href="/cmv/novo-turno" style={{ background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Novo Turno
          </Link>
        </header>

        {erro && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>{erro}</div>}

        <div style={{ display: 'grid', gap: '16px' }}>
          {turnos.map((turno, index) => {
            const vVendido = turno.Status === 'CONCLUIDO' ? Number(turno.RealFinalSales) : 0;
            const custo = turno.Produtos?.reduce((a, p) => a + (p.custo || 0), 0) || 0;
            const cmvPerc = vVendido > 0 ? (custo / vVendido) * 100 : 0;
            const isOpen = expandido === turno.ID;
            const isPendente = turno.Status === 'AGUARDANDO_FATURAMENTO';

            return (
              <div key={`${turno.ID}_${index}`} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div className="p-4 md:p-6 flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-5">
                  <div style={{ background: '#f1f5f9', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '20px' }}>
                    <i className={`fas ${PERIODOS_ICONS[turno.Periodo] || 'fa-clock'}`}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{turno.Periodo} — {turno.Data}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Responsável: {turno.Responsavel}</div>
                    <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: isPendente ? '#fef3c7' : '#d1fae5', color: isPendente ? '#d97706' : '#059669' }}>
                      {isPendente ? 'Aguardando Faturamento' : 'Concluído'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>CMV</div>
                    {isPendente ? (
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>N/A</div>
                    ) : (
                      <div style={{ fontSize: '20px', fontWeight: 800, color: cmvPerc > (turno.PercentualMeta || 35) ? '#ef4444' : '#10b981' }}>{cmvPerc.toFixed(1)}%</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setExpandido(isOpen ? null : turno.ID)} style={{ border: 'none', background: '#f1f5f9', color: '#475569', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer' }}><i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i></button>
                    <button onClick={() => handleDelete(turno.ID, turno.Data, turno.Periodo)} disabled={deleting === turno.ID} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer' }}><i className="fas fa-trash-alt"></i></button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ background: '#f8fafc', padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                    {isPendente && userRole === 'ADMIN' && (
                      <div style={{ marginBottom: '20px', background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '12px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#92400e', fontWeight: 600 }}>Este turno ainda não teve seu faturamento registrado.</p>
                        <Link href={`/cmv/fechamento-financeiro/${turno.ID}`} style={{ display: 'inline-block', background: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                          Realizar Fechamento Financeiro
                        </Link>
                      </div>
                    )}

                    <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>Resumo de Insumos</h4>
                    <table style={{ width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
                          <th style={{ paddingBottom: '12px' }}>Insumo</th>
                          <th style={{ textAlign: 'center' }}>Inicial</th>
                          <th style={{ textAlign: 'center' }}>Entradas</th>
                          <th style={{ textAlign: 'center' }}>Final</th>
                          <th style={{ textAlign: 'right' }}>Custo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {turno.Produtos.map((p, i) => (
                          <tr key={i}>
                            <td style={{ padding: '8px 0', fontWeight: 600 }}>{p.produtoNome}</td>
                            <td style={{ textAlign: 'center' }}>{p.estoqueInicial.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{p.entradas.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>{p.estoqueFinal.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>R$ {p.custo.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                          <td colSpan={4} style={{ padding: '16px 0', fontWeight: 700, textAlign: 'right' }}>Custo Total Operacional:</td>
                          <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: '#ef4444', fontSize: '15px' }}>R$ {custo.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {!isPendente && (
                      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#1e293b' }}>Resumo Financeiro</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>iFood (Líquido)</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>R$ {(turno.IfoodNet || 0).toFixed(2)}</div>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>99Food (Líquido)</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>R$ {(turno.NinetynineNet || 0).toFixed(2)}</div>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Balcão</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>R$ {(turno.CounterNet || 0).toFixed(2)}</div>
                          </div>
                          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Taxas Maquininha</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>- R$ {(turno.MachineFees || 0).toFixed(2)}</div>
                          </div>
                          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Estornos/Descontos</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>- R$ {(turno.Discounts || 0).toFixed(2)}</div>
                          </div>
                          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Faturamento Real (Líquido)</div>
                              <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d' }}>R$ {(turno.RealFinalSales || 0).toFixed(2)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: '#4338ca', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Lucro Bruto (Real - Custo)</div>
                              <div style={{ fontSize: '20px', fontWeight: 800, color: '#4f46e5' }}>R$ {((turno.RealFinalSales || 0) - custo).toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
