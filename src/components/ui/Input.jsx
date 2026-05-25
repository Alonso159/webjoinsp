import React, { forwardRef } from 'react';
import './Input.css';

export const Input = forwardRef(({ label, error, className = '', suffix, ...props }, ref) => {
  return (
    <div className={`ui-input-container ${className}`}>
      {label && <label className="ui-input-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          ref={ref}
          className={`ui-input ${error ? 'ui-input-error' : ''}`} 
          style={suffix ? { paddingRight: '2.5rem', width: '100%' } : { width: '100%' }}
          {...props} 
        />
        {suffix && (
          <div style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            {suffix}
          </div>
        )}
      </div>
      {error && <span className="ui-input-error-msg">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
