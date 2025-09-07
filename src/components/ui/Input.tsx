import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-[#F8F8F6]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border border-[#404040] rounded-lg bg-[#171717] text-[#F8F8F6] placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#00E5A0]/20 focus:border-[#00E5A0] transition-all duration-200 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}