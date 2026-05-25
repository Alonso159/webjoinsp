import React from 'react';
import './Button.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  return (
    <button 
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`} 
      {...props}
    >
      {icon && <span className="ui-btn-icon">{icon}</span>}
      {children}
    </button>
  );
};
