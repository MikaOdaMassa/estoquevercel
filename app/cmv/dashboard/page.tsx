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

export default function DashboardPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
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
    async function load() {
      setLoading(true);
      setErro('');
      try {
        const res = await fetch(`/api/shifts?location=${currentLocation}`, { cache: 'no-store' });
        const json = await res.json();
        if (json.result === 'success' && Array.isArray(json.data)) {
          setTurnos(json.data);
        } else {
          setErro(json.message || 'Erro ao carregar turnos do banco de dados.');
        }
      } catch (e: any) {
        setErro('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentLocation]);

  const stats = useMemo(() => {
    const financialTurnos = currentLocation === 'ALL' ? groupTurnosConsolidados(turnos) : turnos;
    const completedTurnos = financialTurnos.filter(t => t.Status === 'CONCLUIDO');
    if (completedTurnos.length === 0) return null;

    const totalVendido = completedTurnos.reduce((a, t) => a + (Number(t.RealFinalSales) || 0), 0);
    const totalIfood = completedTurnos.reduce((a, t) => a + (Number(t.IfoodNet) || 0), 0);
    const totalNinetynine = completedTurnos.reduce((a, t) => a + (Number(t.NinetynineNet) || 0), 0);
    const totalCounter = completedTurnos.reduce((a, t) => a + (Number(t.CounterNet) || 0), 0);
    const totalMachineFees = completedTurnos.reduce((a, t) => a + (Number(t.MachineFees) || 0), 0);
    const totalDiscounts = completedTurnos.reduce((a, t) => a + (Number(t.Discounts) || 0), 0);

    const totalCusto = completedTurnos.reduce((a, t) => a + getTurnoCusto(t), 0);
    const totalMeta = completedTurnos.reduce((a, t) => a + (Number(t.RealFinalSales) || 0) * ((Number(t.PercentualMeta) || 0) / 100), 0);
    const cmvGlobal = totalVendido > 0 ? (totalCusto / totalVendido) * 100 : 0;
    const lucroBruto = totalVendido - totalCusto;
    const desvio = totalCusto - totalMeta;

    const periodos = ['Manhã', 'Tarde', 'Noite'];
    const porPeriodo = periodos.map(p => {
      const ts = completedTurnos.filter(t => t.Periodo === p);
      const vendido = ts.reduce((a, t) => a + (Number(t.RealFinalSales) || 0), 0);
      const custo = ts.reduce((a, t) => a + getTurnoCusto(t), 0);
      const cmv = vendido > 0 ? (custo / vendido) * 100 : 0;
      return { periodo: p, vendido, custo, cmv, count: ts.length };
    });

    const resumoPorLocal = LOCATION_OPTIONS
      .filter(option => option.value !== 'ALL')
      .map(option => {
        const ts = turnos.filter(t => t.Status === 'CONCLUIDO' && t.Local === option.value);
        const custo = ts.reduce((a, t) => a + getTurnoCusto(t), 0);
        const percentualCusto = totalCusto > 0 ? (custo / totalCusto) * 100 : 0;
        return { local: option.value, label: option.label, custo, percentualCusto, count: ts.length };
      });

    const custoPorProduto: Record<string, number> = {};
    completedTurnos.forEach(t => {
      (t.Produtos || []).forEach(p => {
        custoPorProduto[p.produtoNome] = (custoPorProduto[p.produtoNome] || 0) + (p.custo || 0);
      });
    });
    const topProdutos = Object.entries(custoPorProduto)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { 
      totalVendido, totalIfood, totalNinetynine, totalCounter, totalMachineFees, totalDiscounts,
      totalCusto, totalMeta, cmvGlobal, lucroBruto, desvio, porPeriodo, topProdutos, resumoPorLocal
    };
  }, [currentLocation, turnos]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 md:py-10 md:px-5 pb-24">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Dashboard Financeiro</h1>
            <p style={{ color: '#64748b', marginTop: '4px' }}>
              Monitoramento de CMV e lucratividade - {currentLocation === 'ALL' ? 'visão consolidada' : getLocationLabel(currentLocation)}
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
                    padding: '10px 14px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                    background: currentLocation === option.value ? '#fff' : 'transparent',
                    color: currentLocation === option.value ? '#4f46e5' : '#64748b',
                    boxShadow: currentLocation === option.value ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className={`fas ${option.icon}`} style={{ marginRight: '8px' }}></i> {option.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {!stats ? (
          <div style={{ background: '#fff', borderRadius: '24px', padding: '60px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '18px', color: '#64748b' }}>Nenhum turno com fechamento financeiro concluído.</p>
            <Link href="/cmv/historico" style={{ display: 'inline-block', marginTop: '20px', background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600 }}>Ir para Histórico</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '32px' }}>
            
            {/* Destaque CMV */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-10 gap-6 text-white rounded-[24px]" style={{ 
              background: stats.desvio > 0 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #4f46e5, #4338ca)',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>
                  CMV {currentLocation === 'ALL' ? 'Consolidado' : getLocationLabel(currentLocation)} Acumulado
                </div>
                <div style={{ fontSize: '64px', fontWeight: 900 }}>{stats.cmvGlobal.toFixed(1)}%</div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '100px', display: 'inline-block', fontSize: '14px', fontWeight: 600, marginTop: '16px' }}>
                   {stats.desvio > 0 ? '⚠ Acima da meta' : '✓ Dentro da meta'}
                </div>
              </div>
              <div className="text-left md:text-right">
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Lucro Bruto Estimado</div>
                <div style={{ fontSize: '32px', fontWeight: 800 }}>R$ {stats.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { label: 'Vendas Totais', val: `R$ ${stats.totalVendido.toLocaleString('pt-BR')}`, color: '#1e293b' },
                { label: 'Custo Insumos', val: `R$ ${stats.totalCusto.toLocaleString('pt-BR')}`, color: '#1e293b' },
                { label: 'Meta Planejada', val: `R$ ${stats.totalMeta.toLocaleString('pt-BR')}`, color: '#64748b' },
                { label: 'Desvio da Meta', val: `${stats.desvio > 0 ? '+' : ''}R$ ${stats.desvio.toLocaleString('pt-BR')}`, color: stats.desvio > 0 ? '#ef4444' : '#10b981' }
              ].map(kpi => (
                <div key={kpi.label} style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>{kpi.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: kpi.color }}>{kpi.val}</div>
                </div>
              ))}
            </div>

            {userRole === 'ADMIN' && currentLocation === 'ALL' && (
              <div style={{ background: '#fff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Custo por Local</h3>
                <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                  As vendas ficam consolidadas porque o balcão mistura bar e cozinha. Por local, o painel mostra apenas a participação no custo operacional.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {stats.resumoPorLocal.map(item => (
                    <div key={item.local} style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>{item.label}</span>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{item.count} fech.</span>
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#4f46e5', marginBottom: '12px' }}>
                        R$ {item.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Participação no custo</span>
                          <strong>{item.percentualCusto.toFixed(1)}%</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Composição Financeira */}
            <div style={{ background: '#fff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Composição Financeira</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>iFood (Líquido)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>R$ {stats.totalIfood.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>99Food (Líquido)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>R$ {stats.totalNinetynine.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Balcão</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>R$ {stats.totalCounter.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Taxas Maquininha</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>- R$ {stats.totalMachineFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Estornos/Descontos</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>- R$ {stats.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>

            {/* Por Período e Top Insumos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
               <div style={{ background: '#fff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                 <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>CMV por Período</h3>
                 <div style={{ display: 'grid', gap: '16px' }}>
                   {stats.porPeriodo.map(p => (
                     <div key={p.periodo} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ width: '80px', fontWeight: 600, color: '#64748b' }}>{p.periodo}</div>
                       <div style={{ flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                         <div style={{ width: `${Math.min(100, p.cmv)}%`, height: '100%', background: p.cmv > 35 ? '#ef4444' : '#4f46e5' }}></div>
                       </div>
                       <div style={{ width: '50px', fontWeight: 700, textAlign: 'right' }}>{p.cmv.toFixed(1)}%</div>
                     </div>
                   ))}
                 </div>
               </div>

               <div style={{ background: '#fff', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                 <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Insumos de Maior Impacto</h3>
                 <div style={{ display: 'grid', gap: '16px' }}>
                   {stats.topProdutos.map(([nome, custo], i) => (
                     <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <span style={{ width: '24px', height: '24px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>{i+1}</span>
                         <span style={{ fontWeight: 600, color: '#1e293b' }}>{nome}</span>
                       </div>
                       <span style={{ fontWeight: 700, color: '#64748b' }}>R$ {custo.toLocaleString('pt-BR')}</span>
                     </div>
                   ))}
                 </div>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
