import React, { startTransition, StrictMode } from "react";
import { HydratedRouter } from "react-router/dom";
import { hydrateRoot } from "react-dom/client";
import { AppProviders } from "./AppProviders";

const isMobile = (window as any).__IS_MOBILE__;

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <AppProviders isMobile={isMobile}>
        <HydratedRouter />
      </AppProviders>
    </StrictMode>
  );
});
