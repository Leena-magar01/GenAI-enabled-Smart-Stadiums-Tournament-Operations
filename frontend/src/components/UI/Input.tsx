import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = '',
  style,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${className}`}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          border: error ? '1px solid var(--density-high)' : '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          outline: 'none',
          transition: 'all 0.2s ease',
          width: '100%',
          ...style
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--density-high)', marginTop: '0.125rem' }}>
          {error}
        </span>
      )}
    </div>
  );
};

// Build Sync: July 15, 2026
