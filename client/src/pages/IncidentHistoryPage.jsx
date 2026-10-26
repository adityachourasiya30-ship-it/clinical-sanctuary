import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  History,
  ShieldAlert,
  Clock,
  MapPin,
  Mic,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Play,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const IncidentHistoryPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/incidents/history');
        if (res.data.success) {
          setIncidents(res.data.incidents || []);
        }
      } catch (err) {
        setError('Failed to load incident history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDuration = (start, end) => {
    if (!start || !end) return 'Active / In progress';
    const diffSec = Math.floor((new Date(end) - new Date(start)) / 1000);
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card-clean" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--teal-subtle)',
            border: '1px solid var(--teal-primary)',
            color: 'var(--teal-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <History size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Emergency Incident Audit Log
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Chronological records of all activated SOS alerts, location breadcrumbs, responder dispatches, and audio logs
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--coral-subtle)',
            border: '1px solid var(--coral-emergency)',
            color: '#FECDD3',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Incident List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--teal-primary)' }}>
            Loading incident history...
          </div>
        ) : incidents.length === 0 ? (
          <div className="card-clean" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <History size={38} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>No Incidents Logged</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Your account has zero active or historic emergency activations.
            </p>
          </div>
        ) : (
          incidents.map((inc) => {
            const isResolved = inc.status === 'RESOLVED';
            const isCancelled = inc.status === 'CANCELLED';

            return (
              <div
                key={inc._id}
                className="card-clean"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  borderLeft: isResolved
                    ? '4px solid var(--status-success)'
                    : isCancelled
                    ? '4px solid var(--border-subtle)'
                    : '4px solid var(--coral-emergency)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: inc.category === 'MEDICAL' ? 'var(--coral-subtle)' : 'var(--teal-subtle)',
                        color: inc.category === 'MEDICAL' ? 'var(--coral-emergency)' : 'var(--teal-primary)',
                        border: `1px solid ${inc.category === 'MEDICAL' ? 'var(--coral-emergency)' : 'var(--teal-border)'}`,
                      }}
                    >
                      {inc.category}
                    </span>

                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {inc.incidentCode}
                    </strong>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Trigger: <strong>{inc.triggerType}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: isResolved ? 'var(--status-success)' : isCancelled ? 'var(--text-muted)' : 'var(--coral-emergency)',
                        backgroundColor: isResolved ? 'var(--status-success-bg)' : isCancelled ? 'var(--surface-elevated)' : 'var(--coral-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        border: `1px solid ${isResolved ? 'var(--status-success)' : isCancelled ? 'var(--border-subtle)' : 'var(--coral-emergency)'}`,
                      }}
                    >
                      {inc.status}
                    </span>

                    <Link
                      to={`/track/${inc.incidentCode}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      View Radar <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="var(--teal-primary)" />
                    <span>Activated: {formatDate(inc.createdAt)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={14} color={isResolved ? 'var(--status-success)' : 'var(--text-muted)'} />
                    <span>Duration: {getDuration(inc.createdAt, inc.resolvedAt || inc.cancelledAt)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="var(--teal-primary)" />
                    <span>Location: {inc.initialLocation?.address || `Lat: ${inc.initialLocation?.latitude || 'N/A'}`}</span>
                  </div>
                </div>

                {inc.cancellationReason && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface-elevated)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)' }}>
                    Cancellation Reason: <em>{inc.cancellationReason}</em>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
