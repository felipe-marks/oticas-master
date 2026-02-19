import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "h-12 w-12" }) => {
  const id = React.useId();
  // Sanitize ID for use in URL references (remove colons if present)
  const gradientId = `gold-gradient-${id.replace(/:/g, '')}`;

  return (
    <svg 
      className={className} 
      viewBox="0 0 260 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Óticas Master Logo"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DAA520" /> {/* Light Gold */}
          <stop offset="50%" stopColor="#B8860B" /> {/* Classic Gold */}
          <stop offset="100%" stopColor="#8B6508" /> {/* Dark Gold */}
        </linearGradient>
      </defs>
      
      {/* Letter O - Clean Circular Geometry */}
      <ellipse 
        cx="70" 
        cy="80" 
        rx="55" 
        ry="55" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="14" 
      />
      
      {/* Letter M - Sharp, Modern geometric structure */}
      <path 
        d="M150 135V25L195 95L240 25V135" 
        stroke={`url(#${gradientId})`} 
        strokeWidth="14" 
        strokeLinecap="square" 
        strokeLinejoin="round"
      />
    </svg>
  );
};