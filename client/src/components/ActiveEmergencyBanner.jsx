import React, { useState, useEffect } from 'react';
import { AlertCircle, Radio, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const ActiveEmergencyBanner = ({ incident, onResolve, onCancel }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Accidental SOS press / False alarm');

  useEffect(() => {
    if (!incident || ['RESOLVED', 'CANCELLED'].includes(incident.status)) return;

    const start = new Date(incident.createdAt).getTime();
    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  if (!incident || ['RESOLVED', 'CANCELLED'].includes(incident.status)) return null;

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleResolveClick = async () => {
    const confirm = window.confirm(
      'Are you safe now? Marking this emergency as RESOLVED will stop live GPS streaming and conclude the incident.'
    );
    if (!confirm) return;

    setResolving(true);
    try {
      const incId = incident._id || incident.id || incident.incidentCode;
      await onResolve(incId);
    } finally {
      setResolving(false);
    }
  };

  const executeCancel = async (reasonToSubmit) => {
    setCancelling(true);
    try {
      const incId = incident._id || incident.id || incident.incidentCode;
      if (onCancel) {
        await onCancel(incId, reasonToSubmit || cancelReason);
      }
      setShowCancelModal(false);
    } catch (err) {
      console.error('Error during cancellation:', err);
    } finally {
      setCancelling(false);
    }
  };

  const quickReasons = [
    'Accidental SOS press / False alarm',
    'Testing system features',
    'Assistance arrived privately',
    'Issue resolved immediately',
  ];

  return (
    <>
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backgroundColor: '#881337',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1rem',
          margin: '0.5rem 0 1.25rem 0',
          boxShadow: '0 8px 30px rgba(136, 19, 55, 0.22)',
          padding: '1.25rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Top Row: Responsive Header (Left: Title + ID, Right: Status + Timer) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            marginBottom: '0.85rem',
          }}
        >
          {/* Left: Indicator, Title & High-Contrast Incident ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FB7185',
                boxShadow: '0 0 12px #FFFFFF',
                animation: 'emergency-pulse 1.4s infinite',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '0.02em', color: '#FFFFFF' }}>
              ACTIVE INCIDENT: {incident.category || 'EMERGENCY'}
            </span>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '0.25rem 0.65rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                letterSpacing: '0.05em',
              }}
            >
              {incident.incidentCode}
            </span>
          </div>

          {/* Right: Dynamic High-Contrast Status Pill & Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Status Pill with Crisp Contrast */}
            {incident.status === 'SEARCHING' ? (
              <span
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#78350F',
                  border: '1px solid #FCD34D',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#D97706',
                    animation: 'emergency-pulse 1.2s infinite',
                  }}
                />
                STATUS: SEARCHING
              </span>
            ) : incident.status === 'ARRIVED' ? (
              <span
                style={{
                  backgroundColor: '#D1FAE5',
                  color: '#065F46',
                  border: '1px solid #6EE7B7',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#059669' }} />
                STATUS: ON SCENE (ARRIVED)
              </span>
            ) : (
              <span
                style={{
                  backgroundColor: '#DBEAFE',
                  color: '#1E40AF',
                  border: '1px solid #93C5FD',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
                STATUS: {incident.status}
              </span>
            )}

            {/* Live Timer Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#FFE4E6',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Radio size={12} className="animate-pulse" />
              <span>Elapsed: {formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Informational Caption & Cleanly Aligned Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#FECDD3', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Broadcasting real-time coordinates. Responders and emergency contacts notified.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling || resolving}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                color: '#FECDD3',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'background 0.15s ease',
              }}
            >
              <XCircle size={14} />
              {cancelling ? 'Cancelling...' : 'Cancel (False Alarm)'}
            </button>

            <button
              type="button"
              onClick={handleResolveClick}
              disabled={resolving || cancelling}
              style={{
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: '800',
                cursor: resolving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 10px rgba(5, 150, 105, 0.4)',
                transition: 'transform 0.1s ease',
              }}
            >
              <CheckCircle size={15} />
              {resolving ? 'Resolving...' : 'I Am Safe (Resolve)'}
            </button>
          </div>
        </div>
      </div>

      {/* In-App Cancellation Dialog Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card-clean"
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--coral-emergency)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} color="var(--coral-emergency)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Cancel Emergency Alert
              </h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Are you sure you want to cancel incident <code style={{ color: 'var(--teal-primary)' }}>{incident.incidentCode}</code>?
              This will notify any assigned units that this was a false alarm and halt location streaming.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Select Reason:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {quickReasons.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCancelReason(r)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.78rem',
                      backgroundColor: cancelReason === r ? 'var(--coral-subtle)' : 'var(--surface-elevated)',
                      border: cancelReason === r ? '1px solid var(--coral-emergency)' : '1px solid var(--border-subtle)',
                      color: cancelReason === r ? 'var(--coral-emergency)' : 'var(--text-main)',
                      fontWeight: cancelReason === r ? '700' : '500',
                      cursor: 'pointer',
                    }}
                  >
                    • {r}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Or specify custom cancellation reason..."
                className="input-clean"
                style={{ width: '100%', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
              >
                Keep Alert Active
              </button>
              <button
                type="button"
                onClick={() => executeCancel(cancelReason)}
                disabled={cancelling}
                className="btn-coral"
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', fontWeight: '800' }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm False Alarm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};