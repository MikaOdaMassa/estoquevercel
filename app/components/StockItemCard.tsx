"use client";

import { useState, useEffect } from 'react';

interface StockItem {
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
}

interface StockItemCardProps {
  itemName: string;
  item: StockItem;
  onUpdateQuantity: (itemName: string, change: number) => void;
  onDelete: (itemName: string) => void;
  isModified?: boolean;
}

function getItemStatus(item: StockItem) {
  if (item.quantity === 0) return 'out';
  if (item.quantity <= item.minStock) return 'low';
  return 'available';
}

export default function StockItemCard({ itemName, item, onUpdateQuantity, onDelete, isModified = false }: StockItemCardProps) {
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const status = getItemStatus(item);
  
  // Atualizar o input quando o item mudar
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);
  
  const statusConfig = {
    available: {
      border: 'border-slate-300',
      bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
      text: 'text-slate-700',
      icon: 'fas fa-check-circle text-slate-600',
      statusText: 'Disponível',
      accent: 'from-slate-400 to-slate-500',
      shadow: 'shadow-slate-200/50'
    },
    low: {
      border: 'border-orange-300',
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      text: 'text-orange-700',
      icon: 'fas fa-exclamation-triangle text-orange-600',
      statusText: 'Estoque Baixo',
      accent: 'from-orange-400 to-orange-500',
      shadow: 'shadow-orange-200/50'
    },
    out: {
      border: 'border-red-300',
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      text: 'text-red-700',
      icon: 'fas fa-times-circle text-red-600',
      statusText: 'Sem Estoque',
      accent: 'from-red-400 to-red-500',
      shadow: 'shadow-red-200/50'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl 
        border ${config.border} ${config.bg}
        shadow-lg hover:shadow-xl ${config.shadow}
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:scale-[1.02]
        backdrop-blur-sm
        ${isModified ? 'ring-2 ring-blue-400/50 ring-offset-1' : ''}
        group
      `}
      data-category={item.category}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-current to-transparent rounded-full -translate-y-12 translate-x-12"></div>
      </div>

      {/* Header Section */}
      <div className="relative p-4 pb-3">
        <div className="flex justify-between items-start gap-3">
          {/* Title and Category */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 leading-tight mb-3 group-hover:text-gray-900 transition-colors duration-200">
              {itemName}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Badge */}
              <div className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-md border border-slate-200/50 hover:shadow-lg transition-all duration-200 hover:scale-105">
                <i className="fas fa-tag text-xs"></i>
                <span className="hidden sm:inline">{item.category}</span>
                <span className="sm:hidden">{item.category.substring(0, 3)}</span>
              </div>
              
              {/* Modified Indicator */}
              {isModified && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-md border border-blue-200/50 animate-pulse">
                  <i className="fas fa-edit text-xs"></i>
                  <span className="hidden sm:inline">Modificado</span>
                  <span className="sm:hidden">Mod</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Status Icon and Delete Button */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <i className={`${config.icon} text-2xl transition-transform duration-200 group-hover:scale-110`}></i>
              <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
            </div>
            
            <button 
              onClick={() => onDelete(itemName)} 
              className="
                w-10 h-10 rounded-full 
                bg-gradient-to-r from-red-500 to-red-600 text-white 
                font-bold text-sm transition-all duration-200 
                hover:scale-110 hover:shadow-lg hover:shadow-red-200/50
                shadow-md border border-red-200/50
                flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                active:scale-95 cursor-pointer
              " 
              title="Deletar item"
            >
              <i className="fas fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Quantity Controls Section */}
      <div className="relative px-4 pb-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between gap-4">
            {/* Decrease Button */}
            <button 
              onClick={() => onUpdateQuantity(itemName, -1)} 
              className="
                w-12 h-12 rounded-full 
                bg-gradient-to-r from-red-500 to-red-600 text-white 
                font-bold text-lg transition-all duration-200 
                hover:scale-110 hover:shadow-lg hover:shadow-red-200/50
                shadow-md border border-red-200/50
                flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                active:scale-95 cursor-pointer
              " 
              title="Diminuir quantidade"
            >
              <i className="fas fa-minus"></i>
            </button>
            
            {/* Quantity Input */}
            <div className="flex-1 text-center">
              <div className="relative">
                <input 
                  type="number" 
                  value={inputValue} 
                  min={0} 
                  step={1} 
                  onChange={e => {
                    setInputValue(e.target.value);
                    const newValue = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                    onUpdateQuantity(itemName, newValue - item.quantity);
                  }} 
                  onBlur={() => {
                    const newValue = parseInt(inputValue) || 0;
                    setInputValue(newValue.toString());
                  }}
                  className="
                    w-full text-center text-xl font-bold 
                    text-gray-800 bg-transparent border-none outline-none 
                    focus:ring-0 placeholder-gray-400
                    transition-all duration-200
                  " 
                  placeholder="0"
                />
                <div className="absolute inset-x-0 -bottom-5 text-sm font-medium text-gray-500">
                  {item.unit}
                </div>
              </div>
            </div>
            
            {/* Increase Button */}
            <button 
              onClick={() => onUpdateQuantity(itemName, 1)} 
              className="
                w-12 h-12 rounded-full 
                bg-gradient-to-r from-green-500 to-green-600 text-white 
                font-bold text-lg transition-all duration-200 
                hover:scale-110 hover:shadow-lg hover:shadow-green-200/50
                shadow-md border border-green-200/50
                flex items-center justify-center
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                active:scale-95 cursor-pointer
              " 
              title="Aumentar quantidade"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Information Section */}
      <div className="relative px-4 pb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Status Information */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <i className={`${config.icon} text-lg transition-transform duration-200 group-hover:scale-110`}></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <span className={`font-semibold text-sm ${config.text} transition-colors duration-200`}>
                <span className="hidden sm:inline">{config.statusText}</span>
                <span className="sm:hidden">
                  {config.statusText === 'Disponível' ? 'OK' : 
                   config.statusText === 'Estoque Baixo' ? 'Baixo' : 'Sem'}
                </span>
              </span>
            </div>
            
            {/* Minimum Stock Information */}
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <div className="relative">
                <i className="fas fa-exclamation-circle text-orange-500 text-base transition-transform duration-200 group-hover:scale-110"></i>
                <div className="absolute inset-0 bg-gradient-to-r from-current to-transparent opacity-20 rounded-full blur-sm"></div>
              </div>
              <span className="font-medium">
                <span className="hidden sm:inline">Mín: {item.minStock} {item.unit}</span>
                <span className="sm:hidden">Mín: {item.minStock}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.accent} opacity-60`}></div>
    </div>
  );
} 