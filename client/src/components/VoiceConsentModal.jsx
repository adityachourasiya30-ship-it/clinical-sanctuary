import React from 'react';
import { Mic, ShieldCheck, AlertTriangle } from 'lucide-react';

export const VoiceConsentModal = ({ isOpen, onClose, onGrantConsent }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#141e33',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#ef444420',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mic size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
              Emergency Audio Evidence Consent
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Milestone 4 Privacy & Safety Compliance
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
          In an active emergency, Clinical Sanctuary can automatically record ambient audio evidence through your microphone.
          This audio provides crucial situational context for first responders and law enforcement.
        </p>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            <strong style={{ fontSize: '0.8rem', color: '#f8fafc' }}>Privacy Guarantee</strong>
          </div>
          <ul style={{ fontSize: '0.75rem', color: '#94a3b8', paddingLeft: '1.2rem', lineHeight: 1.4 }}>
            <li>Recordings activate <strong>only</strong> after an emergency alert is triggered.</li>
            <li>Files are encrypted at rest with AES-256 and stored securely.</li>
            <li>Recordings are retained for 72 hours and can be deleted anytime in your Medical Profile.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Decline
          </button>

          <button
            type="button"
            onClick={() => {
              onGrantConsent();
              onClose();
            }}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Mic size={16} />
            Grant Consent & Enable
          </button>
        </div>
      </div>
    </div>
  );
};
