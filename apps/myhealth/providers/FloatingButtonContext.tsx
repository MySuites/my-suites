import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';


type ButtonId = 'nav' | 'action' | null;

interface FloatingButtonContextType {
  activeButtonId: ButtonId;
  setActiveButtonId: (id: ButtonId) => void;
  isHidden: boolean;
  setIsHidden: (hidden: boolean) => void;
}

const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined);

export function FloatingButtonProvider({ children }: { children: ReactNode }) {
  const [activeButtonId, setActiveButtonIdState] = useState<ButtonId>(null);
  const [isHidden, setIsHidden] = useState(false);

  const setActiveButtonId = useCallback((id: ButtonId) => {
      setActiveButtonIdState(id);
  }, []);

  const value = useMemo(() => ({
    activeButtonId,
    setActiveButtonId,
    isHidden,
    setIsHidden,
  }), [activeButtonId, setActiveButtonId, isHidden]);

  return (
    <FloatingButtonContext.Provider value={value}>
      {children}
    </FloatingButtonContext.Provider>
  );
}

export function useFloatingButton() {
  const context = useContext(FloatingButtonContext);
  if (!context) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider');
  }
  return context;
}
