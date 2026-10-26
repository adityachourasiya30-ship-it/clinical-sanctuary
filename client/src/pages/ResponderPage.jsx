import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import {
  Ambulance,
  ShieldCheck,
  CheckCircle,
  Clock,
  MapPin,
  Heart,
  PhoneCall,
  Radio,
  Navigation,
  AlertTriangle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

export const ResponderPage = () => {
  const { user } = useAuth();
  const { location, refreshLocation } = useGeolocation();

  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIncident, setActiveIncident] = useState(null);
  const [medicalSummary, setMedicalSummary] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [dutyLoading, setDutyLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch responder profile and available incidents
  const loadResponderData = async () => {
    setLoading(true);
    try {
      const [profRes, incRes] = await Promise.all([
        api.get('/responder/profile'),
        api.get('/responder/incidents'),
      ]);

      if (profRes.data.success) {
        setProfile(profRes.data.profile);
      }

      if (incRes.data.success) {
        setIncidents(incRes.data.incidents || []);
        // Check if responder is already assigned to an ongoing incident
        const assigned = incRes.data.incidents.find(
          (inc) =>
            inc.assignedResponder?._id === user.id ||
            inc.assignedResponder === user.id ||
            inc.assignedResponder?._id === user._id ||
            inc.assignedResponder === user._id
        );
        if (assigned && !['RESOLVED', 'CANCELLED'].includes(assigned.status)) {
          setActiveIncident(assigned);
          fetchMedicalSummary(assigned._id);
        }
      }
    } catch (err) {
      console.warn('Failed to load responder data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponderData();
  }, [user]);

  const fetchMedicalSummary = async (incidentId) => {
    try {
      const res = await api.get(`/responder/incidents/${incidentId}/medical`);
      if (res.data.success) {
        setMedicalSummary(res.data.shared ? res.data.summary : null);
      }
    } catch (err) {
      console.warn('Medical summary fetch failed:', err.message);
    }
  };

  // Toggle on-duty availability
  const toggleDutyStatus = async () => {
    setDutyLoading(true);
    try {
      const nextStatus = !profile?.isAvailable;
      const res = await api.post('/responder/availability', {
        isAvailable: nextStatus,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      if (res.data.success) {
        setProfile(res.data.profile);
        setMessage(`Duty status updated to ${nextStatus ? 'ON DUTY (Active)' : 'OFF DUTY'}`);
      }
    } catch (err) {
      console.error('Failed to update duty status:', err);
    } finally {
      setDutyLoading(false);
    }
  };

  // Accept an emergency dispatch
  const handleAcceptIncident = async (incidentId) => {
    setStatusActionLoading(true);
    try {
      const res = await api.post(`/responder/incidents/${incidentId}/accept`);
      if (res.data.success) {
        setActiveIncident(res.data.incident);
        fetchMedicalSummary(incidentId);
        setMessage('Emergency Incident accepted! You are now designated as active first responder.');
        loadResponderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept incident.');
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Update status (EN_ROUTE, ARRIVED, RESOLVED)
  const handleUpdateStatus = async (status) => {
    if (!activeIncident) return;
    setStatusActionLoading(true);
    try {
      const incidentId = activeIncident.id || activeIncident._id;
      const res = await api.post(`/responder/incidents/${incidentId}/status`, { status });
      if (res.data.success) {
        if (status === 'RESOLVED') {
          setActiveIncident(null);
          setMedicalSummary(null);
          setMessage('Emergency response concluded and resolved.');
        } else {
          setActiveIncident(res.data.incident);
          setMessage(`Status transitioned to: ${status}`);
        }
        loadResponderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Responder Status Card */}
      <div className="card-clean" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--coral-subtle)',
              border: '1px solid var(--coral-emergency)',
              color: 'var(--coral-emergency)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ambulance size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Field Responder Operations Desk
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: 'var(--status-success)',
                  backgroundColor: 'var(--status-success-bg)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                VERIFIED STATUS
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Responder: <strong>{user.name}</strong> &bull; Badge: <strong>{profile?.badgeNumber || 'EMS-108'}</strong> &bull; Unit: <strong>{profile?.vehicleType || 'AMBULANCE'}</strong>
            </div>
          </div>
        </div>

        {/* On Duty Status Toggle Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={toggleDutyStatus}
            disabled={dutyLoading}
            style={{
              backgroundColor: profile?.isAvailable ? 'var(--status-success)' : 'var(--surface-elevated)',
              color: profile?.isAvailable ? '#081C13' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: profile?.isAvailable ? 'var(--status-success)' : 'var(--border-subtle)',
              padding: '0.6rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Radio size={14} className={profile?.isAvailable ? 'animate-emergency-pulse' : ''} />
            {dutyLoading ? 'Updating...' : profile?.isAvailable ? 'ON DUTY (AVAILABLE)' : 'OFF DUTY (OFFLINE)'}
          </button>

          <button
            type="button"
            onClick={loadResponderData}
            className="btn-secondary"
            style={{ padding: '0.6rem', fontSize: '0.8rem' }}
            title="Refresh Feed"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            backgroundColor: 'var(--teal-subtle)',
            border: '1px solid var(--teal-primary)',
            color: 'var(--teal-primary)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{message}</span>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            &times;
          </button>
        </div>
      )}

      {/* Active Incident Operational Control (When Assigned) */}
      {activeIncident && (
        <div
          className="card-clean"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '2px solid var(--coral-emergency)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-tag" style={{ backgroundColor: 'var(--coral-subtle)', color: 'var(--coral-emergency)', border: '1px solid var(--coral-emergency)' }}>
                ACTIVE ASSIGNMENT
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Case: {activeIncident.incidentCode} ({activeIncident.category})
              </h3>
            </div>

            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--teal-primary)' }}>
              CURRENT STATUS: {activeIncident.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>PATIENT LOCATION</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="var(--teal-primary)" />
                {activeIncident.initialLocation?.address || `Lat: ${activeIncident.initialLocation?.latitude}, Lng: ${activeIncident.initialLocation?.longitude}`}
              </div>

              {activeIncident.initialLocation?.latitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeIncident.initialLocation.latitude},${activeIncident.initialLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                >
                  <Navigation size={13} /> Open GPS Navigation
                </a>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>EMERGENCY MEDICAL SNAPSHOT</div>
              {medicalSummary ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                  <div>Blood Group: <strong style={{ color: 'var(--coral-emergency)' }}>{medicalSummary.bloodGroup}</strong></div>
                  <div>Allergies: <strong>{medicalSummary.allergies?.join(', ') || 'None recorded'}</strong></div>
                  <div>Notes: <em>{medicalSummary.emergencyNotes || 'None'}</em></div>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Patient has opted out of sharing detailed medical history with responders.
                </div>
              )}
            </div>
          </div>

          {/* Incident State Action Controls */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Update Tactical Status:</span>

            {activeIncident.status === 'ASSIGNED' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('EN_ROUTE')}
                disabled={statusActionLoading}
                className="btn-teal"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
              >
                Mark EN ROUTE to Scene
              </button>
            )}

            {activeIncident.status === 'EN_ROUTE' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('ARRIVED')}
                disabled={statusActionLoading}
                className="btn-coral"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
              >
                Mark ARRIVED on Scene
              </button>
            )}

            {['ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(activeIncident.status) && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={statusActionLoading}
                style={{
                  backgroundColor: 'var(--status-success)',
                  color: '#081C13',
                  fontWeight: '800',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCircle size={15} />
                Conclude & Resolve Case
              </button>
            )}
          </div>
        </div>
      )}

      {/* Available Incident Discovery Queue */}
      <div className="card-clean">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Nearby Emergency Incidents Queue
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Incidents needing immediate field dispatch or currently active
            </span>
          </div>

          <span className="badge-tag" style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>
            {incidents.length} Reported
          </span>
        </div>

        {incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={36} color="var(--status-success)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>Zero Active Incidents</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All regional emergencies resolved or dispatched.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {incidents.map((inc) => {
              const isMine =
                inc.assignedResponder?._id === user.id ||
                inc.assignedResponder === user.id ||
                inc.assignedResponder?._id === user._id ||
                inc.assignedResponder === user._id;

              return (
                <div
                  key={inc._id}
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: inc.category === 'MEDICAL' ? 'var(--coral-subtle)' : 'var(--teal-subtle)',
                          color: inc.category === 'MEDICAL' ? 'var(--coral-emergency)' : 'var(--teal-primary)',
                        }}
                      >
                        {inc.category}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{inc.incidentCode}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({new Date(inc.createdAt).toLocaleTimeString()})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={12} color="var(--teal-primary)" />
                      {inc.initialLocation?.address || `Lat: ${inc.initialLocation?.latitude}, Lng: ${inc.initialLocation?.longitude}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: inc.status === 'RESOLVED' ? 'var(--status-success)' : 'var(--coral-emergency)',
                      }}
                    >
                      {inc.status}
                    </span>

                    {!inc.assignedResponder && (
                      <button
                        type="button"
                        onClick={() => handleAcceptIncident(inc._id)}
                        disabled={statusActionLoading}
                        className="btn-teal"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                      >
                        Accept Incident
                      </button>
                    )}

                    {isMine && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--teal-primary)', fontWeight: '700' }}>
                        Assigned to You
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
