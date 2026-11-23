import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let isSr = true;
      try {
        isSr = localStorage.getItem('carddrop_language_v1') !== 'en';
      } catch {
        // default sr
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center text-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-white mb-1">
            {isSr ? 'Došlo je do greške' : 'Something went wrong'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            {this.state.error?.message ||
              (isSr
                ? 'Došlo je do neočekivane greške pri učitavanju ovog prikaza.'
                : 'An unexpected error occurred while loading this view.')}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isSr ? 'Pokušaj ponovo' : 'Try Again'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
