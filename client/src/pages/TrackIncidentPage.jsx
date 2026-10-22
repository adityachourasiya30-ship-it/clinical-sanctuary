import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { EmergencyMap } from '../components/EmergencyMap';
import { ResponsePipeline } from '../components/ResponsePipeline';
import {
  ShieldAlert,
  MapPin,
  Clock,
  Radio,
  Heart,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const TrackIncidentPage = () => {
  const { incidentCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  const pollIntervalRef = useRef(null);

  const fetchTrackingData = async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      const res = await api.get(`/incidents/track/${incidentCode}`);

      if (res.data.success) {
        const incidentInfo = res.data.incident;
        setData(incidentInfo);
        setLastUpdated(new Date());

        // Fetch hospitals if we have location
        const loc = incidentInfo.latestLocation || incidentInfo.initialLocation;
        if (loc?.latitude && loc?.longitude && hospitals.length === 0) {
          try {
            const hospRes = await api.get(
              `/hospitals/nearby?lat=${loc.latitude}&lng=${loc.longitude}&radius=5000`
            );
            if (hospRes.data.success) {
              setHospitals(hospRes.data.hospitals);
            }
          } catch (e) {
            // Non-blocking
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Emergency incident not found.');
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();

    // 5-second polling interval while emergency is active
    pollIntervalRef.current = setInterval(() => {
      fetchTrackingData(true);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [incidentCode]);

  // Stop polling if status is RESOLVED
  useEffect(() => {
    if (data?.status === 'RESOLVED' && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, [data?.status]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#070b14', color: '#38bdf8' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <div>Connecting to Live Emergency Telemetry Channel...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#070b14', color: '#f8fafc', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px', backgroundColor: '#0f172a', padding: '2rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
          <AlertTriangle size={42} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Tracking Incident Not Found</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            {error || 'This emergency session has either expired or does not exist.'}
          </p>
          <Link
            to="/dashboard"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Go to Clinical Sanctuary
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = data.status === 'RESOLVED';
  const latestLoc = data.latestLocation || data.initialLocation;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Top Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #1e293b',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: isResolved ? '#10b981' : '#ef4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                  Emergency Live Tracking
                </h1>
                <span
                  style={{
                    backgroundColor: '#141e33',
                    border: '1px solid #1e293b',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {data.incidentCode}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Clinical Sanctuary Responder Dispatch Gateway
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: isResolved ? '#10b98120' : '#ef444420',
                border: `1px solid ${isResolved ? '#10b98150' : '#ef444450'}`,
                color: isResolved ? '#10b981' : '#ef4444',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '700',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isResolved ? '#10b981' : '#ef4444',
                }}
              />
              <span>{data.status}</span>
            </div>

            <Link
              to="/dashboard"
              style={{
                fontSize: '0.75rem',
                color: '#38bdf8',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Open Dashboard
            </Link>
          </div>
        </header>

        {/* Live Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Map Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} color="#ef4444" />
                  <strong style={{ fontSize: '0.9rem' }}>Live GPS Coordinates</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#64748b' }}>
                  <Radio size={12} color={isResolved ? '#64748b' : '#10b981'} />
                  <span>
                    {isResolved ? 'Tracking Terminated' : `Live 5s Telemetry (${lastUpdated?.toLocaleTimeString() || ''})`}
                  </span>
                </div>
              </div>

              <EmergencyMap
                centerCoordinates={latestLoc}
                accuracy={latestLoc?.accuracy || 0}
                breadcrumbCoordinates={data.locationUpdates || []}
                hospitals={hospitals}
                height="420px"
              />

              {latestLoc?.latitude && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Current Coordinates: <strong style={{ color: '#f8fafc' }}>{latestLoc.latitude.toFixed(5)}, {latestLoc.longitude.toFixed(5)}</strong>
                  {latestLoc.accuracy ? ` (Accuracy: ±${Math.round(latestLoc.accuracy)}m)` : ''}
                </div>
              )}
            </div>

            <ResponsePipeline
              status={data.status}
              notificationCount={data.notificationLogs?.length || 0}
            />
          </div>

          {/* Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Distress Person Summary */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '1.5rem',
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                INDIVIDUAL IN DISTRESS
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    fontWeight: '800',
                  }}
                >
                  {data.senderName?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc' }}>
                    {data.senderName}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Incident Type: <strong style={{ color: '#f87171' }}>{data.category}</strong> &bull; Activated {new Date(data.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Authorized Medical Information */}
              {data.medicalSummary ? (
                <div style={{ backgroundColor: '#141e33', borderRadius: '10px', padding: '1rem', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <Heart size={16} color="#ef4444" />
                    <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Authorized Medical Summary</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Blood Group: </span>
                      <strong style={{ color: '#ef4444' }}>{data.medicalSummary.bloodGroup || 'Not Specified'}</strong>
                    </div>

                    {data.medicalSummary.allergies?.length > 0 && (
                      <div>
                        <span style={{ color: '#64748b' }}>Known Allergies: </span>
                        <strong style={{ color: '#fca5a5' }}>{data.medicalSummary.allergies.join(', ')}</strong>
                      </div>
                    )}

                    {data.medicalSummary.medicalConditions?.length > 0 && (
                      <div>
                        <span style={{ color: '#64748b' }}>Conditions: </span>
                        <strong style={{ color: '#93c5fd' }}>{data.medicalSummary.medicalConditions.join(', ')}</strong>
                      </div>
                    )}

                    {data.medicalSummary.emergencyNotes && (
                      <div style={{ marginTop: '0.35rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                        "{data.medicalSummary.emergencyNotes}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                  No medical disclosure authorized by user for public tracking link.
                </div>
              )}
            </div>

            {/* Notification logs list */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                padding: '1.25rem',
              }}
            >
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                Dispatched Contact Alerts ({data.notificationLogs?.length || 0})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.notificationLogs?.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#f8fafc' }}>{log.contactName || 'Primary Contact'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.recipientPhone}</div>
                    </div>

                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        backgroundColor: log.status === 'SENT' ? '#10b98120' : log.status === 'SIMULATED' ? '#38bdf820' : '#ef444420',
                        color: log.status === 'SENT' ? '#10b981' : log.status === 'SIMULATED' ? '#38bdf8' : '#ef4444',
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}

                {(!data.notificationLogs || data.notificationLogs.length === 0) && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    No SMS dispatches recorded for this alert.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
