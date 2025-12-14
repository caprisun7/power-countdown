import React, { useState, useEffect, useCallback } from 'react';
import { CardData, DragItemType, GameState, Difficulty } from './types';
import Card from './components/Card';
import Workbench from './components/Workbench';
import { formatNumber, generateId, isTargetReached } from './utils/mathUtils';
import { generatePuzzle, getHint } from './services/geminiService';
import { RefreshCw, Undo2, Lightbulb, Trophy, BrainCircuit, Info, Github, Zap, Settings2 } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    target: 0,
    cards: [],
    history: [],
    solved: false
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [slotA, setSlotA] = useState<CardData | null>(null);
  const [slotB, setSlotB] = useState<CardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Initialization ---
  const startNewGame = useCallback(async (diff?: Difficulty) => {
    setLoading(true);
    setError(null);
    setHint(null);
    setSlotA(null);
    setSlotB(null);
    
    const selectedDifficulty = diff || difficulty;

    try {
      const puzzle = await generatePuzzle(selectedDifficulty);
      const initialCards: CardData[] = puzzle.numbers.map(num => ({
        id: generateId(),
        value: num,
        label: num.toString(),
        isOriginal: true
      }));

      setGameState({
        target: puzzle.target,
        cards: initialCards,
        history: [],
        solved: false
      });
    } catch (e) {
      setError("Failed to load puzzle. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [difficulty]); // Dependency on difficulty current state if not passed explicitly

  // Initial load
  useEffect(() => {
    // avoid double call in strict mode by checking if empty
    if (gameState.cards.length === 0 && loading) {
        startNewGame();
    }
  }, []);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newDiff = e.target.value as Difficulty;
      setDifficulty(newDiff);
      startNewGame(newDiff);
  };

  // --- Game Actions ---
  const handleUndo = () => {
    if (gameState.history.length === 0) return;

    const previousCards = gameState.history[gameState.history.length - 1];
    const newHistory = gameState.history.slice(0, -1);

    setGameState(prev => ({
      ...prev,
      cards: previousCards,
      history: newHistory,
      solved: false
    }));
    setSlotA(null);
    setSlotB(null);
    setHint(null);
  };

  const saveToHistory = () => {
    const allCurrentCards = [...gameState.cards];
    if (slotA) allCurrentCards.push(slotA);
    if (slotB) allCurrentCards.push(slotB);
    
    setGameState(prev => ({
      ...prev,
      history: [...prev.history, allCurrentCards]
    }));
  };

  const handleCombine = (newCard: CardData, usedIds: string[]) => {
    saveToHistory();

    setGameState(prev => {
      const newCards = [...prev.cards, newCard];
      const isSolved = isTargetReached(newCard.value, prev.target);
      return {
        ...prev,
        cards: newCards,
        solved: isSolved
      };
    });
  };

  const handleRequestHint = async () => {
    if (loadingHint || gameState.solved) return;
    setLoadingHint(true);
    
    const allValues = [...gameState.cards.map(c => c.value)];
    if (slotA) allValues.push(slotA.value);
    if (slotB) allValues.push(slotB.value);

    const hintText = await getHint(gameState.target, allValues);
    setHint(hintText);
    setLoadingHint(false);
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, card: CardData, source: 'hand' | 'slotA' | 'slotB') => {
    // Data is set in Card component
  };

  const handleDropOnSlot = (e: React.DragEvent, targetSlotId: 'slotA' | 'slotB') => {
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    const data = JSON.parse(dataStr);
    if (data.type !== DragItemType.CARD) return;

    const cardId = data.id;
    const source = data.source;

    // Find the card
    let draggedCard: CardData | undefined;
    
    if (source === 'hand') {
      draggedCard = gameState.cards.find(c => c.id === cardId);
    } else if (source === 'slotA') {
      draggedCard = slotA || undefined;
    } else if (source === 'slotB') {
      draggedCard = slotB || undefined;
    }

    if (!draggedCard) return;

    const targetCard = targetSlotId === 'slotA' ? slotA : slotB;

    // 1. Update Target Slot
    if (targetSlotId === 'slotA') setSlotA(draggedCard);
    else setSlotB(draggedCard);

    // 2. Update Source
    if (source === 'hand') {
      setGameState(prev => ({
        ...prev,
        cards: prev.cards.filter(c => c.id !== cardId)
      }));
      if (targetCard) {
        setGameState(prev => ({
          ...prev,
          cards: [...prev.cards.filter(c => c.id !== cardId), targetCard]
        }));
      }
    } else if (source === 'slotA') {
      if (targetSlotId === 'slotB') {
        setSlotA(targetCard);
      }
    } else if (source === 'slotB') {
        if (targetSlotId === 'slotA') {
            setSlotB(targetCard);
        }
    }
  };

  const handleDropOnHand = (e: React.DragEvent) => {
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    const data = JSON.parse(dataStr);
    if (data.source === 'hand') return;

    let card: CardData | null = null;
    if (data.source === 'slotA') {
        card = slotA;
        setSlotA(null);
    } else if (data.source === 'slotB') {
        card = slotB;
        setSlotB(null);
    }

    if (card) {
        setGameState(prev => ({
            ...prev,
            cards: [...prev.cards, card!]
        }));
    }
  };

  const handleReturnToHand = (card: CardData) => {
      if (slotA?.id === card.id) setSlotA(null);
      if (slotB?.id === card.id) setSlotB(null);
      
      setGameState(prev => ({
          ...prev,
          cards: [...prev.cards, card]
      }));
  };
  
  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans">
      
      {/* Header */}
      <header className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Power Countdown
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
            <Settings2 size={16} className="text-slate-400" />
            <select 
                value={difficulty} 
                onChange={handleDifficultyChange}
                disabled={loading}
                className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
            >
                <option value="EASY" className="bg-slate-800">Easy</option>
                <option value="MEDIUM" className="bg-slate-800">Medium</option>
                <option value="HARD" className="bg-slate-800">Hard</option>
            </select>
          </div>

          <button 
            onClick={() => startNewGame()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-semibold border border-slate-700 whitespace-nowrap"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            New Game
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col items-center">
        
        {/* Error Display */}
        {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
                {error}
            </div>
        )}

        {/* Loading State */}
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <BrainCircuit size={48} className="text-indigo-500 animate-pulse" />
                <p className="text-slate-400 animate-pulse">Generating {difficulty.toLowerCase()} puzzle...</p>
            </div>
        ) : (
            <>
                {/* Target Display */}
                <div className="relative mb-12 group cursor-default">
                    <div className={`
                        text-7xl md:text-8xl font-black font-mono tracking-tighter
                        ${gameState.solved ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.6)]' : 'text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]'}
                        transition-all duration-500
                    `}>
                        {gameState.target}
                    </div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-indigo-400 uppercase bg-slate-900 px-2 py-1 rounded border border-indigo-900/50 whitespace-nowrap">
                        Target ({difficulty})
                    </div>
                </div>

                {/* Hand Area */}
                <div 
                    className="w-full min-h-[140px] bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-wrap justify-center gap-4 transition-colors"
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={handleDropOnHand}
                >
                    {gameState.cards.length === 0 && !gameState.solved && (
                        <div className="text-slate-600 flex items-center gap-2">
                            <Info size={16} />
                            <span>All cards in use</span>
                        </div>
                    )}
                    {gameState.cards.map(card => (
                        <Card 
                            key={card.id} 
                            card={card} 
                            source="hand" 
                            onDragStart={handleDragStart} 
                            isDraggable={!gameState.solved}
                        />
                    ))}
                </div>

                {/* Workbench Area */}
                {!gameState.solved ? (
                    <Workbench 
                        slotA={slotA}
                        slotB={slotB}
                        onUpdateSlot={(slot, card) => {
                            // This is handled via drops mainly, but used for internal reciprocal logic
                            if (slot === 'slotA') setSlotA(card);
                            else setSlotB(card);
                        }}
                        onCombine={handleCombine}
                        onReturnToHand={handleReturnToHand}
                        onDragStart={handleDragStart}
                        onDropOnSlot={handleDropOnSlot}
                    />
                ) : (
                    <div className="mt-8 p-8 bg-emerald-900/20 border border-emerald-500/30 rounded-3xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <Trophy size={48} className="text-emerald-400 mb-4" />
                        <h2 className="text-3xl font-bold text-emerald-100 mb-2">Target Reached!</h2>
                        <p className="text-emerald-400/80 mb-6">Excellent calculation.</p>
                        <button 
                            onClick={() => startNewGame()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            Next Puzzle
                        </button>
                    </div>
                )}

                {/* Game Controls */}
                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={handleUndo}
                        disabled={gameState.history.length === 0 || gameState.solved}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Undo2 size={18} />
                        Undo
                    </button>
                    <button 
                        onClick={handleRequestHint}
                        disabled={loadingHint || gameState.solved}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900/30 text-amber-200 border border-amber-900/50 hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Lightbulb size={18} className={loadingHint ? "animate-pulse" : ""} />
                        {loadingHint ? "Thinking..." : "Hint"}
                    </button>
                </div>

                {/* Hint Display */}
                {hint && (
                    <div className="mt-6 p-4 bg-amber-950/40 border-l-4 border-amber-500 text-amber-100 max-w-lg rounded-r-lg animate-in slide-in-from-bottom-2">
                        <p className="font-mono text-sm">{hint}</p>
                    </div>
                )}
            </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-4 right-4 text-xs text-slate-600 hidden lg:block">
        <div className="flex flex-col items-end gap-1">
            <span>Drag one card to a slot. Drag another. Combine.</span>
            <span>Reach the target.</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
