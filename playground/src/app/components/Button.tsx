import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  gradient?: string;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  gradient,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const baseStyles = `
    px-6 py-3.5 rounded-[var(--radius-button)] font-semibold
    transition-all active:scale-[0.97]
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  if (variant === 'primary' && gradient) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={baseStyles}
        style={{
          background: gradient,
          color: 'white',
        }}
      >
        {children}
      </motion.button>
    );
  }

  if (variant === 'primary') {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={baseStyles}
        style={{
          backgroundColor: 'var(--teal)',
          color: 'white',
        }}
      >
        {children}
      </motion.button>
    );
  }

  if (variant === 'ghost') {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`${baseStyles} border border-[var(--border-subtle)]`}
        style={{
          color: 'var(--text-secondary)',
        }}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={baseStyles}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </motion.button>
  );
}
