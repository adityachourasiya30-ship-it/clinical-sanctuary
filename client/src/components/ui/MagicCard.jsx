import React, { useState, useRef, useCallback } from 'react';

/**
 * Magic UI - MagicCard
 * Spotlight card that tracks cursor movement to render an interactive radial glow and border highlight.
 * Lightweight, zero-dependency pure React + CSS implementation.
 */
export const MagicCard = ({
  children,
  className = '',
  style = {},
  gradientSize = 280,
  gradientColor = 'rgba(5, 150, 105, 0.12)', // Sage emerald default or custom
  spotlightBorderColor = 'rgba(5, 150, 105, 0.45)',
  borderColor = 'var(--border-subtle, #E2E8F0)',
  backgroundColor = 'var(--surface-primary, #FFFFFF)',
  borderRadius = 'var(--radius-md, 16px)',
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePos({ x: -999, y: -999 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`magic-card ${className}`}
      style={{
        position: 'relative',
        borderRadius,
        backgroundColor,
        border: `1.5px solid ${borderColor}`,
        boxShadow: isHovered
          ? '0 12px 32px -4px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)'
          : 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04))',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {/* Interactive Radial Spotlight Background Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(${gradientSize}px circle at ${mousePos.x}px ${mousePos.y}px, ${gradientColor}, transparent 80%)`,
          zIndex: 1,
        }}
      />

      {/* Interactive Border Spotlight Highlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-1px',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(${gradientSize * 0.75}px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightBorderColor}, transparent 70%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1.5px',
          zIndex: 2,
        }}
      />

      {/* Card Content Container */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
};

export default MagicCard;
