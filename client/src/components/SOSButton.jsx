import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const SOSButton = ({ onTrigger, loading, disabled, activeEmergency }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Pulsing ring background */}
        <div
          className={!disabled ? 'animate-emergency-pulse' : ''}
          style={{
            position: 'absolute',
            width: '185px',
            height: '185px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? 'rgba(255, 90, 82, 0.4)' : 'rgba(255, 90, 82, 0.16)',
            pointerEvents: 'none',
          }}
        />

        {/* Core SOS Button */}
        <button
          onClick={onTrigger}
          disabled={disabled || loading}
          aria-label="Activate Emergency SOS"
          style={{
            width: '154px',
            height: '154px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? '#D63C35' : 'var(--coral-emergency)',
            border: '4px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 12px 35px var(--coral-glow), inset 0 2px 6px rgba(255, 255, 255, 0.35)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 5,
            outline: 'none',
            userSelect: 'none',
          }}
          onMouseDown={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? (
            <Loader2 size={46} className="animate-spin" />
          ) : (
            <>
              <AlertCircle size={42} strokeWidth={2.6} style={{ marginBottom: '4px' }} />
              <span style={{ fontSize: '1.35rem', fontWeight: '900', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                SOS
              </span>
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          {activeEmergency ? 'EMERGENCY ACTIVE — TRANSMITTING TELEMETRY' : 'Immediate Assistance'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
          {activeEmergency
            ? 'Live GPS tracking and notification logs active. Authorized responders and contacts are notified.'
            : 'Press once or speak "Emergency" hands-free to broadcast your location and notify emergency contacts.'}
        </p>
      </div>
    </div>
  );
};
