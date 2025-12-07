import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-white/50">{message}</span>
      </div>
    </div>
  );
};

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">Error loading data</p>
          <p className="text-xs text-white/50 mt-1">{error.message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/30 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default Loading;
