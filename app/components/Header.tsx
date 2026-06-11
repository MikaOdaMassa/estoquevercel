interface HeaderProps {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  modifiedItems: number;
}

export default function Header({ totalItems, availableItems, lowStockItems, outOfStockItems, modifiedItems }: HeaderProps) {
  return (
    <header className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-10 mb-10 shadow-2xl text-center border border-purple-200">
      <div className="flex items-center justify-center mb-6">
        <i className="fas fa-warehouse text-5xl text-white mr-4 drop-shadow-md"></i>
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">Estoque Porks</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-boxes text-3xl mr-3"></i>
            <div className="text-4xl font-bold">{totalItems}</div>
          </div>
          <div className="text-sm font-medium">Total de Itens</div>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg border border-emerald-200">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-check-circle text-3xl mr-3"></i>
            <div className="text-4xl font-bold">{availableItems}</div>
          </div>
          <div className="text-sm font-medium">Disponíveis</div>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg border border-amber-200">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-exclamation-triangle text-3xl mr-3"></i>
            <div className="text-4xl font-bold">{lowStockItems}</div>
          </div>
          <div className="text-sm font-medium">Estoque Baixo</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg border border-red-200">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-times-circle text-3xl mr-3"></i>
            <div className="text-4xl font-bold">{outOfStockItems}</div>
          </div>
          <div className="text-sm font-medium">Sem Estoque</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-6 rounded-2xl shadow-lg border border-purple-200">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-edit text-3xl mr-3"></i>
            <div className="text-4xl font-bold">{modifiedItems}</div>
          </div>
          <div className="text-sm font-medium">Modificados</div>
        </div>
      </div>
    </header>
  );
}
