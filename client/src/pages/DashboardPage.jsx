import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { SOSButton } from '../components/SOSButton';
import { IncidentCategorySelector } from '../components/IncidentCategorySelector';
import { ResponsePipeline } from '../components/ResponsePipeline';
import { EmergencyMap } from '../components/EmergencyMap';
import { ActiveEmergencyBanner } from '../components/ActiveEmergencyBanner';
import { VoiceConsentModal } from '../components/VoiceConsentModal';
import {
  Users,
  Heart,
  MapPin,
  Mic,
  ShieldCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  RefreshCw,
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

  // Load profile, contacts, and active incident status on mount
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

        // Check if there is an unresolved active incident
        if (historyRes.data.success && historyRes.data.incidents.length > 0) {
          const latest = historyRes.data.incidents[0];
          if (latest.status !== 'RESOLVED') {
            setActiveIncident(latest);
            setSelectedCategory(latest.category);
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
      if (!activeIncident) {
        setStatusMessage(`🚨 Voice SOS Triggered by phrase: "${detectedPhrase}"`);
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

  // Toggle voice recognition
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
    if (activeIncident && activeIncident.status !== 'RESOLVED') {
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
        address: location?.latitude ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}` : 'Location acquiring',
      };

      const res = await api.post('/incidents/sos', payload);

      if (res.data.success) {
        const incidentData = res.data.incident;
        setActiveIncident(incidentData);
        setNotificationResults(res.data.notificationResults || []);

        if (location?.latitude && location?.longitude) {
          setLocationBreadcrumbs([{ latitude: location.latitude, longitude: location.longitude }]);
        }

        // Start ambient audio recording if user has granted consent
        if (medicalProfile?.voiceConsentGranted) {
          startRecording();
        }

        setStatusMessage('Emergency SOS Activated. Live coordinates broadcasting.');
      }
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
      setStatusMessage('Error activating SOS. Please retry or call emergency services directly.');
    } finally {
      setSosLoading(false);
    }
  };

  // 5-second continuous GPS streaming during active emergency (Milestone 5 requirement)
  useEffect(() => {
    if (activeIncident && activeIncident.status !== 'RESOLVED') {
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

      // Push immediately, then every 5 seconds
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
      // 1. Stop audio recording if active
      if (isRecording) {
        stopRecording();
      }

      // 2. Mark incident resolved
      const res = await api.post(`/incidents/${incidentId}/resolve`);
      if (res.data.success) {
        setActiveIncident(null);
        setStatusMessage('Emergency marked as RESOLVED. Live tracking terminated safely.');

        // 3. Upload audio evidence if captured
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

  // Grant Audio Consent Callback
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

  const isEmergencyActive = activeIncident && activeIncident.status !== 'RESOLVED';

  return (
    <div>
      {/* Sticky Top Banner during active emergency */}
      <ActiveEmergencyBanner
        incident={activeIncident}
        onResolve={handleResolveEmergency}
      />

      {/* Voice Consent Modal */}
      <VoiceConsentModal
        isOpen={voiceConsentModalOpen}
        onClose={() => setVoiceConsentModalOpen(false)}
        onGrantConsent={handleGrantConsent}
      />

      {/* Status or Alert Notification Message */}
      {statusMessage && (
        <div
          style={{
            backgroundColor: isEmergencyActive ? '#ef444420' : '#10b98120',
            border: `1px solid ${isEmergencyActive ? '#ef4444' : '#10b981'}`,
            color: isEmergencyActive ? '#fca5a5' : '#6ee7b7',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
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

      {/* Main Grid: Left Control Center, Right Map & Hospitals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: SOS & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Main Emergency Card */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: isEmergencyActive ? '2px solid #ef4444' : '1px solid #1e293b',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: isEmergencyActive ? '0 0 30px rgba(239, 68, 68, 0.25)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: isEmergencyActive ? '#ef4444' : '#10b981',
                    boxShadow: isEmergencyActive ? '0 0 8px #ef4444' : '0 0 8px #10b981',
                  }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isEmergencyActive ? '#ef4444' : '#10b981' }}>
                  {isEmergencyActive ? 'EMERGENCY IN PROGRESS' : 'SYSTEM READY'}
                </span>
              </div>

              {activeIncident && (
                <Link
                  to={`/track/${activeIncident.incidentCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Public Live Tracking Link</span>
                </Link>
              )}
            </div>

            {/* Central SOS Button */}
            <SOSButton
              onTrigger={() => handleTriggerSOS('MANUAL')}
              loading={sosLoading}
              disabled={isEmergencyActive}
              activeEmergency={isEmergencyActive}
            />

            {/* Category Selector */}
            <IncidentCategorySelector
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              disabled={isEmergencyActive}
            />

            {/* Response Pipeline */}
            <ResponsePipeline
              status={activeIncident?.status}
              notificationCount={notificationResults.length || contactsCount}
              isSimulated={notificationResults.some((n) => n.provider === 'DEV_SIMULATOR')}
            />

            {/* Ambient Audio & Evidence Status */}
            <div
              style={{
                backgroundColor: '#141e33',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? '#ef444430' : '#1e293b',
                    color: isRecording ? '#ef4444' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mic size={16} className={isRecording ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc' }}>
                    {isRecording ? `Recording Ambient Audio (${audioDuration}s)` : 'Audio Evidence Capture'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {medicalProfile?.voiceConsentGranted
                      ? 'Consent granted &bull; Activates automatically during emergency'
                      : 'Consent required before recording'}
                  </div>
                </div>
              </div>

              {!medicalProfile?.voiceConsentGranted && (
                <button
                  type="button"
                  onClick={() => setVoiceConsentModalOpen(true)}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Configure
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Map & Healthcare Facilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Map Container Card */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="#ef4444" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>
                  Live Location & Healthcare Map
                </h3>
              </div>

              <button
                type="button"
                onClick={refreshLocation}
                disabled={gpsLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} className={gpsLoading ? 'animate-spin' : ''} />
                <span>Refresh GPS</span>
              </button>
            </div>

            {gpsError && (
              <div
                style={{
                  backgroundColor: '#ef444415',
                  border: '1px solid #ef444440',
                  color: '#fca5a5',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                {gpsError}
              </div>
            )}

            {/* Interactive Leaflet Map */}
            <EmergencyMap
              centerCoordinates={location}
              accuracy={location?.accuracy || 0}
              breadcrumbCoordinates={locationBreadcrumbs}
              hospitals={hospitals}
              height="360px"
            />
          </div>

          {/* Nearby Hospitals & Emergency Facilities */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f8fafc' }}>
                Surrounding Healthcare Facilities ({hospitals.length})
              </h4>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                OpenStreetMap & Directory
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {hospitals.slice(0, 5).map((hosp) => (
                <div
                  key={hosp.id}
                  style={{
                    backgroundColor: '#141e33',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                        {hosp.name}
                      </span>
                      {hosp.verified && (
                        <ShieldCheck size={14} color="#10b981" title="Verified Facility" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      {hosp.type} &bull; <strong style={{ color: '#38bdf8' }}>{hosp.distanceKm} km</strong>
                    </div>
                  </div>

                  {hosp.navigationUrl && (
                    <a
                      href={hosp.navigationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        color: '#38bdf8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <span>Route</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}

              {hospitals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                  Acquiring location coordinates to discover nearby medical centers...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Strip: Contacts & Medical Profile snapshot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {/* Emergency Contacts Widget */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#3b82f620',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                Emergency Contacts
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {contactsCount} contact{contactsCount === 1 ? '' : 's'} registered for SMS dispatch
              </div>
            </div>
          </div>

          <Link
            to="/contacts"
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#38bdf8',
              backgroundColor: '#1e293b',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #334155',
            }}
          >
            Manage
          </Link>
        </div>

        {/* Medical Profile Widget */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#ef444420',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                  Medical Profile
                </span>
                {medicalProfile?.bloodGroup && (
                  <span
                    style={{
                      backgroundColor: '#ef444420',
                      color: '#ef4444',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                    }}
                  >
                    {medicalProfile.bloodGroup}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {medicalProfile?.allergies?.length || 0} Allergies &bull;{' '}
                {medicalProfile?.medicalConditions?.length || 0} Conditions
              </div>
            </div>
          </div>

          <Link
            to="/medical-profile"
            style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#38bdf8',
              backgroundColor: '#1e293b',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #334155',
            }}
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
};
