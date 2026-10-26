import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { SOSButton } from '../components/SOSButton';
import { IncidentCategorySelector } from '../components/IncidentCategorySelector';
import { ResponsePipeline } from '../components/ResponsePipeline';
import { UberResponseCard } from '../components/UberResponseCard';
import { EmergencyMap } from '../components/EmergencyMap';
import { ActiveEmergencyBanner } from '../components/ActiveEmergencyBanner';
import { VoiceConsentModal } from '../components/VoiceConsentModal';
import {
  Users,
  Heart,
  MapPin,
  Mic,
  MicOff,
  ShieldCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  RefreshCw,
  PhoneCall,
  Building2,
  StopCircle,
  Play,
  Trash2,
  CheckCircle,
  Siren,
  Ambulance,
  XCircle,
  Smartphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { location, error: gpsError, loading: gpsLoading, refreshLocation } = useGeolocation();
  const {
    isRecording,
    audioBlob,
    duration: audioDuration,
    startRecording,
    stopRecording,
    clearRecording,
    uploadEvidence,
  } = useAudioRecorder();

  const [selectedCategory, setSelectedCategory] = useState('MEDICAL');
  const [activeIncident, setActiveIncident] = useState(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [locationBreadcrumbs, setLocationBreadcrumbs] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [medicalProfile, setMedicalProfile] = useState(null);
  const [voiceConsentModalOpen, setVoiceConsentModalOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [notificationResults, setNotificationResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);

  const trackingIntervalRef = useRef(null);

  // Load profile, contacts, and active incident on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [contactsRes, medRes, historyRes] = await Promise.all([
          api.get('/contacts'),
          api.get('/medical'),
          api.get('/incidents/history'),
        ]);

        if (contactsRes.data.success) {
          setContactsCount(contactsRes.data.count);
        }
        if (medRes.data.success) {
          setMedicalProfile(medRes.data.profile);
        }

        // Check for any active unresolved incident
        if (historyRes.data.success && historyRes.data.incidents.length > 0) {
          const latest = historyRes.data.incidents[0];
          if (!['RESOLVED', 'CANCELLED'].includes(latest.status)) {
            setActiveIncident(latest);
            setSelectedCategory(latest.category || 'MEDICAL');
          }
        }
      } catch (err) {
        console.warn('Dashboard initialization data fetch warning:', err.message);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch nearby hospitals when location is available
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      const fetchHospitals = async () => {
        try {
          const res = await api.get(
            `/hospitals/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=6000`
          );
          if (res.data.success) {
            setHospitals(res.data.hospitals);
          }
        } catch (e) {
          console.warn('Hospital fetch warning:', e.message);
        }
      };
      fetchHospitals();
    }
  }, [location?.latitude, location?.longitude]);

  // Voice SOS trigger callback
  const handleVoiceTrigger = useCallback(
    (detectedPhrase) => {
      if (!activeIncident || ['RESOLVED', 'CANCELLED'].includes(activeIncident.status)) {
        setStatusMessage(`🚨 Hands-free Voice SOS Triggered ("${detectedPhrase}")`);
        handleTriggerSOS('VOICE');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIncident, location, selectedCategory]
  );

  const {
    isSupported: voiceSupported,
    isListening: voiceListening,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    onTrigger: handleVoiceTrigger,
    enabled: voiceActive,
  });

  const toggleVoiceListener = () => {
    if (voiceActive) {
      stopListening();
      setVoiceActive(false);
    } else {
      startListening();
      setVoiceActive(true);
    }
  };

  // SOS Trigger Handler
  const handleTriggerSOS = async (triggerType = 'MANUAL') => {
    if (activeIncident && !['RESOLVED', 'CANCELLED'].includes(activeIncident.status)) {
      return;
    }

    setSosLoading(true);
    setStatusMessage(null);

    try {
      const payload = {
        category: selectedCategory,
        triggerType,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        accuracy: location?.accuracy || null,
        address: location?.latitude ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}` : 'GPS acquiring',
      };

      const res = await api.post('/incidents/sos', payload);

      if (res.data.success) {
        const incidentData = res.data.incident;
        setActiveIncident(incidentData);
        setNotificationResults(res.data.notificationResults || []);

        if (location?.latitude && location?.longitude) {
          setLocationBreadcrumbs([{ latitude: location.latitude, longitude: location.longitude }]);
        }

        // Auto start audio recording if patient gave prior consent
        if (medicalProfile?.voiceConsentGranted) {
          startRecording();
        }

        setStatusMessage('Emergency SOS Activated. Live coordinates broadcasting.');
      }
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
      setStatusMessage('Error activating SOS. Please retry or call official emergency services (112).');
    } finally {
      setSosLoading(false);
    }
  };

  // 5-second continuous GPS streaming during active emergency
  useEffect(() => {
    if (activeIncident && !['RESOLVED', 'CANCELLED'].includes(activeIncident.status)) {
      const pushLocationTelemetry = async () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const currentCoords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
            };

            setLocationBreadcrumbs((prev) => [...prev, currentCoords]);

            try {
              const incidentId = activeIncident.id || activeIncident._id;
              await api.post(`/incidents/${incidentId}/location`, currentCoords);
            } catch (err) {
              console.warn('Telemetry sync error:', err.message);
            }
          },
          (err) => console.warn('Geolocation push error:', err.message),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      };

      pushLocationTelemetry();
      trackingIntervalRef.current = setInterval(pushLocationTelemetry, 5000);

      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
        }
      };
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    }
  }, [activeIncident]);

  // Resolve Emergency Handler
  const handleResolveEmergency = async (incidentId) => {
    try {
      if (isRecording) {
        stopRecording();
      }

      const res = await api.post(`/incidents/${incidentId}/resolve`);
      if (res.data.success) {
        setActiveIncident(null);
        setStatusMessage('Emergency marked as RESOLVED. Live tracking terminated safely.');

        if (audioBlob) {
          try {
            await uploadEvidence(incidentId, audioBlob);
          } catch (uploadErr) {
            console.warn('Audio evidence upload warning:', uploadErr.message);
          }
        }
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
      alert('Error resolving incident. Please check your connection.');
    }
  };

  // Cancel Emergency Handler
  const handleCancelEmergency = async (incidentId, reason) => {
    try {
      if (isRecording) {
        stopRecording();
      }

      const cleanId = incidentId || activeIncident?._id || activeIncident?.id || activeIncident?.incidentCode;
      const res = await api.post(`/incidents/${cleanId}/cancel`, { reason });
      if (res.data.success) {
        setActiveIncident(null);
        setStatusMessage('Emergency alert has been cancelled (false alarm recorded in audit log).');
      }
    } catch (err) {
      console.error('Failed to cancel incident:', err);
      const msg = err.response?.data?.message || err.message || 'Error cancelling incident.';
      alert(`Error cancelling incident: ${msg}`);
    }
  };

  // Dynamic category update during active incident
  const handleCategoryChangeWhileActive = async (newCategory) => {
    if (!activeIncident) return;
    try {
      const cleanId = activeIncident._id || activeIncident.id || activeIncident.incidentCode;
      const res = await api.patch(`/incidents/${cleanId}/category`, { category: newCategory });
      if (res.data.success) {
        setSelectedCategory(newCategory);
        setActiveIncident(res.data.incident);
        setStatusMessage(`Emergency category dynamically updated to ${newCategory}.`);
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('Could not update category: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleGrantConsent = async () => {
    try {
      const res = await api.put('/medical', { voiceConsentGranted: true });
      if (res.data.success) {
        setMedicalProfile(res.data.profile);
      }
    } catch (e) {
      console.warn('Failed to save audio consent:', e);
    }
  };

  const isEmergencyActive = activeIncident && !['RESOLVED', 'CANCELLED'].includes(activeIncident.status);

  return (
    <div>
      {/* Active Sticky Emergency Banner */}
      <ActiveEmergencyBanner
        incident={activeIncident}
        onResolve={handleResolveEmergency}
        onCancel={handleCancelEmergency}
      />

      {/* Voice Consent Modal */}
      <VoiceConsentModal
        isOpen={voiceConsentModalOpen}
        onClose={() => setVoiceConsentModalOpen(false)}
        onGrantConsent={handleGrantConsent}
      />

      {/* Universal Mobile Access Link Bar */}
      <div
        style={{
          backgroundColor: 'rgba(25, 182, 164, 0.08)',
          border: '1px solid var(--teal-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--teal-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Smartphone size={16} color="var(--teal-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Open on Mobile Device
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Connected to WiFi or Hotspot? Access ClinicalGuard at:{' '}
              <strong style={{ color: 'var(--teal-primary)', fontFamily: 'var(--font-mono)' }}>
                http://10.212.80.195:5173
              </strong>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText('http://10.212.80.195:5173');
            alert('Mobile link copied: http://10.212.80.195:5173\nOpen this in Chrome/Safari on your mobile phone connected to the same WiFi or Hotspot!');
          }}
          className="btn-teal"
          style={{ fontSize: '0.74rem', padding: '0.35rem 0.8rem' }}
        >
          Copy Phone Link
        </button>
      </div>

      {/* Status Message Notification */}
      {statusMessage && (
        <div
          style={{
            backgroundColor: isEmergencyActive ? 'var(--coral-subtle)' : 'var(--status-success-bg)',
            border: `1px solid ${isEmergencyActive ? 'var(--coral-emergency)' : 'var(--status-success)'}`,
            color: isEmergencyActive ? '#FECDD3' : '#A7F3D0',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: '600',
          }}
        >
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Left Control Center, Right Map & Facility Directory */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: SOS & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Emergency SOS Control Card */}
          <div className="card-clean" style={{ textAlign: 'center' }}>
            <IncidentCategorySelector
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              isEmergencyActive={isEmergencyActive}
              onCategoryChangeWhileActive={handleCategoryChangeWhileActive}
            />

            <SOSButton
              onTrigger={() => handleTriggerSOS('MANUAL')}
              loading={sosLoading}
              disabled={sosLoading}
              activeEmergency={isEmergencyActive}
            />

            {/* Quick Helpline Direct Actions */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                fontSize: '0.8rem',
              }}
            >
              <a
                href="tel:112"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--coral-emergency)',
                  fontWeight: '700',
                }}
              >
                <PhoneCall size={14} />
                Dial 112 (National)
              </a>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <a
                href="tel:108"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--teal-primary)',
                  fontWeight: '700',
                }}
              >
                <Ambulance size={14} />
                Dial 108 (Ambulance)
              </a>
              <span style={{ color: 'var(--border-subtle)' }}>|</span>
              <a
                href="tel:100"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--status-info)',
                  fontWeight: '700',
                }}
              >
                <Siren size={14} />
                Dial 100 (Police)
              </a>
            </div>
          </div>

          {/* Uber-Inspired Emergency Assistance & Tracking Card */}
          <UberResponseCard
            incident={activeIncident}
            onStatusUpdated={setActiveIncident}
            onCancelRequested={() => handleCancelEmergency(activeIncident?._id, 'False Alarm / Accidental')}
          />

          {/* Response Lifecycle Pipeline */}
          <ResponsePipeline
            status={activeIncident?.status}
            notificationCount={notificationResults.length}
            isSimulated={true}
            assignedResponder={activeIncident?.assignedResponder}
          />

          {/* Audio Evidence Voice Recorder Card */}
          <div className="card-clean">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mic size={18} color="var(--teal-primary)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Emergency Voice Audio Notes
                </h4>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Max 25 MB &bull; Consent Protected
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
              Record a brief audio message describing injuries or hazards. Audio will be securely attached to your incident timeline for authorized responders.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!medicalProfile?.voiceConsentGranted) {
                      setVoiceConsentModalOpen(true);
                    } else {
                      startRecording();
                    }
                  }}
                  className="btn-teal"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                >
                  <Mic size={14} />
                  Start Audio Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="btn-coral"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                >
                  <StopCircle size={14} />
                  Stop Recording ({audioDuration}s)
                </button>
              )}

              {audioBlob && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <audio
                    controls
                    src={URL.createObjectURL(audioBlob)}
                    style={{ height: '32px', maxWidth: '200px' }}
                  />
                  <button
                    type="button"
                    onClick={clearRecording}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Discard audio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics & Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Link to="/contacts" className="card-clean" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  EMERGENCY CONTACTS
                </span>
                <Users size={16} color="var(--teal-primary)" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {contactsCount} Saved
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--teal-primary)', fontWeight: '600' }}>
                Manage priority list &rarr;
              </span>
            </Link>

            <Link to="/medical-profile" className="card-clean" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  PATIENT MEDICAL CARD
                </span>
                <Heart size={16} color="var(--coral-emergency)" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {medicalProfile?.bloodGroup || 'Unknown'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--coral-emergency)', fontWeight: '600' }}>
                {medicalProfile?.shareWithResponders ? 'Shared with Responders' : 'Private Mode'} &rarr;
              </span>
            </Link>
          </div>
        </div>

        {/* Right Column: Live Map & Nearby Facilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Map Telemetry Card */}
          <div className="card-clean" style={{ height: '440px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--teal-primary)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Emergency GPS Navigation Radar
                </h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={refreshLocation}
                  disabled={gpsLoading}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-secondary)',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <RefreshCw size={12} className={gpsLoading ? 'animate-spin' : ''} />
                  Calibrate GPS
                </button>

                {activeIncident && (
                  <Link
                    to={`/track/${activeIncident.incidentCode}`}
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: 'var(--teal-primary)',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                    }}
                  >
                    Public Track Link <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '340px' }}>
              <EmergencyMap
                userLocation={location}
                breadcrumbs={locationBreadcrumbs}
                hospitals={hospitals}
                isEmergency={isEmergencyActive}
                assignedResponder={
                  activeIncident?.assignedResponder ||
                  (isEmergencyActive ? { vehicle: 'ALS Ambulance (DL-01-EM-402)', name: 'Officer Vikram Singh' } : null)
                }
              />
            </div>
          </div>

          {/* Nearby Medical Facilities Directory Preview */}
          <div className="card-clean">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} color="var(--teal-primary)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Verified Anchor Healthcare Facilities
                </h4>
              </div>
              <Link to="/hospitals" style={{ fontSize: '0.75rem', color: 'var(--teal-primary)', fontWeight: '700' }}>
                View All Directory &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {hospitals.slice(0, 3).map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.7rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {h.address || 'Emergency Trauma Center'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--teal-primary)',
                        backgroundColor: 'var(--teal-subtle)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      {h.distanceKm !== undefined ? `${h.distanceKm} km` : 'Near'}
                    </span>
                    {h.phone && (
                      <a
                        href={`tel:${h.phone}`}
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: 'var(--coral-emergency)',
                          fontWeight: '700',
                          marginTop: '2px',
                        }}
                      >
                        Dial: {h.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
