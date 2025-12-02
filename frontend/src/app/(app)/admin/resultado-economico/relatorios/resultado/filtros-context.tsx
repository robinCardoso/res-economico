'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface FiltrosContextType {
  filtrosExpandidos: boolean;
  setFiltrosExpandidos: (value: boolean) => void;
}

const FiltrosContext = createContext<FiltrosContextType | undefined>(undefined);

export const FiltrosProvider = ({ children }: { children: ReactNode }) => {
  const [filtrosExpandidos, setFiltrosExpandidos] = useState<boolean>(true);

  return (
    <FiltrosContext.Provider value={{ filtrosExpandidos, setFiltrosExpandidos }}>
      {children}
    </FiltrosContext.Provider>
  );
};

export const useFiltros = () => {
  const context = useContext(FiltrosContext);
  if (context === undefined) {
    throw new Error('useFiltros must be used within a FiltrosProvider');
  }
  return context;
};

