import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullPage = false,
  className,
  message
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const spinner = (
    <Loader2
      className={clsx(
        'animate-spin',
        size === 'sm' ? 'text-slate-400' : 'text-highlight',
        sizeClasses[size],
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
            {size === 'sm' ? spinner : <Loader2 className="w-8 h-8 animate-spin text-highlight" />}
          </div>
          {message && (
            <p className="text-sm text-slate-500 font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className={clsx(
          'rounded-xl bg-primary/5 flex items-center justify-center',
          size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-14 h-14' : 'w-20 h-20'
        )}>
          {spinner}
        </div>
        {message && (
          <p className="text-xs text-slate-400">{message}</p>
        )}
      </div>
    </div>
  );
};