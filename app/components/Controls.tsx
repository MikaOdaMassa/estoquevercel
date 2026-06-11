"use client";

import { useState, useCallback, memo } from "react";

interface ControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  currentSort: string;
  setCurrentSort: (sort: string) => void;
  setShowAddModal: (show: boolean) => void;
  fetchLatestData: () => Promise<void>;
  fetchLoading: boolean;
  categories?: string[];
}

const Controls = memo(function Controls({
  searchTerm,
  setSearchTerm,
  currentCategory,
  setCurrentCategory,
  statusFilter,
  setStatusFilter,
  currentSort,
  setCurrentSort,
  setShowAddModal,
  fetchLatestData,
  fetchLoading,
  categories,
}: ControlsProps) {
  const [filtersMinimized, setFiltersMinimized] = useState(false);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleCategoryChange = useCallback((category: string) => {
    setCurrentCategory(category);
  }, [setCurrentCategory]);

  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status);
  }, [setStatusFilter]);

  const handleSortChange = useCallback((sort: string) => {
    setCurrentSort(sort);
  }, [setCurrentSort]);

  const normalize = (str: string | null | undefined) => {
    if (!str) return '';
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const categoryList = categories || ['all', 'CARNES', 'PÃES', 'QUEIJOS', 'INSUMOS', 'PORÇÕES', 'HORTIFRUTI', 'CONDIMENTOS', 'EMBALAGENS'];

  return (
    <div className="bg-white rounded-[32px] p-8 mb-8 shadow-xl border border-gray-100">

      {/* Busca e Botão Adicionar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Buscar por nome do insumo..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none text-gray-800 font-medium"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <i className="fas fa-plus"></i> Novo Item
        </button>
      </div>

      {/* Filtros Rápidos */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button
            onClick={() => handleStatusChange('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${statusFilter === '' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Todos
          </button>
          <button
            onClick={() => handleStatusChange('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${statusFilter === 'available' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Disponível
          </button>
          <button
            onClick={() => handleStatusChange('low')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${statusFilter === 'low' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Baixo
          </button>
          <button
            onClick={() => handleStatusChange('out')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${statusFilter === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Sem Estoque
          </button>
        </div>

        <div className="relative flex items-center bg-gray-50 rounded-2xl border border-gray-100">
          <select
            value={currentCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 bg-transparent rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 outline-none cursor-pointer transition-all"
            style={{ minWidth: "160px" }}
          >
            {categoryList.map(cat => (
              <option key={cat} value={cat} className="text-gray-700 font-semibold bg-white uppercase">
                {cat === 'all' ? '📋 Categorias' : cat}
              </option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-4 text-[10px] text-gray-400 pointer-events-none"></i>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={fetchLatestData} disabled={fetchLoading} className="text-indigo-600 hover:text-indigo-800 transition-colors p-2 cursor-pointer">
            <i className={`fas fa-sync-alt ${fetchLoading ? 'fa-spin' : ''}`}></i>
          </button>
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-gray-500 uppercase tracking-widest outline-none cursor-pointer"
          >
            <option value="name">Ordenar por Nome</option>
            <option value="quantity">Ordenar por Qtd.</option>
          </select>
        </div>
      </div>
    </div>
  );
});

export default Controls;
