import React, { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as pkg from 'react-helmet-async';
import { LazyMotion, domAnimation } from 'framer-motion';

const HelmetProvider = (pkg as any).HelmetProvider || (pkg as any).default?.HelmetProvider || (pkg as any).default || pkg;

const MobileContext = createContext<boolean>(false);

export const useMobile = () => useContext(MobileContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function AppProviders({ children, isMobile }: { children: React.ReactNode, isMobile?: boolean }) {
  return (
    <MobileContext.Provider value={isMobile || false}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <LazyMotion features={domAnimation}>
              {children}
            </LazyMotion>
          </HelmetProvider>
        </QueryClientProvider>
    </MobileContext.Provider>
  );
}
