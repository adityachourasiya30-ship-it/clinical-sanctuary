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
          setIncidents(res.data.incidents);
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
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#8b5cf620',
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <History size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f8fafc' }}>
            Emergency Incident History
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Immutable audit log of all emergency alerts, GPS breadcrumbs, and captured audio logs
          </p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#ef444420', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Incident List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {incidents.map((inc) => {
          const isResolved = inc.status === 'RESOLVED';

          return (
            <div
              key={inc._id}
              style={{
                backgroundColor: '#0f172a',
                border: isResolved ? '1px solid #1e293b' : '2px solid #ef4444',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: isResolved ? 'none' : '0 0 20px rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      color: '#f8fafc',
                      backgroundColor: '#141e33',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #1e293b',
                    }}
                  >
                    {inc.incidentCode}
                  </span>

                  <span
                    style={{
                      backgroundColor: inc.category === 'MEDICAL' ? '#ef444420' : '#f59e0b20',
                      color: inc.category === 'MEDICAL' ? '#f87171' : '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                    }}
                  >
                    {inc.category}
                  </span>

                  <span
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                    }}
                  >
                    {inc.triggerType} Trigger
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      backgroundColor: isResolved ? '#10b98120' : '#ef444420',
                      color: isResolved ? '#10b981' : '#ef4444',
                      border: `1px solid ${isResolved ? '#10b98140' : '#ef444440'}`,
                      padding: '3px 9px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                    }}
                  >
                    {inc.status}
                  </span>

                  <Link
                    to={`/track/${inc.incidentCode}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#38bdf8',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    <span>View Map</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>

              {/* Timestamps & Duration */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  marginBottom: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>TRIGGERED</span>
                  <span>{formatDate(inc.createdAt)}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>RESOLVED</span>
                  <span>{formatDate(inc.resolvedAt)}</span>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>DURATION</span>
                  <span>{getDuration(inc.createdAt, inc.resolvedAt)}</span>
                </div>
              </div>

              {/* Initial Location */}
              {inc.initialLocation?.latitude && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                  <MapPin size={14} color="#ef4444" />
                  <span>
                    Initial GPS: {inc.initialLocation.latitude.toFixed(5)}, {inc.initialLocation.longitude.toFixed(5)}
                    {inc.initialLocation.accuracy ? ` (±${Math.round(inc.initialLocation.accuracy)}m)` : ''}
                  </span>
                </div>
              )}

              {/* Audio Evidence Player (Milestone 4 & 5 Requirement) */}
              {inc.audioEvidence?.fileUrl && (
                <div
                  style={{
                    backgroundColor: '#141e33',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mic size={16} color="#ef4444" />
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc', display: 'block' }}>
                        Emergency Audio Evidence Log
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        AES-256 Encrypted &bull; Duration: {inc.audioEvidence.duration || 0}s
                      </span>
                    </div>
                  </div>

                  <audio
                    controls
                    src={inc.audioEvidence.fileUrl}
                    style={{ height: '32px', maxWidth: '280px' }}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </div>
          );
        })}

        {incidents.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px dashed #1e293b' }}>
            <History size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
              No Emergency Incidents Recorded
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              When you activate the SOS button, full timestamps, live GPS tracking logs, and evidence recordings will be archived here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
