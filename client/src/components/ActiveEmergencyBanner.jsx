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
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backgroundColor: '#7A1C18',
          borderBottom: '2px solid var(--coral-emergency)',
          boxShadow: 'var(--shadow-lg)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--coral-emergency)',
              boxShadow: '0 0 12px #FFFFFF',
              animation: 'emergency-pulse 1.4s infinite',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.04em', color: '#FFFFFF' }}>
                ACTIVE INCIDENT: {incident.category}
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-main)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {incident.incidentCode}
              </span>
              <span
                style={{
                  backgroundColor: 'var(--teal-subtle)',
                  color: 'var(--teal-primary)',
                  border: '1px solid var(--teal-border)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                }}
              >
                STATUS: {incident.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#FECDD3', marginTop: '2px' }}>
              <Radio size={12} />
              <span>Broadcasting real-time coordinates &bull; Elapsed: {formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            disabled={cancelling || resolving}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: '#FECDD3',
              border: '1px solid var(--coral-emergency)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'background 0.15s ease',
            }}
          >
            <XCircle size={15} />
            {cancelling ? 'Cancelling...' : 'Cancel (False Alarm)'}
          </button>

          <button
            type="button"
            onClick={handleResolveClick}
            disabled={resolving || cancelling}
            style={{
              backgroundColor: 'var(--status-success)',
              color: '#071A12',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: '800',
              cursor: resolving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
              transition: 'transform 0.1s ease',
            }}
          >
            <CheckCircle size={16} />
            {resolving ? 'Resolving...' : 'I Am Safe (Resolve)'}
          </button>
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