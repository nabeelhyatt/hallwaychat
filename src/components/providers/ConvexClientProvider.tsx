"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

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
    return <>{children}</>;
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
