'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getRole, getUserLocation } from '../../actions/auth';
import { Turno, getLocationLabel, getTurnoCusto, groupTurnosConsolidados } from '../financial';

type LocationFilter = 'ALL' | 'COZINHA' | 'BAR';

const LOCATION_OPTIONS: { value: LocationFilter; label: string; icon: string }[] = [
  { value: 'ALL', label: 'Consolidado', icon: 'fa-layer-group' },
  { value: 'COZINHA', label: 'Cozinha', icon: 'fa-utensils' },
  { value: 'BAR', label: 'Bar', icon: 'fa-glass-martini-alt' },
];

const PERIODOS_ICONS: Record<string, string> = {
  'Manhã': 'fa-sun',
  'Tarde': 'fa-cloud-sun',
  'Noite': 'fa-moon',
};

export default function HistoricoPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationFilter>('ALL');
  const [userRole, setUserRole] = useState('OPERATOR');

  useEffect(() => {
    const init = async () => {
      const role = await getRole();
      const loc = await getUserLocation();
      setUserRole(role);
      if (role === 'OPERATOR') {
        setCurrentLocation(loc === 'BAR' ? 'BAR' : 'COZINHA');
      }
    };
    init();
  }, []);

  useEffect(() => {
    loadTurnos();
  }, [currentLocation]);

  const turnosExibidos = useMemo(() => {
    return currentLocation === 'ALL' ? groupTurnosConsolidados(turnos) : turnos;
  }, [currentLocation, turnos]);

  async function loadTurnos() {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/shifts?location=${currentLocation}`, { cache: 'no-store' });
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

  async function handleDelete(turnoIds: string[], data: string, periodo: string) {
    const Swal = (await import('sweetalert2')).default;
    const isConsolidatedDelete = turnoIds.length > 1;
    const result = await Swal.fire({
      title: isConsolidatedDelete ? 'Excluir fechamento consolidado?' : 'Excluir turno do Banco?',
      html: `<strong>${data} — ${periodo}</strong><br/>${isConsolidatedDelete ? 'Cozinha e bar serão removidos do histórico.' : 'Isso não afetará o estoque atual dos produtos.'}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    const deletingKey = turnoIds.join('__');
    setDeleting(deletingKey);
    try {
      const responses = await Promise.all(
        turnoIds.map(turnoId => fetch(`/api/shifts/${turnoId}`, { method: 'DELETE' }))
      );
      const results = await Promise.all(responses.map(res => res.json()));
      const failed = results.find(json => json.result !== 'success');

      if (!failed) {
        setTurnos(prev => prev.filter(t => !turnoIds.includes(t.ID)));
        await Swal.fire({ icon: 'success', title: 'Turno removido!', timer: 1500, showConfirmButton: false });
      } else {
        await Swal.fire({ icon: 'error', title: 'Erro', text: failed.message });
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
            <p style={{ color: '#64748b', marginTop: '4px' }}>
              {currentLocation === 'ALL' ? 'Todos os turnos de Cozinha e Bar' : `Turnos de ${getLocationLabel(currentLocation)}`}
            </p>
          </div>

          {/* Tab Switcher */}
          {userRole === 'ADMIN' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content', maxWidth: '100%' }}>
              {LOCATION_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setCurrentLocation(option.value)}
                  style={{
                    padding: '8px 16px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                    background: currentLocation === option.value ? '#fff' : 'transparent',
                    color: currentLocation === option.value ? '#4f46e5' : '#64748b',
                    boxShadow: currentLocation === option.value ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s', fontSize: '13px', whiteSpace: 'nowrap'
                  }}
                >
                  <i className={`fas ${option.icon}`} style={{ marginRight: '8px' }}></i> {option.label}
                </button>
              ))}
            </div>
          )}

          <Link href="/cmv/novo-turno" style={{ background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Novo Turno
          </Link>
        </header>

        {erro && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>{erro}</div>}

        <div style={{ display: 'grid', gap: '16px' }}>
          {turnosExibidos.map((turno, index) => {
            const vVendido = turno.Status === 'CONCLUIDO' ? Number(turno.RealFinalSales) : 0;
            const custo = getTurnoCusto(turno);
            const cmvPerc = vVendido > 0 ? (custo / vVendido) * 100 : 0;
            const isOpen = expandido === turno.ID;
            const isPendente = turno.Status === 'AGUARDANDO_FATURAMENTO';
            const turnoIds = turno.OriginalIds || [turno.ID];
            const deletingKey = turnoIds.join('__');
            const isConsolidated = turno.IsConsolidated || turno.Local === 'CONSOLIDADO';

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
                    <div style={{ marginTop: '8px', marginLeft: '8px', display: 'inline-block', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: isConsolidated ? '#eef2ff' : turno.Local === 'BAR' ? '#eff6ff' : '#f0fdf4', color: isConsolidated ? '#4338ca' : turno.Local === 'BAR' ? '#2563eb' : '#15803d' }}>
                      {isConsolidated ? 'Consolidado: Cozinha + Bar' : getLocationLabel(turno.Local)}
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
                    <button onClick={() => handleDelete(turnoIds, turno.Data, turno.Periodo)} disabled={deleting === deletingKey} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer' }}><i className="fas fa-trash-alt"></i></button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ background: '#f8fafc', padding: '24px', borderTop: '1px solid #f1f5f9' }}>
                    {isPendente && userRole === 'ADMIN' && (
                      <div style={{ marginBottom: '20px', background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '12px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#92400e', fontWeight: 600 }}>Este turno ainda não teve seu faturamento registrado.</p>
                        <Link href={`/cmv/fechamento-financeiro/${turno.FechamentoID || turno.ID}`} style={{ display: 'inline-block', background: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                          Realizar Fechamento Consolidado
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
                          <td colSpan={4} style={{ padding: '16px 0', fontWeight: 700, textAlign: 'right' }}>{isConsolidated ? 'Custo Operacional Consolidado:' : 'Custo Total Operacional:'}</td>
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
