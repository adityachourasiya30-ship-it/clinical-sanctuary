import React from 'react';

/**
 * Magic UI - Ripple
 * Concentric outward-expanding circular radar rings.
 * Lightweight, zero-dependency pure React + CSS animation implementation.
 */
export const Ripple = ({
  mainCircleSize = 200,
  mainCircleOpacity = 0.24,
  numCircles = 6,
  color = '225, 29, 72', // RGB string for dynamic opacity
  active = false,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`magic-ripple-container ${className}`}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${mainCircleSize}px`,
        height: `${mainCircleSize}px`,
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    >
      {Array.from({ length: numCircles }).map((_, i) => {
        const size = mainCircleSize + i * (active ? 70 : 55);
        const opacity = Math.max(0.04, mainCircleOpacity - i * 0.035);
        const animationDelay = `${i * 0.3}s`;
        const duration = active ? '2.4s' : '3.6s';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: `1.5px solid rgba(${color}, ${opacity * 1.5})`,
              backgroundColor: `rgba(${color}, ${opacity * 0.35})`,
              transform: 'translate(-50%, -50%) scale(1)',
              animation: `magic-ripple-wave ${duration} infinite cubic-bezier(0.22, 1, 0.36, 1)`,
              animationDelay,
            }}
          />
        );
      })}

      <style>{`
        @keyframes magic-ripple-wave {
          0% {
            transform: translate(-50%, -50%) scale(0.85);
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.85);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Ripple;
