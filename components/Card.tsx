import React from 'react';
import { CardData, DragItemType } from '../types';
import { GripVertical, X } from 'lucide-react';

interface CardProps {
  card: CardData;
  source: 'hand' | 'slotA' | 'slotB';
  onDragStart: (e: React.DragEvent, card: CardData, source: 'hand' | 'slotA' | 'slotB') => void;
  onRemove?: () => void; // Used if card is in a slot
  isDraggable?: boolean;
}

const Card: React.FC<CardProps> = ({ card, source, onDragStart, onRemove, isDraggable = true }) => {
  
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) {
        e.preventDefault();
        return;
    }
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: DragItemType.CARD,
      id: card.id,
      source
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, card, source);
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      className={`
        relative group select-none
        flex items-center justify-between
        w-32 h-20 px-3 
        bg-slate-800 border-2 border-slate-600 rounded-xl shadow-lg
        hover:border-indigo-400 hover:shadow-indigo-500/20 hover:-translate-y-1
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${!isDraggable ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:border-slate-600' : ''}
      `}
    >
      {/* Texture/Grip */}
      <div className="absolute left-2 text-slate-600">
        <GripVertical size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center pl-3">
        <span className="text-xl font-bold font-mono text-white tracking-wider truncate max-w-[80px]" title={card.label}>
          {card.label}
        </span>
        {/* If label is different from value (e.g. calculation string), show approx value */}
        {card.label !== card.value.toString() && card.value % 1 !== 0 && (
             <span className="text-[10px] text-slate-400 font-mono">
               ≈ {card.value.toFixed(2)}
             </span>
        )}
      </div>

      {/* Remove Button (only for slots usually, but controlled by parent) */}
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Card;
