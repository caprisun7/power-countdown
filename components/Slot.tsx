import React from 'react';
import { CardData, DragItemType } from '../types';
import Card from './Card';
import { ArrowDown } from 'lucide-react';

interface SlotProps {
  label: string;
  card: CardData | null;
  slotId: 'slotA' | 'slotB';
  onDrop: (e: React.DragEvent, slotId: 'slotA' | 'slotB') => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, card: CardData, source: 'hand' | 'slotA' | 'slotB') => void;
  highlight?: boolean;
}

const Slot: React.FC<SlotProps> = ({ label, card, slotId, onDrop, onRemove, onDragStart, highlight }) => {
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, slotId);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          w-36 h-24 rounded-xl border-2 border-dashed transition-all duration-300
          flex items-center justify-center relative
          ${card 
            ? 'border-transparent bg-slate-900/50' 
            : highlight 
              ? 'border-indigo-400 bg-indigo-500/10' 
              : 'border-slate-700 bg-slate-800/30'
          }
        `}
      >
        {card ? (
          <Card 
            card={card} 
            source={slotId} 
            onDragStart={onDragStart} 
            onRemove={onRemove}
          />
        ) : (
          <div className="text-slate-600 pointer-events-none">
            <ArrowDown className="opacity-20" size={32} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Slot;
