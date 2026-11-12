import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const SOSButton = ({ onTrigger, loading, disabled, activeEmergency }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Pulsing ring background */}
        <div
          className={!disabled ? (activeEmergency ? 'animate-emergency-pulse' : 'animate-calm-breathing') : ''}
          style={{
            position: 'absolute',
            width: '185px',
            height: '185px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? 'rgba(225, 29, 72, 0.35)' : 'rgba(225, 29, 72, 0.12)',
            pointerEvents: 'none',
          }}
        />

        {/* Core SOS Button */}
        <button
          onClick={onTrigger}
          disabled={disabled || loading}
          aria-label="Activate Emergency SOS"
          style={{
            width: '156px',
            height: '156px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? '#BE123C' : 'var(--coral-emergency)',
            border: '4px solid #FFFFFF',
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
              <AlertCircle size={40} strokeWidth={2.4} style={{ marginBottom: '4px' }} />
              <span style={{ fontSize: '1.15rem', fontWeight: '900', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {activeEmergency ? 'HELP ACTIVE' : 'TAP FOR HELP'}
              </span>
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          {activeEmergency ? 'EMERGENCY ACTIVE — TRANSMITTING TELEMETRY' : 'Immediate Medical Assistance'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
          {activeEmergency
            ? 'Live GPS tracking and notification logs active. Authorized responders and contacts are notified.'
            : 'Press once or speak "Emergency" hands-free to notify verified first responders and family contacts.'}
        </p>
      </div>
    </div>
  );
};
