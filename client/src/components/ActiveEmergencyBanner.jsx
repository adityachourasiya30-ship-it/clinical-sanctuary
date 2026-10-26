import React, { useState, useEffect } from 'react';
import { AlertCircle, Radio, CheckCircle, XCircle } from 'lucide-react';

export const ActiveEmergencyBanner = ({ incident, onResolve, onCancel }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
      await onResolve(incident.id || incident._id);
    } finally {
      setResolving(false);
    }
  };

  const handleCancelClick = async () => {
    const reason = window.prompt(
      'Cancel this emergency alert? Please enter a brief reason (e.g., Accidental press, False alarm):',
      'Accidental press / false alarm'
    );
    if (reason === null) return; // user clicked cancel on prompt

    setCancelling(true);
    try {
      if (onCancel) {
        await onCancel(incident.id || incident._id, reason);
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
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
          onClick={handleCancelClick}
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
  );
};
