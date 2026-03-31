import { Agent } from '../../types';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SYNAPSE_CACHE: KVNamespace;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  CRON_SECRET?: string;
}

export type KVNamespace = {
  get: (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => Promise<any>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

export type PagesFunction<E> = (context: {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<any>) => void;
}) => Promise<Response>;
