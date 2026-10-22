import React, { useState, useEffect } from 'react';
import { AlertCircle, Radio, CheckCircle } from 'lucide-react';

export const ActiveEmergencyBanner = ({ incident, onResolve }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!incident || incident.status === 'RESOLVED') return;

    const start = new Date(incident.createdAt).getTime();
    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  if (!incident || incident.status === 'RESOLVED') return null;

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

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: '#7f1d1d',
        borderBottom: '2px solid #ef4444',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
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
            backgroundColor: '#ef4444',
            boxShadow: '0 0 10px #ffffff',
            animation: 'pulse 1.2s infinite',
          }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em', color: '#ffffff' }}>
              EMERGENCY ACTIVE: {incident.category}
            </span>
            <span
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#cbd5e1',
              }}
            >
              {incident.incidentCode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#fca5a5' }}>
            <Radio size={12} />
            <span>Streaming coordinates to emergency responders &bull; Elapsed: {formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleResolveClick}
        disabled={resolving}
        style={{
          backgroundColor: '#10b981',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '0.55rem 1.15rem',
          fontSize: '0.85rem',
          fontWeight: '700',
          cursor: resolving ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
        }}
      >
        <CheckCircle size={16} />
        {resolving ? 'Resolving...' : 'I Am Safe (Resolve)'}
      </button>
    </div>
  );
};
