"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, ReactNode, useContext, useMemo } from "react";

// Context to check if Convex is available
const ConvexAvailableContext = createContext<boolean>(false);

export function useConvexAvailable(): boolean {
  return useContext(ConvexAvailableContext);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url || url === "https://placeholder.convex.cloud") {
      // During development/build without Convex configured
      return null;
    }
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    // Render children without Convex provider if not configured
    return (
      <ConvexAvailableContext.Provider value={false}>
        {children}
      </ConvexAvailableContext.Provider>
    );
  }

  return (
    <ConvexAvailableContext.Provider value={true}>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}
