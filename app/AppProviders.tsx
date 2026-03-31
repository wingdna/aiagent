import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as pkg from 'react-helmet-async';
import { LazyMotion, domAnimation } from 'framer-motion';

const HelmetProvider = (pkg as any).HelmetProvider || (pkg as any).default?.HelmetProvider || (pkg as any).default || pkg;

interface UserPreferences {
  preferredPricing: string[];
  preferredFramework: string[];
  interestTags: string[];
}

const UserPreferencesContext = createContext<{
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}>({
  preferences: { preferredPricing: [], preferredFramework: [], interestTags: [] },
  setPreferences: () => {},
});

export const useUserPreferences = () => useContext(UserPreferencesContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredPricing: [],
    preferredFramework: [],
    interestTags: [],
  });

  return (
    <UserPreferencesContext.Provider value={{ preferences, setPreferences }}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <LazyMotion features={domAnimation}>
            {children}
          </LazyMotion>
        </HelmetProvider>
      </QueryClientProvider>
    </UserPreferencesContext.Provider>
  );
}
