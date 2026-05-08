"use client";

import { StockItem } from '../page';

interface StockItemCardProps {
  item: StockItem;
}

function getItemStatus(item: StockItem) {
  if (item.quantity === 0) return 'out';
  if (item.quantity <= item.minStock) return 'low';
  return 'available';
}

export default function StockItemCard({ item }: StockItemCardProps) {
  const status = getItemStatus(item);
  
  const statusConfig = {
    available: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      badge: 'bg-emerald-100 text-emerald-700',
      icon: 'fa-check-circle',
      statusText: 'Disponível'
    },
    low: {
      border: 'border-orange-200',
      bg: 'bg-white',
      badge: 'bg-orange-100 text-orange-700',
      icon: 'fa-exclamation-triangle',
      statusText: 'Estoque Baixo'
    },
    out: {
      border: 'border-red-200',
      bg: 'bg-white',
      badge: 'bg-red-100 text-red-700',
      icon: 'fa-times-circle',
      statusText: 'Sem Estoque'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div 
      className={`
        relative overflow-hidden rounded-3xl 
        border-2 ${config.border} ${config.bg}
        p-6 shadow-sm hover:shadow-xl
        transition-all duration-300
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          {item.category}
        </span>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${config.badge}`}>
          <i className={`fas ${config.icon} mr-1`}></i> {config.statusText}
        </span>
      </div>

      <h3 className="text-lg font-extrabold text-gray-800 mb-4 line-clamp-2 min-h-[3.5rem]">
        {item.name}
      </h3>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-black text-gray-900">
            {item.quantity}
            <span className="text-sm font-bold text-gray-400 ml-1 uppercase">{item.unit}</span>
          </div>
          <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase">
            Mínimo: {item.minStock} {item.unit}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Custo Unit.</div>
          <div className="text-sm font-bold text-indigo-600">R$ {item.unitCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Hover Indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="fas fa-edit text-gray-300"></i>
      </div>
    </div>
  );
}
