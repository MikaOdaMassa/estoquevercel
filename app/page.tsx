'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import StockGrid from './components/StockGrid';
import LoadingScreen from './components/LoadingScreen';
import { getRole, getUserLocation } from './actions/auth';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  minStock: number;
  unitCost: number;
  salePrice: number;
}

export default function InventoryPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentSort, setCurrentSort] = useState('name');
  const [currentLocation, setCurrentLocation] = useState('COZINHA');
  const [userRole, setUserRole] = useState('OPERATOR');
  
  // Modal de Produto (Unificação)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<StockItem> | null>(null);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?location=${currentLocation}`);
      const json = await res.json();
      if (json.result === 'success') {
        setStockItems(json.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          location: p.location,
          quantity: p.currentQuantity,
          unit: p.unit,
          minStock: p.minStock,
          unitCost: p.unitCost || 0,
          salePrice: p.salePrice || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

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
    fetchStock();
  }, [fetchStock]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: editingProduct.id,
            name: editingProduct.name,
            category: editingProduct.category,
            location: editingProduct.location || currentLocation,
            unit: editingProduct.unit,
            currentQuantity: editingProduct.quantity,
            unitCost: editingProduct.unitCost,
            salePrice: editingProduct.salePrice,
            minStock: editingProduct.minStock
        }),
      });
      const json = await res.json();
      if (json.result === 'success') {
        setShowProductModal(false);
        fetchStock();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const categoriesList = useMemo(() => {
    const fixed = ['CARNES', 'PÃES', 'QUEIJOS', 'INSUMOS', 'PORÇÕES', 'HORTIFRUTI', 'CONDIMENTOS', 'EMBALAGENS', 'LIMPEZA'];
    const existing = stockItems
      .map(item => item.category?.trim().toUpperCase())
      .filter(Boolean);
    const combined = Array.from(new Set([...fixed, ...existing]));
    return ['all', ...combined];
  }, [stockItems]);

  const filteredItems = useMemo(() => {
    const normalize = (str: string) => {
      return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    return stockItems
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = currentCategory === 'all' || 
          normalize(item.category) === normalize(currentCategory);
        
        let matchesStatus = true;
        if (statusFilter === 'available') matchesStatus = item.quantity > item.minStock;
        else if (statusFilter === 'low') matchesStatus = item.quantity > 0 && item.quantity <= item.minStock;
        else if (statusFilter === 'out') matchesStatus = item.quantity === 0;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (currentSort === 'name') return a.name.localeCompare(b.name);
        if (currentSort === 'quantity') return b.quantity - a.quantity;
        return 0;
      });
  }, [stockItems, searchTerm, currentCategory, statusFilter, currentSort]);

  const stats = useMemo(() => {
    const total = stockItems.length;
    const available = stockItems.filter(i => i.quantity > i.minStock).length;
    const low = stockItems.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length;
    const out = stockItems.filter(i => i.quantity === 0).length;
    return { total, available, low, out };
  }, [stockItems]);

  if (loading && stockItems.length === 0) return <LoadingScreen loading={true} />;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 md:py-10 md:px-5 pb-24">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Tab Switcher */}
        {userRole === 'ADMIN' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
            <button 
              onClick={() => setCurrentLocation('COZINHA')}
              style={{ 
                padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                background: currentLocation === 'COZINHA' ? '#fff' : 'transparent',
                color: currentLocation === 'COZINHA' ? '#4f46e5' : '#64748b',
                boxShadow: currentLocation === 'COZINHA' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-utensils" style={{ marginRight: '8px' }}></i> Cozinha
            </button>
            <button 
              onClick={() => setCurrentLocation('BAR')}
              style={{ 
                padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer',
                background: currentLocation === 'BAR' ? '#fff' : 'transparent',
                color: currentLocation === 'BAR' ? '#4f46e5' : '#64748b',
                boxShadow: currentLocation === 'BAR' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-glass-martini-alt" style={{ marginRight: '8px' }}></i> Bar
            </button>
          </div>
        )}

        <Header 
          totalItems={stats.total}
          availableItems={stats.available}
          lowStockItems={stats.low}
          outOfStockItems={stats.out}
          modifiedItems={0}
        />
        
        <Controls 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          currentSort={currentSort}
          setCurrentSort={setCurrentSort}
          setShowAddModal={() => { setEditingProduct({ location: currentLocation }); setShowProductModal(true); }}
          fetchLatestData={fetchStock}
          fetchLoading={loading}
          categories={categoriesList}
        />

        <div style={{ marginTop: '20px' }}>
            <StockGrid 
                items={filteredItems} 
                onEdit={(item) => { 
                    setEditingProduct(item); 
                    setShowProductModal(true); 
                }} 
            />
        </div>

        {/* Modal Unificado de Gestão de Produto */}
        {showProductModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white rounded-3xl p-6 md:p-10 w-full max-w-lg shadow-2xl border border-white/10 m-4 overflow-y-auto max-h-[90vh]">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>{editingProduct?.id ? 'Editar Item' : 'Cadastrar Novo Item'}</h2>
                <button onClick={() => setShowProductModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#64748b' }}><i className="fas fa-times"></i></button>
              </div>
              
              <form onSubmit={handleSaveProduct} style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Nome do Insumo</label>
                  <input type="text" required value={editingProduct?.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '16px' }} placeholder="Ex: Queijo Mussarela" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Categoria</label>
                    <input type="text" required value={editingProduct?.category || ''} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none' }} placeholder="Ex: Frios" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Localização</label>
                    <select required value={editingProduct?.location || currentLocation} onChange={e => setEditingProduct({...editingProduct, location: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', background: '#fff' }}>
                      <option value="COZINHA">Cozinha</option>
                      <option value="BAR">Bar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Unidade</label>
                    <select required value={editingProduct?.unit || ''} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', background: '#fff' }}>
                      <option value="" disabled>Selecione...</option>
                      <option value="un">un (Unidade)</option>
                      <option value="kg">kg (Quilograma)</option>
                      <option value="g">g (Grama)</option>
                      <option value="l">l (Litro)</option>
                      <option value="ml">ml (Mililitro)</option>
                      <option value="cx">cx (Caixa)</option>
                      <option value="fd">fd (Fardo)</option>
                      <option value="lt">lt (Lata)</option>
                      <option value="gf">gf (Garrafa)</option>
                      <option value="pct">pct (Pacote)</option>
                      <option value="dz">dz (Dúzia)</option>
                      <option value="bd">bd (Bandeja)</option>
                      <option value="gl">gl (Galão)</option>
                      <option value="sc">sc (Saco)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Estoque Mínimo</label>
                    <input type="number" step="0.01" value={editingProduct?.minStock || 0} onChange={e => setEditingProduct({...editingProduct, minStock: parseFloat(e.target.value)})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none' }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Custo Unitário (R$)</label>
                    <input type="number" step="0.01" value={editingProduct?.unitCost || 0} onChange={e => setEditingProduct({...editingProduct, unitCost: parseFloat(e.target.value)})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Preço Venda (R$)</label>
                    <input type="number" step="0.01" value={editingProduct?.salePrice || 0} onChange={e => setEditingProduct({...editingProduct, salePrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none' }} />
                  </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Qtd. em Estoque</label>
                    <input type="number" step="0.01" value={editingProduct?.quantity || 0} onChange={e => setEditingProduct({...editingProduct, quantity: parseFloat(e.target.value)})} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none' }} />
                </div>

                <div className="flex flex-col md:flex-row gap-4 mt-6">
                  <button type="button" onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid #f1f5f9', background: 'none', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ flex: 2, padding: '16px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }}>Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
