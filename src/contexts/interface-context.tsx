"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type InterfaceMode = "marketing" | "app";

interface InterfaceContextType {
  mode: InterfaceMode;
  setMode: (mode: InterfaceMode) => void;
  isDeveloper: boolean;
  isAdmin: boolean;
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

const InterfaceContext = createContext<InterfaceContextType | undefined>(undefined);

// Define app routes that should use app mode
const APP_ROUTES = ["/dashboard", "/feed", "/shared", "/user", "/contacts"];

// Helper function to determine if a path is an app route
function isAppRoute(path: string): boolean {
  // Remove the language prefix if it exists
  const pathWithoutLang = path.replace(/^\/[a-z]{2}/, "");
  return APP_ROUTES.some((route) => pathWithoutLang.startsWith(route));
}

export function InterfaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mode, setMode] = useState<InterfaceMode>("marketing");
  const [devMode, setDevMode] = useState(false);

  // Derive isDeveloper and isAdmin from user role
  const isDeveloper = session?.user?.role === "developer" || session?.user?.role === "superadmin";
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  useEffect(() => {
    console.log("InterfaceProvider Debug:", {
      pathname,
      isAppRoute: isAppRoute(pathname),
      newMode: isAppRoute(pathname) ? "app" : "marketing",
      userRole: session?.user?.role,
      isDeveloper,
      isAdmin,
    });
    setMode(isAppRoute(pathname) ? "app" : "marketing");
  }, [pathname, session?.user?.role, isDeveloper, isAdmin]);

  return (
    <InterfaceContext.Provider value={{ mode, setMode, isDeveloper, isAdmin, devMode, setDevMode }}>
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
