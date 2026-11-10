import React, { useState, useEffect } from 'react';
import { onValidationError, BoundaryValidationError } from '../../api/generated/validator';
import { AlertTriangle, X } from 'lucide-react';

export const ApiBoundaryAlertBanner: React.FC = () => {
  const [errors, setErrors] = useState<BoundaryValidationError[]>([]);

  useEffect(() => {
    return onValidationError((err) => {
      setErrors((prev) => [err, ...prev].slice(0, 5));
    });
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-auto">
      {errors.map((err, idx) => (
        <div
          key={`${err.endpoint}-${err.field}-${err.timestamp}-${idx}`}
          className="p-3 bg-red-950/90 border border-red-500/60 rounded-lg shadow-xl backdrop-blur-md text-red-200 text-xs flex items-start gap-2 animate-fadeIn"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-red-300">API Boundary Contract Mismatch</div>
            <div className="text-red-300/80 mt-0.5 font-mono text-[11px]">
              {err.endpoint} &rarr; field <span className="text-white font-bold">{err.field}</span>
            </div>
            <div className="text-[10px] text-red-400/90 mt-1">
              Expected: <span className="font-mono text-red-200">{err.expected}</span> | Received:{' '}
              <span className="font-mono text-red-200">{JSON.stringify(err.actual)}</span>
            </div>
          </div>
          <button
            onClick={() => setErrors((prev) => prev.filter((_, i) => i !== idx))}
            className="text-red-400 hover:text-red-200 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
