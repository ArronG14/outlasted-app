import React from 'react';
import { colors } from '../../lib/design-tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium landing-text-body">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border border-[#D4D4D4] rounded-lg bg-white landing-text-primary placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#00E5A0]/20 focus:border-[#00E5A0] transition-all duration-200 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}