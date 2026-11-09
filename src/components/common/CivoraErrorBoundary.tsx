import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class CivoraErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production, error can also be dispatched to a remote observability ingest
    console.error('[CIVORA ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    window.location.reload();
  };

  private handleCopy = () => {
    const details = `CIVORA Error Report:\n${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0a0c10] text-[#EAE3D2] flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-[#141820] border border-[#C5A66A]/40 rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A66A] to-transparent" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-wide text-[#EAE3D2]">
                  {this.props.fallbackTitle || 'Imperial Engine Anomaly Detected'}
                </h2>
                <p className="text-xs text-[#8A8F98] uppercase tracking-wider">
                  Simulation state and persistent data remain safeguarded
                </p>
              </div>
            </div>

            <p className="text-sm text-[#A0A5B0] mb-6 leading-relaxed">
              A graphical or computational exception occurred in the client viewport. 
              The backend discrete simulation continues uninterrupted on the authoritative server.
            </p>

            {this.state.error && (
              <div className="bg-[#0b0e14] border border-[#232834] rounded-lg p-4 mb-6 font-mono text-xs text-red-400/90 overflow-x-auto max-h-40">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C5A66A] hover:bg-[#D4B77D] text-[#0F1115] font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-[#C5A66A]/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reinitialize Engine
              </button>

              <button
                onClick={this.handleCopy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B202A] hover:bg-[#232936] text-[#A0A5B0] hover:text-[#EAE3D2] border border-[#2E3545] font-mono text-xs transition cursor-pointer"
              >
                {this.state.copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {this.state.copied ? 'Copied' : 'Copy Diagnostics'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
