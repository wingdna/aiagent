import React, { startTransition, StrictMode } from "react";
import { HydratedRouter } from "react-router/dom";
import { hydrateRoot } from "react-dom/client";

// Suppress Recharts warnings in React 18.3+
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    // Suppress defaultProps warning
    if (args[0].includes('Support for defaultProps will be removed from function components in a future major release.')) {
      return;
    }
    // Suppress ResponsiveContainer dimension warnings
    if (args[0].includes('The width(-1) and height(-1) of chart should be greater than 0')) {
      return;
    }
  }
  originalConsoleError(...args);
};

startTransition(() => {
  try {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    );
  } catch (error) {
    console.error("Hydration failed:", error);
    // Optionally trigger a reload or redirect
  }
});
