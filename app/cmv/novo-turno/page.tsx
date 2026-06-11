'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getUsername, getRole, getUserLocation } from '../../actions/auth';

// ─── Tipos ───────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  unitCost: number;
  salePrice: number;
}

interface TurnoProdutoForm {
  id: string; // ID do produto no DB
  nome: string;
  categoria: string;
  unidade: string;
  estoqueInicial: number;
  entradas: number;
  saidas: number;
  estoqueFinal: number;
  custoBase: number; // Fixo vindo do DB
}

const PERIODOS = ['Manhã', 'Tarde', 'Noite'];
const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

function getSaoPauloDateInputValue() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatDateInputToPtBr(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export default function NovoTurnoPage() {
  const [produtos, setProdutos] = useState<TurnoProdutoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentLocation, setCurrentLocation] = useState('COZINHA');
  const [userRole, setUserRole] = useState('OPERATOR');

  // Cabeçalho do turno
  const [responsavel, setResponsavel] = useState('');
  const [data] = useState(getSaoPauloDateInputValue);
  const [periodo, setPeriodo] = useState('Manhã');

  const loadProdutos = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/products?location=${currentLocation}`, { cache: 'no-store' });
      const json = await res.json();

      if (json.result !== 'success' || !Array.isArray(json.data)) {
        setErro('Erro ao carregar produtos do banco de dados.');
        return;
      }

      const mapeados: TurnoProdutoForm[] = json.data.map((p: Product) => ({
        id: p.id,
        nome: p.name,
        categoria: p.category,
        unidade: p.unit,
        estoqueInicial: p.currentQuantity,
        entradas: 0,
        saidas: 0,
        estoqueFinal: p.currentQuantity,
        custoBase: p.unitCost,
      }));

      setProdutos(mapeados);
    } catch {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  // ─── Carregar produtos e Usuário ───────────────────────────
  useEffect(() => {
    const init = async () => {
      const name = await getUsername();
      const role = await getRole();
      const loc = await getUserLocation();

      if (name) setResponsavel(name);
      setUserRole(role);
      if (role === 'OPERATOR') {
        setCurrentLocation(loc);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProdutos();
  }, [loadProdutos]);

  // ─── Atualizar campo de produto ──────────────────────────
  const updateProduto = useCallback((productId: string, field: keyof TurnoProdutoForm, value: number) => {
    setProdutos(prev => {
      const globalIndex = prev.findIndex(item => item.id === productId);
      if (globalIndex === -1) return prev;
      const novo = [...prev];
      const current = novo[globalIndex];
      const newValue = Math.max(0, value);

      if (field === 'entradas') {
        const delta = newValue - current.entradas;
        novo[globalIndex] = {
          ...current,
          entradas: newValue,
          estoqueFinal: Math.max(0, current.estoqueFinal + delta),
        };
        return novo;
      }

      if (field === 'saidas') {
        const available = current.estoqueInicial + current.entradas;
        const saidas = Math.min(newValue, available);
        novo[globalIndex] = {
          ...current,
          saidas,
          estoqueFinal: Math.max(0, available - saidas),
        };
        return novo;
      }

      if (field === 'estoqueFinal') {
        const available = current.estoqueInicial + current.entradas;
        novo[globalIndex] = {
          ...current,
          estoqueFinal: newValue,
          saidas: Math.max(0, available - newValue),
        };
        return novo;
      }

      novo[globalIndex] = { ...current, [field]: newValue };
      return novo;
    });
  }, []);

  // ─── Busca e Categoria ────────────────────────────────────
  const categoriesList = useMemo(() => {
    const fixed = ['CARNES', 'PÃES', 'QUEIJOS', 'INSUMOS', 'PORÇÕES', 'HORTIFRUTI', 'CONDIMENTOS', 'EMBALAGENS', 'LIMPEZA'];
    const existing = produtos
      .map(item => item.categoria?.trim().toUpperCase())
      .filter(Boolean);
    const combined = Array.from(new Set([...fixed, ...existing]));
    return ['all', ...combined];
  }, [produtos]);

  const filteredProducts = useMemo(() => {
    const normalize = (str: string | null | undefined) => {
      if (!str) return '';
      return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    return produtos
      .filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = currentCategory === 'all' ||
          normalize(p.categoria) === normalize(currentCategory);
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const catCompare = (a.categoria || '').localeCompare(b.categoria || '');
        if (catCompare !== 0) return catCompare;
        return a.nome.localeCompare(b.nome);
      });
  }, [produtos, searchTerm, currentCategory]);

  // ─── Cálculos em tempo real ──────────────────────────────
  const totais = useMemo(() => {
    const produtosCalc = produtos.map(p => {
      const consumo = p.saidas;
      const custo = consumo * p.custoBase;
      return { ...p, consumo, custo, custoAplicado: p.custoBase };
    });
    const custoTotal = produtosCalc.reduce((total, p) => total + p.custo, 0);

    return { custoTotal, produtosCalc };
  }, [produtos]);

  // ─── Salvar turno ────────────────────────────────────────
  const handleSalvar = useCallback(async () => {
    if (!responsavel.trim()) {
      setErro('Informe o nome do responsável.');
      return;
    }

    setSaving(true);
    setErro('');

    const turnoPayload = {
      data: formatDateInputToPtBr(data),
      responsavel: responsavel.trim(),
      location: currentLocation,
      periodo,
      // Financeiro será preenchido na etapa 2
      produtos: totais.produtosCalc
        .filter(p => p.estoqueInicial > 0 || p.estoqueFinal > 0 || p.entradas > 0 || p.consumo > 0)
        .map(p => ({
          produtoId: p.id,
          produtoNome: p.nome,
          estoqueInicial: p.estoqueInicial,
          entradas: p.entradas,
          estoqueFinal: p.estoqueFinal,
          custoAplicado: p.custoBase,
          consumo: p.consumo,
          custo: p.custo,
        })),
    };

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveTurno', turno: turnoPayload }),
      });
      const json = await res.json();

      if (json.result === 'success') {
        const Swal = (await import('sweetalert2')).default;
        await Swal.fire({
          icon: 'success',
          title: 'Turno salvo no Banco de Dados!',
          text: 'O estoque dos produtos foi atualizado automaticamente.',
          confirmButtonColor: '#4f46e5',
        });
        window.location.href = '/cmv/historico';
      } else {
        setErro(json.message || 'Erro ao salvar turno.');
      }
    } catch {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  }, [responsavel, data, periodo, totais, currentLocation]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Sincronizando com Banco de Dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px', overflowX: 'hidden' }}>
      <div className="mx-auto px-3 sm:px-4 lg:px-6 py-8 w-full max-w-[1280px]">

        {/* Header Superior */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
             <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Novo Turno</h1>
             <p style={{ color: '#64748b', marginTop: '4px' }}>
               Olá, <span style={{ color: '#4f46e5', fontWeight: 700 }}>{responsavel}</span>! Registre as entradas, saídas e o estoque final.
             </p>
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
                    transition: 'all 0.2s', fontSize: '14px'
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

           <Link href="/cmv/dashboard" style={{ textDecoration: 'none', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <i className="fas fa-arrow-left"></i> Voltar ao Dashboard
           </Link>
        </div>

        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fas fa-exclamation-triangle"></i>
            <span style={{ fontWeight: 500 }}>{erro}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">

          <div className="space-y-6 min-w-0">
            {/* Cards de Cabeçalho */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Responsável</label>
                  <div style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600 }}>
                    <i className="fas fa-user-circle" style={{ marginRight: '8px' }}></i> {responsavel}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Data</label>
                  <div style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600 }}>
                    <i className="fas fa-calendar" style={{ marginRight: '8px' }}></i> {formatDateInputToPtBr(data)}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Período</label>
                  <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}>
                    {PERIODOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Tabela de Insumos */}
            <div style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', maxWidth: '100%' }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 md:p-6 border-b border-slate-100 gap-4">
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Insumos</h3>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex items-center bg-slate-50 rounded-xl border border-slate-200">
                    <select
                      value={currentCategory}
                      onChange={(e) => setCurrentCategory(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 bg-transparent text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 outline-none cursor-pointer transition-all"
                      style={{ minWidth: "140px" }}
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat} className="text-gray-700 font-semibold bg-white uppercase">
                          {cat === 'all' ? '📋 Categorias' : cat}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 text-[10px] text-gray-400 pointer-events-none"></i>
                  </div>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
                    <input
                      type="text"
                      placeholder="Filtrar por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Category Pills/Tabs Quick Filter */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '0 24px 16px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  borderBottom: '1px solid #f1f5f9'
                }}
                className="scrollbar-hide"
              >
                {categoriesList.map(cat => {
                  const isActive = currentCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCurrentCategory(cat)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: isActive ? 'none' : '1px solid #e2e8f0',
                        background: isActive ? '#4f46e5' : '#fff',
                        color: isActive ? '#fff' : '#64748b',
                        fontWeight: 700,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        boxShadow: isActive ? '0 4px 6px -1px rgba(79, 70, 229, 0.2)' : 'none'
                      }}
                    >
                      {cat === 'all' ? '📋 Todos' : cat}
                    </button>
                  );
                })}
              </div>
              {/* Versão Desktop: Tabela */}
              <div className="hidden md:block" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '28%', textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Produto</th>
                      <th style={{ width: '12%', textAlign: 'center', padding: '14px 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Inicial</th>
                      <th style={{ width: '17%', textAlign: 'center', padding: '14px 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Entradas</th>
                      <th style={{ width: '17%', textAlign: 'center', padding: '14px 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Saídas</th>
                      <th style={{ width: '17%', textAlign: 'center', padding: '14px 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Final</th>
                      <th style={{ width: '9%', textAlign: 'center', padding: '14px 8px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const consumo = p.saidas;
                      const custo = consumo * p.custoBase;
                      return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.nome}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.unidade} • R$ {p.custoBase.toFixed(2)}/un</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{p.estoqueInicial.toFixed(2)}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => updateProduto(p.id, 'entradas', p.entradas - 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                              <i className="fas fa-minus" style={{ fontSize: '10px' }}></i>
                            </button>
                            <input
                              type="number"
                              value={p.entradas || ''}
                              onChange={e => updateProduto(p.id, 'entradas', parseFloat(e.target.value) || 0)}
                              style={{ width: '60px', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                            />
                            <button
                              onClick={() => updateProduto(p.id, 'entradas', p.entradas + 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => updateProduto(p.id, 'saidas', p.saidas - 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                              <i className="fas fa-minus" style={{ fontSize: '10px' }}></i>
                            </button>
                            <input
                              type="number"
                              value={p.saidas || ''}
                              onChange={e => updateProduto(p.id, 'saidas', parseFloat(e.target.value) || 0)}
                              style={{ width: '60px', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: p.saidas > 0 ? '#fff7ed' : '#fff' }}
                            />
                            <button
                              onClick={() => updateProduto(p.id, 'saidas', p.saidas + 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => updateProduto(p.id, 'estoqueFinal', p.estoqueFinal - 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                              <i className="fas fa-minus" style={{ fontSize: '10px' }}></i>
                            </button>
                            <input
                              type="number"
                              value={p.estoqueFinal || ''}
                              onChange={e => updateProduto(p.id, 'estoqueFinal', parseFloat(e.target.value) || 0)}
                              style={{ width: '60px', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: p.estoqueFinal > 0 ? '#f0f9ff' : '#fff' }}
                            />
                            <button
                              onClick={() => updateProduto(p.id, 'estoqueFinal', p.estoqueFinal + 1)}
                              style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: '10px' }}></i>
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          <div style={{ color: custo > 0 ? '#ef4444' : '#94a3b8', fontWeight: 700, fontSize: '13px' }}>R$ {custo.toFixed(2)}</div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Versão Mobile: Cards */}
              <div className="md:hidden flex flex-col gap-4 p-4">
                {filteredProducts.map((p) => {
                  const consumo = p.saidas;
                  const custo = consumo * p.custoBase;
                  return (
                    <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-slate-800 text-lg">{p.nome}</div>
                          <div className="text-xs text-slate-500">{p.unidade} • R$ {p.custoBase.toFixed(2)}/un</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Est. Inicial</div>
                          <div className="font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded text-sm inline-block mt-1">{p.estoqueInicial.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 mb-4">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-[11px] uppercase font-bold text-slate-400 mb-2 text-center">Entradas</div>
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateProduto(p.id, 'entradas', p.entradas - 1)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-200"><i className="fas fa-minus text-[10px]"></i></button>
                            <input type="number" value={p.entradas || ''} onChange={e => updateProduto(p.id, 'entradas', parseFloat(e.target.value) || 0)} className="w-12 text-center py-1.5 rounded-lg border border-slate-200 outline-none font-semibold text-slate-700" />
                            <button onClick={() => updateProduto(p.id, 'entradas', p.entradas + 1)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-200"><i className="fas fa-plus text-[10px]"></i></button>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-[11px] uppercase font-bold text-slate-400 mb-2 text-center">Saídas</div>
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateProduto(p.id, 'saidas', p.saidas - 1)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-200"><i className="fas fa-minus text-[10px]"></i></button>
                            <input type="number" value={p.saidas || ''} onChange={e => updateProduto(p.id, 'saidas', parseFloat(e.target.value) || 0)} className={`w-12 text-center py-1.5 rounded-lg border border-slate-200 outline-none font-semibold ${p.saidas > 0 ? 'bg-orange-50 text-orange-700' : 'text-slate-700'}`} />
                            <button onClick={() => updateProduto(p.id, 'saidas', p.saidas + 1)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-200"><i className="fas fa-plus text-[10px]"></i></button>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-[11px] uppercase font-bold text-slate-400 mb-2 text-center">Est. Final</div>
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateProduto(p.id, 'estoqueFinal', p.estoqueFinal - 1)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-200"><i className="fas fa-minus text-[10px]"></i></button>
                            <input type="number" value={p.estoqueFinal || ''} onChange={e => updateProduto(p.id, 'estoqueFinal', parseFloat(e.target.value) || 0)} className={`w-12 text-center py-1.5 rounded-lg border border-slate-200 outline-none font-semibold ${p.estoqueFinal > 0 ? 'bg-sky-50 text-sky-700' : 'text-slate-700'}`} />
                            <button onClick={() => updateProduto(p.id, 'estoqueFinal', p.estoqueFinal + 1)} className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 active:bg-slate-200"><i className="fas fa-plus text-[10px]"></i></button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between border-t border-slate-200 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase font-bold text-slate-400">Saídas:</span>
                          <span className={`font-bold ${consumo > 0 ? 'text-orange-500' : 'text-slate-400'}`}>{consumo.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase font-bold text-slate-400">Custo:</span>
                          <span className={`font-bold ${custo > 0 ? 'text-red-500' : 'text-slate-400'}`}>R$ {custo.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 min-w-0">
            {/* Card de Resumo Operacional */}
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 700 }}>Resumo Operacional</h3>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Custo Total (Insumos)</span>
                  <span style={{ fontWeight: 800, fontSize: '18px', color: '#ef4444' }}>R$ {totais.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#c7d2fe', lineHeight: '1.5' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                    O fechamento financeiro (vendas, taxas, CMV real) será feito posteriormente.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSalvar}
                disabled={saving || produtos.length === 0}
                style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '16px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)' }}
              >
                {saving ? (
                  <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                ) : (
                  <><i className="fas fa-check-circle"></i> Finalizar Turno Operacional</>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
