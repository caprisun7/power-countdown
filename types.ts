export interface CardData {
  id: string;
  value: number;
  label: string; // The display string (e.g., "1/4", "3^2")
  isOriginal: boolean; // Was this a starting card?
}

export interface GameState {
  target: number;
  cards: CardData[]; // Cards currently in the "Hand"
  history: CardData[][]; // For Undo functionality
  solved: boolean;
}

export enum DragItemType {
  CARD = 'CARD',
}

export interface DragItem {
  type: DragItemType;
  id: string;
  source: 'hand' | 'slotA' | 'slotB';
}

export type OperationType = 'MULTIPLY' | 'POWER_AB' | 'RECIPROCAL';

export interface PuzzleData {
  target: number;
  numbers: number[];
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
