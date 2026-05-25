import React from 'react';
import './Badge.css';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  return (
    <span className={`ui-badge ui-badge-${variant} ${className}`}>
      {children}
    </span>
  );
};
