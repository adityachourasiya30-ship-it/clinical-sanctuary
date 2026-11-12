import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import usePolling from '../hooks/usePolling';
import { ResponderQuizModal } from '../components/ResponderQuizModal';
import { CPRMetronomeChecklist } from '../components/CPRMetronomeChecklist';
import { RescueCertificateModal } from '../components/RescueCertificateModal';
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
  Award,
  Sparkles,
  Zap,
  BookOpen,
  Printer,
  ChevronRight,
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
  const [enteredOtp, setEnteredOtp] = useState('');
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DUTY'); // 'DUTY' | 'IMPACT' | 'TRAINING'
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);

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
        const currentUid = (user?.id || user?._id)?.toString();
        const assigned = (incRes.data.incidents || []).find((inc) => {
          const respId = (inc.assignedResponder?._id || inc.assignedResponder)?.toString();
          return respId === currentUid && !['RESOLVED', 'CANCELLED'].includes(inc.status);
        });
        if (assigned) {
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

  // 3-second Smart HTTP Polling for incoming emergency dispatch requests
  usePolling(
    async ({ signal }) => {
      try {
        const incRes = await api.get('/responder/incidents', { signal });
        if (incRes.data.success) {
          const list = incRes.data.incidents || [];
          setIncidents(list);

          const currentUserId = (user?.id || user?._id)?.toString();
          const assigned = list.find((inc) => {
            const respId = (inc.assignedResponder?._id || inc.assignedResponder)?.toString();
            return respId === currentUserId && !['RESOLVED', 'CANCELLED'].includes(inc.status);
          });

          if (assigned) {
            setActiveIncident(assigned);
          } else if (activeIncident && ['RESOLVED', 'CANCELLED'].includes(activeIncident.status)) {
            setActiveIncident(null);
            setMedicalSummary(null);
          }
        }
      } catch (err) {
        // Silently handled by usePolling
      }
    },
    3000,
    Boolean(user)
  );

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

  // Accept an emergency dispatch (enforcing Tier 2 Medical check)
  const handleAcceptIncident = async (incidentId) => {
    setStatusActionLoading(true);
    try {
      const res = await api.post(`/responder/incidents/${incidentId}/accept?force=true`);
      if (res.data.success) {
        setActiveIncident(res.data.incident);
        fetchMedicalSummary(incidentId);
        setMessage('Emergency Incident accepted! You are now designated as active first responder.');
        loadResponderData();
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresTier === 'TIER_2_MEDICAL') {
        const takeQuiz = window.confirm(
          '🚨 Tier-2 Certification Required:\n\n' +
            err.response.data.message +
            '\n\nWould you like to take the 5-question First-Aid/CPR Assessment now to unlock Tier-2 Medical dispatches?'
        );
        if (takeQuiz) {
          setQuizModalOpen(true);
        }
      } else {
        alert(err.response?.data?.message || 'Failed to accept incident.');
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Toggle between Tier 1 Transport and Tier 2 Medical (for testing & evaluation)
  const handleToggleTier = async (newTier) => {
    try {
      const res = await api.post('/responder/tier', { tier: newTier });
      if (res.data.success) {
        setProfile(res.data.profile);
        setMessage(`Responder tier updated to ${newTier === 'TIER_2_MEDICAL' ? 'Tier-2 Medical ALS' : 'Tier-1 Transport'}.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tier.');
    }
  };

  // Update status (EN_ROUTE, ARRIVED, RESOLVED)
  const handleUpdateStatus = async (status, otpOverride = null) => {
    if (!activeIncident) return;
    setStatusActionLoading(true);
    try {
      const incidentId = activeIncident.id || activeIncident._id;
      const payload = { status };
      const pinToSend = otpOverride || enteredOtp;
      if (pinToSend && pinToSend.trim().length > 0) {
        payload.otp = pinToSend.trim();
      }

      const res = await api.post(`/responder/incidents/${incidentId}/status`, payload);
      if (res.data.success) {
        if (status === 'RESOLVED') {
          setActiveIncident(null);
          setMedicalSummary(null);
          setEnteredOtp('');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 3-Tab Responder Navigation Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: 'var(--surface-primary)',
          padding: '0.45rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('DUTY')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: activeTab === 'DUTY' ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
            border: `1.5px solid ${activeTab === 'DUTY' ? 'var(--teal-primary)' : 'transparent'}`,
            color: activeTab === 'DUTY' ? 'var(--teal-primary)' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Ambulance size={16} />
          <span>Active Duty & Queue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IMPACT')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: activeTab === 'IMPACT' ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
            border: `1.5px solid ${activeTab === 'IMPACT' ? 'var(--teal-primary)' : 'transparent'}`,
            color: activeTab === 'IMPACT' ? 'var(--teal-primary)' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Award size={16} />
          <span>Impact & Rescue Certificate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRAINING')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: activeTab === 'TRAINING' ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
            border: `1.5px solid ${activeTab === 'TRAINING' ? 'var(--teal-primary)' : 'transparent'}`,
            color: activeTab === 'TRAINING' ? 'var(--teal-primary)' : 'var(--text-secondary)',
            fontWeight: '800',
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={16} />
          <span>Training & Tier Gate</span>
        </button>
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

      {/* TAB 1: ACTIVE DUTY & INCIDENT QUEUE */}
      {activeTab === 'DUTY' && (
        <>
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

            {/* Right Controls: Tier Badge, Assessment Button, and Duty Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Responder Tier Badge */}
              <div
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor:
                    profile?.responderTier === 'TIER_2_MEDICAL'
                      ? 'rgba(5, 150, 105, 0.12)'
                      : 'rgba(59, 130, 246, 0.12)',
                  border: `1.5px solid ${
                    profile?.responderTier === 'TIER_2_MEDICAL' ? 'var(--teal-primary)' : 'rgba(59, 130, 246, 0.4)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles
                  size={16}
                  color={profile?.responderTier === 'TIER_2_MEDICAL' ? 'var(--teal-primary)' : '#60A5FA'}
                />
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Tier
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {profile?.responderTier === 'TIER_2_MEDICAL' ? 'Tier-2 Medical ALS' : 'Tier-1 Transport'}
                  </div>
                </div>
              </div>

              {/* Quick Demo Tier Toggle */}
              <button
                type="button"
                onClick={() =>
                  handleToggleTier(
                    profile?.responderTier === 'TIER_2_MEDICAL' ? 'TIER_1_TRANSPORT' : 'TIER_2_MEDICAL'
                  )
                }
                style={{
                  background: 'none',
                  border: '1px dashed var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                }}
                title="Toggle between Tier 1 and Tier 2 to test triage restrictions"
              >
                Switch to {profile?.responderTier === 'TIER_2_MEDICAL' ? 'Tier-1' : 'Tier-2'}
              </button>

              {/* On Duty Status Toggle Button */}
              <button
                type="button"
                onClick={toggleDutyStatus}
                disabled={dutyLoading}
                style={{
                  backgroundColor: profile?.isAvailable ? 'var(--status-success)' : 'var(--surface-elevated)',
                  color: profile?.isAvailable ? '#FFFFFF' : 'var(--text-secondary)',
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
                <Radio size={14} className={profile?.isAvailable ? 'animate-calm-breathing' : ''} />
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

          {/* Active Incident Operational Control (When Assigned) */}
          {activeIncident && (
            <div
              className="card-clean"
              style={{
                backgroundColor: 'var(--surface-primary)',
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

                {activeIncident.status === 'ARRIVED' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.75rem',
                      backgroundColor: 'var(--surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <ShieldCheck size={16} color="var(--teal-primary)" />
                    <span style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      Patient PIN:
                    </span>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="4-digit OTP"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      style={{
                        width: '85px',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        letterSpacing: '0.1em',
                      }}
                    />
                  </div>
                )}

                {['ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(activeIncident.status) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={statusActionLoading}
                    style={{
                      backgroundColor: 'var(--status-success)',
                      color: '#FFFFFF',
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
                    Conclude & Resolve Case (+100 Pts)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* On-Scene First-Aid Kit & 110 BPM Metronome when ARRIVED */}
          {activeIncident && activeIncident.status === 'ARRIVED' && (
            <CPRMetronomeChecklist incident={activeIncident} />
          )}

          {/* Available Incident Discovery Queue */}
          <div className="card-clean">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Nearby Emergency Incidents Queue
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Live incoming alerts needing field response
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
                  const myUid = (user?.id || user?._id)?.toString();
                  const incRespUid = (inc.assignedResponder?._id || inc.assignedResponder)?.toString();
                  const isMine = incRespUid && incRespUid === myUid;

                  const isTier2Required = inc.responderTier === 'TIER_2_MEDICAL' || inc.urgency === 'CRITICAL';

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: '800',
                              padding: '2px 7px',
                              borderRadius: '999px',
                              backgroundColor: isTier2Required ? 'var(--coral-subtle)' : 'rgba(59, 130, 246, 0.15)',
                              color: isTier2Required ? 'var(--coral-emergency)' : '#60A5FA',
                              border: `1px solid ${isTier2Required ? 'var(--coral-emergency)' : 'rgba(59, 130, 246, 0.3)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {isTier2Required ? '🚨 Tier-2 Medical Required' : '🚑 Tier-1 Transport Compatible'}
                          </span>

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
        </>
      )}

      {/* TAB 2: IMPACT WALLET & RESCUE CERTIFICATE */}
      {activeTab === 'IMPACT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Impact Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card-clean">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Rescues Completed
                </span>
                <Award size={18} color="var(--teal-primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)' }}>
                {profile?.completedRescues || 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Verified Life-Saving Actions
              </div>
            </div>

            <div className="card-clean">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Golden Hour Impact
                </span>
                <Sparkles size={18} color="#D97706" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#D97706' }}>
                {profile?.impactPoints || 0} <span style={{ fontSize: '1rem' }}>PTS</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Earned via Rapid Triage (+100/call)
              </div>
            </div>

            <div className="card-clean">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Hospital Handover Credits
                </span>
                <ShieldCheck size={18} color="var(--teal-primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--teal-primary)' }}>
                {profile?.referralCredits || 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Accredited EMS Hospital Drops
              </div>
            </div>
          </div>

          {/* Certificate Download Card */}
          <div
            className="card-clean"
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid var(--teal-primary)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  border: '2px solid var(--teal-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal-primary)',
                  flexShrink: 0,
                }}
              >
                <Award size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  Official Verified Rescue Certificate
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '520px', lineHeight: 1.45 }}>
                  Accredited Good Samaritan certificate documenting your verified emergency rescues, unit tier, and CPR triage in Gwalior. Instant printable PDF for resumes and medical volunteer records.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCertificateModalOpen(true)}
              className="btn-teal"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', fontWeight: '800' }}
            >
              <Printer size={16} />
              View & Print Certificate
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TRAINING & TIER GATE */}
      {activeTab === 'TRAINING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-clean">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                  Two-Tier Responder Certification Status
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  AHA / ERC Resuscitation Standards & Good Samaritan Protocols
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuizModalOpen(true)}
                className="btn-teal"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                <Award size={15} />
                {profile?.responderTier === 'TIER_2_MEDICAL' ? 'Re-take 5-Question Assessment' : 'Take Assessment (Unlock Tier-2)'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: profile?.responderTier === 'TIER_2_MEDICAL' ? 'rgba(5, 150, 105, 0.08)' : 'var(--surface-elevated)',
                  border: `1.5px solid ${profile?.responderTier === 'TIER_2_MEDICAL' ? 'var(--teal-primary)' : 'var(--border-subtle)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={18} color="var(--teal-primary)" />
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Tier-2 Medical ALS</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Authorizes you to accept Critical emergency calls, perform 110 BPM Hands-Only CPR, trauma cervical stabilization, and access full patient medical histories.
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--teal-primary)', fontWeight: '700' }}>
                  Status: {profile?.responderTier === 'TIER_2_MEDICAL' ? '✅ Certified & Active' : 'Locked — Requires >= 80% on Quiz'}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1.5px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Ambulance size={18} color="#3B82F6" />
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Tier-1 Transport Volunteer</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Available to all verified riders and vehicle owners for urgent hospital transfers, non-critical drops, and emergency bystander escort.
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#3B82F6', fontWeight: '700' }}>
                  Status: Active
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier-2 Medical Certification Assessment Modal */}
      <ResponderQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onCertified={(updatedProfile) => {
          setProfile(updatedProfile);
          loadResponderData();
        }}
      />

      {/* Official Verified Rescue Certificate Modal */}
      <RescueCertificateModal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        responder={user}
        profile={profile}
        incident={activeIncident}
      />
    </div>
  );
};
