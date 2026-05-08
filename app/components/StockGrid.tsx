import { StockItem } from '../page';
import StockItemCard from './StockItemCard';

interface StockGridProps {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
}

export default function StockGrid({ items, onEdit }: StockGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
        <i className="fas fa-box-open text-6xl text-gray-200 mb-4"></i>
        <p className="text-xl text-gray-400 font-medium">Nenhum item no estoque</p>
        <p className="text-sm text-gray-400">Clique em "Adicionar Item" para começar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(item => (
        <div 
            key={item.id} 
            onClick={() => onEdit(item)} 
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <StockItemCard
            item={item}
          />
        </div>
      ))}
    </div>
  );
}
