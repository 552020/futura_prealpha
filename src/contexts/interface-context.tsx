"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type InterfaceMode = "marketing" | "app";

interface InterfaceContextType {
  mode: InterfaceMode;
  setMode: (mode: InterfaceMode) => void;
}

const InterfaceContext = createContext<InterfaceContextType | undefined>(undefined);

export function InterfaceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<InterfaceMode>("marketing");

  return <InterfaceContext.Provider value={{ mode, setMode }}>{children}</InterfaceContext.Provider>;
}

export function useInterface() {
  const context = useContext(InterfaceContext);
  if (context === undefined) {
    throw new Error("useInterface must be used within an InterfaceProvider");
  }
  return context;
}
