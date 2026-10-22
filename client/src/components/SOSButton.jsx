import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const SOSButton = ({ onTrigger, loading, disabled, activeEmergency }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Pulsing ring background */}
        <div
          className={!disabled ? 'animate-pulse-sos' : ''}
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* Core SOS Button */}
        <button
          onClick={onTrigger}
          disabled={disabled || loading}
          aria-label="Activate Emergency SOS"
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            backgroundColor: activeEmergency ? '#b91c1c' : '#ef4444',
            border: '4px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 12px 30px rgba(239, 68, 68, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            transition: 'all 0.2s ease',
            zIndex: 5,
            outline: 'none',
            userSelect: 'none',
          }}
          onMouseDown={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(0.96)';
          }}
          onMouseUp={(e) => {
            if (!disabled) e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? (
            <Loader2 size={44} className="animate-spin" />
          ) : (
            <>
              <AlertCircle size={40} strokeWidth={2.5} style={{ marginBottom: '4px' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                SOS
              </span>
            </>
          )}
        </button>
      </div>

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
          {activeEmergency ? 'EMERGENCY ACTIVE — TRACKING LIVE' : 'Are you in danger?'}
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.4 }}>
          {activeEmergency
            ? 'Your live GPS location and alerts are currently broadcasting to emergency contacts.'
            : 'Press once or speak "Emergency" to alert contacts, broadcast live location, and mobilize response.'}
        </p>
      </div>
    </div>
  );
};
