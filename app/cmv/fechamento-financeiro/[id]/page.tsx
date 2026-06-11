'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { Turno, findTurnosDoMesmoFechamento, getLocationLabel, getTurnoCusto } from '../../financial';

export default function FechamentoFinanceiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [shift, setShift] = useState<Turno | null>(null);
  const [shiftGroup, setShiftGroup] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  // Financial inputs
  const [grossSales, setGrossSales] = useState(''); // Just for reference
  const [ifoodNet, setIfoodNet] = useState('');
  const [ninetynineNet, setNinetynineNet] = useState('');
  const [counterNet, setCounterNet] = useState('');
  const [machineFees, setMachineFees] = useState('');
  const [discounts, setDiscounts] = useState('');
  const [targetCmvPercentage, setTargetCmvPercentage] = useState('30');

  useEffect(() => {
    async function loadShift() {
      try {
        const res = await fetch(`/api/shifts?location=ALL`, { cache: 'no-store' });
        const json = await res.json();
        const allShifts: Turno[] = json.result === 'success' && Array.isArray(json.data) ? json.data : [];
        const found = allShifts.find((s) => s.ID === id);
        if (found) {
          const group = findTurnosDoMesmoFechamento(allShifts, found);
          const financialSource = group.find(item => (Number(item.RealFinalSales) || 0) > 0) || found;
          setShift(found);
          setShiftGroup(group);
          setTargetCmvPercentage(financialSource.PercentualMeta?.toString() || '30');
          setGrossSales(financialSource.ValorVendido ? financialSource.ValorVendido.toString() : '');
          setIfoodNet(financialSource.IfoodNet ? financialSource.IfoodNet.toString() : '');
          setNinetynineNet(financialSource.NinetynineNet ? financialSource.NinetynineNet.toString() : '');
          setCounterNet(financialSource.CounterNet ? financialSource.CounterNet.toString() : '');
          setMachineFees(financialSource.MachineFees ? financialSource.MachineFees.toString() : '');
          setDiscounts(financialSource.Discounts ? financialSource.Discounts.toString() : '');
        } else {
          setErro('Turno não encontrado.');
        }
      } catch (e) {
        setErro('Erro ao carregar o turno.');
      } finally {
        setLoading(false);
      }
    }
    loadShift();
  }, [id]);

  const custoOperacional = useMemo(() => {
    return shiftGroup.reduce((sum, item) => sum + getTurnoCusto(item), 0);
  }, [shiftGroup]);

  const custosPorLocal = useMemo(() => {
    return shiftGroup.map(item => ({
      id: item.ID,
      local: item.Local,
      label: getLocationLabel(item.Local),
      custo: getTurnoCusto(item),
    }));
  }, [shiftGroup]);

  const totais = useMemo(() => {
    const iNet = parseFloat(ifoodNet.replace(',', '.')) || 0;
    const nNet = parseFloat(ninetynineNet.replace(',', '.')) || 0;
    const cNet = parseFloat(counterNet.replace(',', '.')) || 0;
    const mFees = parseFloat(machineFees.replace(',', '.')) || 0;
    const disc = parseFloat(discounts.replace(',', '.')) || 0;
    const tCmv = parseFloat(targetCmvPercentage.replace(',', '.')) || 30;
    const gSales = parseFloat(grossSales.replace(',', '.')) || 0;

    const realFinalSales = iNet + nNet + cNet - mFees - disc;
    
    const cmvPerc = realFinalSales > 0 ? (custoOperacional / realFinalSales) * 100 : 0;
    const metaValor = realFinalSales * (tCmv / 100);
    const lucroBruto = realFinalSales - custoOperacional;
    const desvio = custoOperacional - metaValor;

    return { realFinalSales, cmvPerc, lucroBruto, desvio, metaValor, tCmv, gSales, iNet, nNet, cNet, mFees, disc };
  }, [ifoodNet, ninetynineNet, counterNet, machineFees, discounts, targetCmvPercentage, custoOperacional, grossSales]);

  const handleSalvar = async () => {
    if (totais.realFinalSales <= 0) {
      setErro('O faturamento líquido real deve ser maior que zero.');
      return;
    }

    setSaving(true);
    setErro('');

    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ifoodNet: totais.iNet,
          ninetynineNet: totais.nNet,
          counterNet: totais.cNet,
          machineFees: totais.mFees,
          discounts: totais.disc,
          realFinalSales: totais.realFinalSales,
          totalSales: totais.gSales,
          targetCmvPercentage: totais.tCmv,
          consolidatedShiftIds: shiftGroup.map(item => item.ID),
        }),
      });

      const json = await res.json();
      if (json.result === 'success') {
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'success',
          title: 'Fechamento Financeiro Concluído!',
          confirmButtonColor: '#4f46e5',
        });
        window.location.href = '/cmv/historico';
      } else {
        setErro(json.message || 'Erro ao salvar o faturamento.');
      }
    } catch (e) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>{erro || 'Turno não encontrado.'}</h1>
        <Link href="/cmv/historico" style={{ display: 'inline-block', marginTop: '20px', color: '#4f46e5' }}>Voltar ao Histórico</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px' }}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Fechamento Financeiro</h1>
            <p style={{ color: '#64748b', marginTop: '4px' }}>
              Turno: <span style={{ fontWeight: 700 }}>{shift.Periodo} — {shift.Data}</span> • Fechamento consolidado
            </p>
          </div>
          <Link href="/cmv/historico" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600 }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i> Voltar
          </Link>
        </div>

        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fas fa-exclamation-triangle"></i>
            <span style={{ fontWeight: 500 }}>{erro}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-8 items-start">
          
          <div className="space-y-6">
            <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Custos Operacionais do Turno</h3>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                    Cozinha e bar entram juntos no CMV, porque o balcão mistura as duas operações.
                  </p>
                </div>
                <div style={{ background: '#ecfdf5', color: '#047857', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {shiftGroup.length} {shiftGroup.length === 1 ? 'turno' : 'turnos'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                {custosPorLocal.map(item => (
                  <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>{item.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>R$ {item.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#c2410c', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Total Consolidado</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#c2410c' }}>R$ {custoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Entradas Financeiras (R$)</h3>
              <p style={{ margin: '-12px 0 22px', color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                Informe os valores uma única vez. O cálculo usa o custo operacional somado de cozinha + bar.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Faturamento iFood (Líquido)</label>
                  <input type="text" value={ifoodNet} onChange={e => setIfoodNet(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Faturamento 99Food (Líquido)</label>
                  <input type="text" value={ninetynineNet} onChange={e => setNinetynineNet(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vendas Balcão</label>
                  <input type="text" value={counterNet} onChange={e => setCounterNet(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vendas Brutas (Total - Referência)</label>
                  <input type="text" value={grossSales} onChange={e => setGrossSales(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Descontos e Taxas (R$)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Taxas de Maquininha</label>
                  <input type="text" value={machineFees} onChange={e => setMachineFees(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Outros Descontos/Estornos</label>
                  <input type="text" value={discounts} onChange={e => setDiscounts(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'sticky', top: '24px' }} className="space-y-6">
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>Resumo Consolidado</h3>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Faturamento Real (Líquido)</span>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: '#10b981' }}>R$ {totais.realFinalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Custo Operacional Consolidado</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>R$ {custoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>CMV Real vs Meta</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: totais.cmvPerc > totais.tCmv ? '#ef4444' : '#10b981' }}>
                      {totais.cmvPerc.toFixed(1)}% / {totais.tCmv}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, totais.cmvPerc)}%`, height: '100%', background: totais.cmvPerc > totais.tCmv ? '#ef4444' : '#10b981', transition: 'width 0.3s' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Diferença (Custo - Meta)</span>
                  <span style={{ fontWeight: 600, color: totais.desvio > 0 ? '#ef4444' : '#10b981' }}>
                    {totais.desvio > 0 ? '+' : ''}R$ {totais.desvio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Lucro Bruto</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '16px' }}>R$ {totais.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button 
                onClick={handleSalvar}
                disabled={saving || totais.realFinalSales <= 0}
                style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '16px', border: 'none', background: '#10b981', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' }}
              >
                {saving ? (
                  <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                ) : (
                  <><i className="fas fa-check-circle"></i> Concluir Faturamento</>
                )}
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', border: '1px solid #e2e8f0' }}>
               <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Meta de CMV (%)</label>
               <input type="number" value={targetCmvPercentage} onChange={e => setTargetCmvPercentage(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
