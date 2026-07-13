import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary text-primary border border-color hover:bg-tertiary';
      case 'danger':
        return 'bg-density-high text-white hover:opacity-90';
      case 'ghost':
        return 'bg-transparent text-secondary hover:bg-tertiary hover:text-primary';
      case 'primary':
      default:
        return 'bg-accent-primary text-white hover:bg-accent-hover';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'padding-sm font-sm';
      case 'lg':
        return 'padding-lg font-lg';
      case 'md':
      default:
        return 'padding-md';
    }
  };

  const styleRules = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
    borderRadius: 'var(--border-radius-sm)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    outline: 'none',
  };

  return (
    <button
      className={`btn-${variant} ${className}`}
      style={{
        ...styleRules,
        backgroundColor: variant === 'primary' ? 'var(--accent-primary)' : variant === 'danger' ? 'var(--density-high)' : variant === 'ghost' ? 'transparent' : 'var(--bg-secondary)',
        color: variant === 'primary' || variant === 'danger' ? '#ffffff' : 'var(--text-primary)',
        border: variant === 'secondary' ? '1px solid var(--border-color)' : 'none',
        padding: size === 'sm' ? '0.25rem 0.5rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.5rem 1rem',
        fontSize: size === 'sm' ? '0.875rem' : '1rem',
        borderRadius: 'var(--border-radius-sm)',
      }}
      {...props}
    >
      {children}
    </button>
  );
};
