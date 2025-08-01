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
  exportData: () => Promise<void>;
  openSyncModal: () => void;
  setShowConfigModal: (show: boolean) => void;
  fetchLatestData: () => Promise<void>;
  fetchLoading: boolean;
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
  exportData,
  openSyncModal,
  setShowConfigModal,
  fetchLatestData,
  fetchLoading,
}: ControlsProps) {
  const [filtersMinimized, setFiltersMinimized] = useState(false);

  // Otimizando handlers com useCallback
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

  const toggleFilters = useCallback(() => {
    setFiltersMinimized(prev => !prev);
  }, []);

  const handleAddItem = useCallback(() => {
    setShowAddModal(true);
  }, [setShowAddModal]);

  const handleExport = useCallback(async () => {
    await exportData();
  }, [exportData]);

  const handleSync = useCallback(() => {
    openSyncModal();
  }, [openSyncModal]);

  const handleConfig = useCallback(() => {
    setShowConfigModal(true);
  }, [setShowConfigModal]);

  const handleFetchLatestData = useCallback(async () => {
    await fetchLatestData();
  }, [fetchLatestData]);

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 lg:p-10 mb-8 shadow-2xl border border-gray-200/50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-slate-600/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      </div>
      
      <div className="relative z-10">
        {/* Busca em destaque */}
        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-center">
              <div className="relative mr-3">
                <i className="fas fa-search text-2xl text-slate-600"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Buscar Itens</h3>
            </div>
            <button
              onClick={toggleFilters}
              className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center text-sm sm:text-base border border-slate-200/50 backdrop-blur-sm cursor-pointer"
            >
              <i className={`fas ${filtersMinimized ? 'fa-chevron-down' : 'fa-chevron-up'} mr-2`}></i>
              <span className="hidden sm:inline">{filtersMinimized ? 'Mostrar Filtros' : 'Ocultar Filtros'}</span>
              <span className="sm:hidden">{filtersMinimized ? 'Mostrar' : 'Ocultar'}</span>
            </button>
          </div>
          <div className="relative">
           
            <input
              type="text"
              placeholder="Digite o nome do item..."
              className="w-full pl-12 pr-6 py-4 sm:py-5 border-2 border-slate-300/50 rounded-2xl text-base sm:text-lg transition-all duration-200 focus:outline-none focus:border-slate-500 focus:shadow-lg focus:ring-2 focus:ring-slate-200/50 bg-white/80 backdrop-blur-sm text-gray-800 placeholder-slate-400"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Filtros organizados */}
        <div className={`filters-container grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8 ${filtersMinimized ? 'minimized' : 'expanded'}`}>
          {/* Filtro de Status */}
          <div className="filter-card glass hover-lift p-4 sm:p-6 rounded-2xl border-2 border-green-200">
            <div className="flex items-center mb-3 sm:mb-4">
              <i className="fas fa-chart-line text-green-600 mr-2 sm:mr-3 text-lg sm:text-xl"></i>
              <h4 className="font-bold text-green-800 text-base sm:text-lg">Status do Estoque</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button 
                onClick={() => handleStatusChange('')} 
                className={`filter-status-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${statusFilter === '' ? 'active bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-green-100 hover:to-green-200 hover:text-green-700'}`}
              >
                <i className="fas fa-boxes mr-1 sm:mr-2"></i>Todos
              </button>
              <button 
                onClick={() => handleStatusChange('available')} 
                className={`filter-status-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${statusFilter === 'available' ? 'active bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-green-100 hover:to-green-200 hover:text-green-700'}`}
              >
                <i className="fas fa-check-circle mr-1 sm:mr-2"></i>Disponível
              </button>
              <button 
                onClick={() => handleStatusChange('low')} 
                className={`filter-status-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${statusFilter === 'low' ? 'active bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-orange-100 hover:to-orange-200 hover:text-orange-700'}`}
              >
                <i className="fas fa-exclamation-triangle mr-1 sm:mr-2"></i>Baixo
              </button>
              <button 
                onClick={() => handleStatusChange('out')} 
                className={`filter-status-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${statusFilter === 'out' ? 'active bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-red-100 hover:to-red-200 hover:text-red-700'}`}
              >
                <i className="fas fa-times-circle mr-1 sm:mr-2"></i>Sem Estoque
              </button>
            </div>
          </div>
          
          {/* Filtro de Categorias */}
          <div className="filter-card glass hover-lift p-4 sm:p-6 rounded-2xl border-2 border-slate-200">
            <div className="flex items-center mb-3 sm:mb-4">
              <i className="fas fa-tags text-slate-600 mr-2 sm:mr-3 text-lg sm:text-xl"></i>
              <h4 className="font-bold text-slate-800 text-base sm:text-lg">Categorias</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {['all','CARNES','PÃES','QUEIJOS','INSUMOS','PORÇÕES','HORTIFRUTI','CONDIMENTOS','SOBREMESAS','OUTROS'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => handleCategoryChange(cat)} 
                  className={`filter-category-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${currentCategory === cat ? 'active bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-slate-100 hover:to-slate-200 hover:text-slate-700'}`}
                >
                  <i className="fas fa-tag mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{cat === 'all' ? 'Todos' : cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                  <span className="sm:hidden">{cat === 'all' ? 'Todos' : cat}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtro de Ordenação */}
          <div className="filter-card glass hover-lift p-4 sm:p-6 rounded-2xl border-2 border-blue-200 lg:col-span-1">
            <div className="flex items-center mb-3 sm:mb-4">
              <i className="fas fa-sort text-blue-600 mr-2 sm:mr-3 text-lg sm:text-xl"></i>
              <h4 className="font-bold text-blue-800 text-base sm:text-lg">Ordenar Por</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button 
                onClick={() => handleSortChange('name')} 
                className={`sort-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${currentSort === 'name' ? 'active bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-blue-200 hover:text-blue-700'}`}
              >
                <i className="fas fa-sort-alpha-down mr-1 sm:mr-2"></i>Nome
              </button>
              <button 
                onClick={() => handleSortChange('status')} 
                className={`sort-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${currentSort === 'status' ? 'active bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-blue-200 hover:text-blue-700'}`}
              >
                <i className="fas fa-exclamation-circle mr-1 sm:mr-2"></i>Status
              </button>
              <button 
                onClick={() => handleSortChange('quantity')} 
                className={`sort-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${currentSort === 'quantity' ? 'active bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-blue-200 hover:text-blue-700'}`}
              >
                <i className="fas fa-sort-numeric-down mr-1 sm:mr-2"></i>Quantidade
              </button>
              <button 
                onClick={() => handleSortChange('category')} 
                className={`sort-btn px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${currentSort === 'category' ? 'active bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-blue-200 hover:text-blue-700'}`}
              >
                <i className="fas fa-tags mr-1 sm:mr-2"></i>Categoria
              </button>
            </div>
          </div>
        </div>

        {/* Botões de ação organizados */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
          <button 
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/179m5wy4QX6r8f5gfb1S36RJeYPsCHdMAI_Nb59dSRyE/edit?gid=751694597#gid=751694597', '_blank')}
            className="action-btn bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center tooltip border border-teal-200 hover:from-teal-600 hover:to-teal-700 text-sm sm:text-base cursor-pointer" 
            data-tooltip="Abrir planilha do Google Sheets"
          >
            <i className="fas fa-external-link-alt mr-2"></i>
            <span className="hidden sm:inline">Abrir Planilha</span>
            <span className="sm:hidden">Planilha</span>
          </button>
          <button 
            onClick={handleFetchLatestData} 
            disabled={fetchLoading}
            className="action-btn bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center tooltip border border-orange-200 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base cursor-pointer" 
            data-tooltip="Buscar dados mais recentes do Google Sheets"
          >
            {fetchLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span className="hidden sm:inline">Buscando...</span>
                <span className="sm:hidden">Buscando</span>
              </>
            ) : (
              <>
                <i className="fas fa-cloud-download-alt mr-2"></i>
                <span className="hidden sm:inline">Buscar Dados</span>
                <span className="sm:hidden">Buscar</span>
              </>
            )}
          </button>
          <button 
            onClick={handleSync} 
            className="action-btn bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center tooltip border border-purple-200 hover:from-purple-600 hover:to-purple-700 text-sm sm:text-base cursor-pointer" 
            data-tooltip="Sincronizar dados com Google Sheets"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            <span className="hidden sm:inline">Sincronizar Histórico</span>
            <span className="sm:hidden">Sincronizar</span>
          </button>
          <button 
            onClick={handleAddItem} 
            className="action-btn bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center tooltip border border-green-200 hover:from-green-600 hover:to-green-700 text-sm sm:text-base cursor-pointer" 
            data-tooltip="Adicionar novo item ao estoque"
          >
            <i className="fas fa-plus mr-2"></i>
            <span className="hidden sm:inline">Adicionar Item</span>
            <span className="sm:hidden">Adicionar</span>
          </button>
          <button 
            onClick={handleExport} 
            className="action-btn bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center tooltip border border-blue-200 hover:from-blue-600 hover:to-blue-700 text-sm sm:text-base cursor-pointer" 
            data-tooltip="Exportar dados para arquivo CSV"
          >
            <i className="fas fa-download mr-2"></i>
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">Exportar</span>
          </button>
          <button 
            onClick={handleConfig} 
            className="action-btn bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center tooltip border border-gray-200 hover:from-gray-600 hover:to-gray-700 text-sm sm:text-base cursor-pointer" 
            data-tooltip="Configurar integração com Google Sheets"
          >
            <i className="fas fa-cog mr-2"></i>
            <span className="hidden sm:inline">Configurações</span>
            <span className="sm:hidden">Config</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default Controls; 