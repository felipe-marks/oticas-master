import React, { createContext, useContext, useEffect, useReducer } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  price_pix?: number;
  image?: string;
  quantity: number;
  sku: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          isOpen: true,
          items: state.items.map(i =>
            i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, isOpen: true, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: action.payload.quantity <= 0
          ? state.items.filter(i => i.id !== action.payload.id)
          : state.items.map(i => i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false }, () => {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? { items: JSON.parse(stored), isOpen: false } : { items: [], isOpen: false };
    } catch { return { items: [], isOpen: false }; }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      totalItems,
      subtotal,
      addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity: 1 } }),
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      updateQty: (id, quantity) => dispatch({ type: 'UPDATE_QTY', payload: { id, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
      toggleCart: () => dispatch({ type: 'TOGGLE' }),
      openCart: () => dispatch({ type: 'OPEN' }),
      closeCart: () => dispatch({ type: 'CLOSE' }),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
