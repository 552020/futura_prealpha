"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type InterfaceMode = "marketing" | "app";

interface InterfaceContextType {
  mode: InterfaceMode;
  setMode: (mode: InterfaceMode) => void;
}

const InterfaceContext = createContext<InterfaceContextType | undefined>(
  undefined
);

// Define app routes that should use app mode
const APP_ROUTES = ["/feed", "/shared", "/profile", "/contacts"];

// Helper function to determine if a path is an app route
function isAppRoute(path: string): boolean {
  // Remove the language prefix if it exists
  const pathWithoutLang = path.replace(/^\/[a-z]{2}/, "");
  return APP_ROUTES.some((route) => pathWithoutLang.startsWith(route));
}

export function InterfaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<InterfaceMode>("marketing");

  useEffect(() => {
    console.log("InterfaceProvider Debug:", {
      pathname,
      isAppRoute: isAppRoute(pathname),
      newMode: isAppRoute(pathname) ? "app" : "marketing",
    });
    setMode(isAppRoute(pathname) ? "app" : "marketing");
  }, [pathname]);

  return (
    <InterfaceContext.Provider value={{ mode, setMode }}>
      {children}
    </InterfaceContext.Provider>
  );
}

export function useInterface() {
  const context = useContext(InterfaceContext);
  if (context === undefined) {
    throw new Error("useInterface must be used within an InterfaceProvider");
  }
  return context;
}
