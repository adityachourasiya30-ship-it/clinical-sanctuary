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
  PhoneCall,
  UserCheck,
  Ambulance,
  ExternalLink,
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

        const loc = incidentInfo.latestLocation || incidentInfo.initialLocation;
        if (loc?.latitude && loc?.longitude && hospitals.length === 0) {
          try {
            const hospRes = await api.get(
              `/hospitals/nearby?lat=${loc.latitude}&lng=${loc.longitude}&radius=6000`
            );
            if (hospRes.data.success) {
              setHospitals(hospRes.data.hospitals || []);
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

  useEffect(() => {
    if (['RESOLVED', 'CANCELLED'].includes(data?.status) && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, [data?.status]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', color: 'var(--teal-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <div style={{ fontWeight: '700' }}>Connecting to Live Emergency Telemetry Channel...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', padding: '1.5rem' }}>
        <div className="card-clean" style={{ textAlign: 'center', maxWidth: '440px' }}>
          <AlertTriangle size={42} color="var(--coral-emergency)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Tracking Incident Not Found
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'This emergency session has expired or does not exist.'}
          </p>
          <Link to="/dashboard" className="btn-teal" style={{ justifyContent: 'center' }}>
            Return to Clinical Sanctuary
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = data.status === 'RESOLVED';
  const isCancelled = data.status === 'CANCELLED';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Official Top Broadcast Bar */}
      <header
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isResolved ? 'var(--status-success)' : isCancelled ? 'var(--text-muted)' : 'var(--coral-emergency)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: !isResolved && !isCancelled ? '0 0 14px var(--coral-glow)' : 'none',
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Live Emergency Radar &bull; {data.incidentCode}
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: isResolved ? 'var(--status-success)' : isCancelled ? 'var(--text-muted)' : 'var(--coral-emergency)',
                  backgroundColor: isResolved ? 'var(--status-success-bg)' : isCancelled ? 'var(--surface-elevated)' : 'var(--coral-subtle)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: `1px solid ${isResolved ? 'var(--status-success)' : isCancelled ? 'var(--border-subtle)' : 'var(--coral-emergency)'}`,
                }}
              >
                {data.status}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Category: <strong>{data.category}</strong> &bull; Patient: <strong>{data.senderName}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href="tel:112"
            className="btn-coral"
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}
          >
            <PhoneCall size={14} /> Direct Dial 112
          </a>

          <Link to="/dashboard" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.45rem 0.85rem' }}>
            Portal
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1360px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Response Pipeline */}
        <ResponsePipeline
          status={data.status}
          notificationCount={data.notificationLogs?.length || 0}
          isSimulated={true}
          assignedResponder={data.assignedResponder}
        />

        {/* Assigned Responder Operational Banner */}
        {data.assignedResponder && (
          <div
            className="card-clean"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '2px solid var(--teal-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--teal-subtle)',
                  color: 'var(--teal-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ambulance size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Assigned Unit: {data.assignedResponder.name} ({data.assignedResponder.vehicleType})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Badge: <strong>{data.assignedResponder.badgeNumber}</strong> &bull; Agency: {data.assignedResponder.organization}
                </div>
              </div>
            </div>

            {data.assignedResponder.phone && (
              <a href={`tel:${data.assignedResponder.phone}`} className="btn-teal" style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}>
                <PhoneCall size={14} /> Call Responder
              </a>
            )}
          </div>
        )}

        {/* Radar & Patient Details Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Map Stream */}
          <div className="card-clean" style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Radio size={16} color="var(--teal-primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Active Coordinates Stream
                </h3>
              </div>

              {lastUpdated && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Refreshed: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minHeight: '420px' }}>
              <EmergencyMap
                userLocation={data.latestLocation || data.initialLocation}
                breadcrumbs={data.locationUpdates || []}
                hospitals={hospitals}
                isEmergency={!isResolved && !isCancelled}
              />
            </div>
          </div>

          {/* Right Information Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Medical Summary (if consented) */}
            {data.medicalSummary && (
              <div className="card-clean" style={{ borderLeft: '4px solid var(--coral-emergency)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Heart size={18} color="var(--coral-emergency)" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      Patient Emergency Card
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: 'var(--coral-emergency)',
                      backgroundColor: 'var(--coral-subtle)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    Blood: {data.medicalSummary.bloodGroup}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>Allergies: <strong>{data.medicalSummary.allergies?.join(', ') || 'None recorded'}</strong></div>
                  <div>Conditions: <strong>{data.medicalSummary.medicalConditions?.join(', ') || 'None recorded'}</strong></div>
                  <div>Clinical Notes: <em>{data.medicalSummary.emergencyNotes || 'No notes'}</em></div>
                </div>
              </div>
            )}

            {/* Notification Dispatches Record */}
            <div className="card-clean">
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Automated Contact Notifications ({data.notificationLogs?.length || 0})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.notificationLogs?.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div>
                      <strong>{log.contactName || log.recipientPhone}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({log.recipientPhone})
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        color: log.status === 'SENT' ? 'var(--status-success)' : 'var(--teal-primary)',
                      }}
                    >
                      {log.status === 'SIMULATED' ? 'SIMULATED (Dev)' : log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Audit Trail */}
            {data.timelineEvents?.length > 0 && (
              <div className="card-clean">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  Incident Audit Timeline
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {data.timelineEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-subtle)',
                        paddingBottom: '0.35rem',
                      }}
                    >
                      <span style={{ color: 'var(--teal-primary)', fontWeight: '700' }}>
                        [{new Date(evt.timestamp).toLocaleTimeString()}]
                      </span>{' '}
                      {evt.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
