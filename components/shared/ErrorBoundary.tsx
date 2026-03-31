import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SystemFailureHUD } from './SystemFailureHUD';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.includes('Failed to fetch') || 
                            this.state.error?.message.includes('NetworkError') ||
                            this.state.error?.message.includes('manifest patches');

      // [BEAUTIFUL-DEATH] Intercept Deadlock Protocol
      if (this.state.error?.message.includes('DEADLOCK_PROTOCOL') || 
          this.state.error?.message.includes('VITE_SILICONFLOW_API_KEY')) {
          return <SystemFailureHUD error={this.state.error} />;
      }
      
      if (isNetworkError) {
        return (
          <div className="p-6 border border-cyan-500/30 bg-black/80 text-cyan-400 text-xs font-mono rounded-lg flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="animate-pulse">●</span>
              <strong>NEURAL_LINK_INTERRUPTED:</strong> {this.state.error?.message || 'Network Failure'}
            </div>
            <p className="text-cyan-400/60 text-center max-w-xs">
              The neural connection to the manifest or data stream was severed. This is often temporary.
            </p>
            <button 
              onClick={() => typeof window !== 'undefined' && window.location.reload()}
              className="px-4 py-2 border border-cyan-500/50 hover:bg-cyan-500/10 transition-colors rounded text-[10px] uppercase tracking-widest"
            >
              Re-establish Connection
            </button>
          </div>
        );
      }
      
      return this.props.fallback || (
        <div className="p-4 border border-red-500 bg-red-900/20 text-red-500 text-xs font-mono rounded">
            <strong>RENDER_FAIL:</strong> {this.state.error?.message || 'Unknown Error'}
        </div>
      );
    }

    return this.props.children;
  }
}
