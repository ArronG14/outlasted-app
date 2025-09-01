import React from 'react';
import { colors } from '../../lib/design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'google' | 'apple';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: `bg-[${colors.primary}] text-black hover:bg-[${colors.primary}]/90 focus:ring-2 focus:ring-[${colors.primary}]/50`,
    secondary: `bg-[${colors.secondary}] text-white hover:bg-[${colors.secondary}]/90 focus:ring-2 focus:ring-[${colors.secondary}]/50`,
    outline: `border border-[${colors.foreground.muted}] text-[${colors.foreground.primary.light}] hover:bg-[${colors.card.light}] focus:ring-2 focus:ring-[${colors.primary}]/20`,
    google: `bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-2 focus:ring-[${colors.primary}]/20 font-medium`,
    apple: `bg-black text-white hover:bg-gray-900 focus:ring-2 focus:ring-gray-500/50`,
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}