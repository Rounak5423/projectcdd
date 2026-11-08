import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GENESIS Viewport ErrorBoundary caught an exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#0d1310] text-[#e0e6e2] p-8 border border-red-500/30 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-amber-950/10 pointer-events-none" />
          <div className="max-w-md w-full text-center relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#faecd0] mb-2">
              {this.props.fallbackTitle || 'Simulation Viewport Interrupted'}
            </h3>
            <p className="text-xs text-[#a0aba3] mb-4">
              A rendering or pipeline exception occurred. The simulation state remains safely preserved in memory and SQLite.
            </p>
            {this.state.error && (
              <div className="w-full bg-[#080d0a] border border-red-500/20 rounded p-3 mb-6 text-left font-mono text-[11px] text-red-300 max-h-24 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Recover Viewport
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
