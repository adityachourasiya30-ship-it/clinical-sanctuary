import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Ripple } from './ui/Ripple';

/**
 * Ripple SOS Core
 * Centered high-craft SOS emergency centerpiece featuring concentric outward-expanding
 * Magic UI radar rings behind a tactile circular crimson-coral button.
 */
export const SOSButton = ({ onTrigger, loading, disabled, activeEmergency }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '2rem 0',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Magic UI Concentric Outward-Expanding Radar Rings */}
        {!disabled && (
          <Ripple
            mainCircleSize={165}
            numCircles={6}
            mainCircleOpacity={activeEmergency ? 0.35 : 0.22}
            active={Boolean(activeEmergency)}
            color={activeEmergency ? '225, 29, 72' : '225, 29, 72'}
          />
        )}

        {/* Tactile Circular Crimson-Coral Core SOS Button */}
        <button
          onClick={onTrigger}
          disabled={disabled || loading}
          aria-label="Activate Emergency SOS"
          style={{
            position: 'relative',
            width: '168px',
            height: '168px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? '#BE123C' : 'var(--coral-emergency, #E11D48)',
            border: '5px solid #FFFFFF',
            boxShadow: activeEmergency
              ? '0 16px 45px rgba(225, 29, 72, 0.55), inset 0 2px 8px rgba(255, 255, 255, 0.45)'
              : '0 14px 38px rgba(225, 29, 72, 0.38), inset 0 2px 6px rgba(255, 255, 255, 0.35)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 10,
            outline: 'none',
            userSelect: 'none',
          }}
          onMouseDown={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(0.94)';
          }}
          onMouseUp={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(1.03)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? (
            <Loader2 size={48} className="animate-spin" />
          ) : (
            <>
              <AlertCircle size={42} strokeWidth={2.4} style={{ marginBottom: '6px' }} />
              <span
                style={{
                  fontSize: '1.18rem',
                  fontWeight: '900',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {activeEmergency ? 'HELP ACTIVE' : 'TAP FOR HELP'}
              </span>
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: '900',
            color: 'var(--text-main, #0F172A)',
            marginBottom: '0.35rem',
            letterSpacing: '-0.01em',
          }}
        >
          {activeEmergency ? 'EMERGENCY ACTIVE — TRANSMITTING TELEMETRY' : 'Immediate Medical Assistance'}
        </h3>
        <p
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-secondary, #475569)',
            maxWidth: '420px',
            lineHeight: 1.5,
            margin: '0 auto',
          }}
        >
          {activeEmergency
            ? 'Live GPS tracking and notification logs active. Authorized paramedic responders and contacts are notified.'
            : 'Press once or speak "Emergency" hands-free to notify verified first responders and emergency contacts.'}
        </p>
      </div>
    </div>
  );
};

export default SOSButton;
