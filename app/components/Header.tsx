"use client";

interface HeaderProps {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  modifiedItems?: number;
}

export default function Header({ totalItems, availableItems, lowStockItems, outOfStockItems, modifiedItems = 0 }: HeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-3xl p-8 sm:p-10 mb-10 shadow-2xl text-center animate-fade-in border border-slate-200/50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-current to-transparent rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-current to-transparent rounded-full translate-y-12 -translate-x-12"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center mb-6 sm:mb-8">
          <div className="relative mb-4 sm:mb-0 sm:mr-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
              <i className="fas fa-warehouse text-2xl sm:text-3xl text-white drop-shadow-md"></i>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-2xl animate-pulse opacity-50"></div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg leading-tight">
            Controle de Estoque
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-medium opacity-90">Cozinha</span>
          </h1>
        </div>
        
        {/* Indicador de itens modificados */}
        {modifiedItems > 0 && (
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg border border-blue-200/50 animate-pulse backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center text-white gap-3">
              <div className="relative">
                <i className="fas fa-sync-alt text-xl sm:text-2xl"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-center">
                {modifiedItems} item(s) modificado(s)
                <span className="block text-sm sm:text-base font-medium opacity-90">Sincronize para salvar as mudanças</span>
              </span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
          <div className="bg-gradient-to-r from-slate-500 to-slate-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg tooltip border border-slate-200/50 hover:scale-105 transition-all duration-300 backdrop-blur-sm" data-tooltip="Total de itens no sistema">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-2">
                <i className="fas fa-boxes text-2xl sm:text-3xl"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{totalItems}</div>
              <div className="text-xs sm:text-sm font-medium opacity-90">Total de Itens</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg tooltip border border-green-200/50 hover:scale-105 transition-all duration-300 backdrop-blur-sm" data-tooltip="Itens com estoque adequado">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-2">
                <i className="fas fa-check-circle text-2xl sm:text-3xl"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{availableItems}</div>
              <div className="text-xs sm:text-sm font-medium opacity-90">Disponíveis</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg tooltip border border-orange-200/50 hover:scale-105 transition-all duration-300 backdrop-blur-sm" data-tooltip="Itens com estoque baixo">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-2">
                <i className="fas fa-exclamation-triangle text-2xl sm:text-3xl"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{lowStockItems}</div>
              <div className="text-xs sm:text-sm font-medium opacity-90">Estoque Baixo</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-2xl shadow-lg tooltip border border-red-200/50 hover:scale-105 transition-all duration-300 backdrop-blur-sm" data-tooltip="Itens sem estoque">
            <div className="flex flex-col items-center justify-center">
              <div className="relative mb-2">
                <i className="fas fa-times-circle text-2xl sm:text-3xl"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{outOfStockItems}</div>
              <div className="text-xs sm:text-sm font-medium opacity-90">Sem Estoque</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 