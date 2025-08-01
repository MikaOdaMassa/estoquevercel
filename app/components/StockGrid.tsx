"use client";

import StockItemCard from './StockItemCard';

interface StockItem {
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
}

interface StockGridProps {
  filteredItems: string[];
  stockData: {[key: string]: StockItem};
  originalData?: {[key: string]: StockItem};
  updateQuantity: (itemName: string, change: number) => void;
  setDeleteItemName: (itemName: string | null) => void;
}

// Função para verificar se um item foi modificado
function isItemModified(itemName: string, currentData: {[key: string]: StockItem}, originalData?: {[key: string]: StockItem}) {
  if (!originalData || !originalData[itemName]) return true;
  
  const current = currentData[itemName];
  const original = originalData[itemName];
  
  return (
    current.quantity !== original.quantity ||
    current.category !== original.category ||
    current.unit !== original.unit ||
    current.minStock !== original.minStock
  );
}

export default function StockGrid({ filteredItems, stockData, originalData, updateQuantity, setDeleteItemName }: StockGridProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-boxes mr-2 sm:mr-3 text-purple-600"></i>
          Itens do Estoque
        </h3>
        <div className="text-gray-700 text-xs sm:text-sm bg-gradient-to-r from-purple-100 to-pink-100 px-3 sm:px-4 py-2 rounded-full border border-purple-200 text-center sm:text-left">
          <span id="itemCount">{filteredItems.length}</span> itens encontrados
        </div>
      </div>
      <div id="stockGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {filteredItems.map(itemName => (
          <StockItemCard
            key={itemName}
            itemName={itemName}
            item={stockData[itemName]}
            onUpdateQuantity={updateQuantity}
            onDelete={setDeleteItemName}
            isModified={isItemModified(itemName, stockData, originalData)}
          />
        ))}
      </div>
    </div>
  );
} 