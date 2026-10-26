import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sliders,
  ShieldCheck,
  Mic,
  MapPin,
  Trash2,
  Lock,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/medical');
        if (res.data.success) {
          setProfile(res.data.profile);
        }
      } catch (err) {
        console.warn('Failed to load settings profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleConsent = async (field, val) => {
    try {
      const res = await api.put('/medical', { [field]: val });
      if (res.data.success) {
        setProfile(res.data.profile);
        setMessage('Privacy preferences updated successfully.');
      }
    } catch (err) {
      alert('Failed to update preference.');
    }
  };

  const handleEraseData = async () => {
    const confirm = window.prompt(
      'Type "ERASE" to permanently delete your medical card data under GDPR Right to be Forgotten:'
    );
    if (confirm !== 'ERASE') return;

    setErasing(true);
    try {
      const res = await api.delete('/medical/erase');
      if (res.data.success) {
        alert('All stored medical data has been permanently expunged from the database.');
        window.location.reload();
      }
    } catch (err) {
      alert('Error expunging medical data.');
    } finally {
      setErasing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>
      <div className="card-clean">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Sliders size={22} color="var(--teal-primary)" />
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Privacy, Security & System Permissions
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Fine-grained consent management, telemetry controls, and GDPR data sovereignty
            </div>
          </div>
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
          }}
        >
          {message}
        </div>
      )}

      {/* Permissions & Data Sharing */}
      <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
          Data Sharing & Telemetry Consent
        </h3>

        {/* Share with Responders Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Share Medical Profile with Dispatched Responders
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Allows arriving paramedics and doctors to review critical blood group, allergies, and emergency medical notes.
            </div>
          </div>

          <input
            type="checkbox"
            checked={profile?.shareWithResponders ?? true}
            onChange={(e) => handleToggleConsent('shareWithResponders', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--teal-primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Ambient Audio Recording Consent */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Ambient Emergency Audio Evidence Capture
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Allows optional 30-second audio capture when an SOS is activated. Enforces 72-hour auto-retention policy.
            </div>
          </div>

          <input
            type="checkbox"
            checked={profile?.voiceConsentGranted ?? false}
            onChange={(e) => handleToggleConsent('voiceConsentGranted', e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--teal-primary)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Audio Retention & Legal Policy */}
      <div className="card-clean">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Data Retention & Audio Lifecycle Policy
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Emergency audio recordings captured via the Web MediaRecorder API are stored in private server storage with cryptographic hash filenames. Access is strictly authenticated to the patient, assigned responder, and emergency dispatchers.
        </p>

        <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>Maximum recording duration: <strong>Configurable (Default: 60 seconds)</strong></li>
          <li>Maximum file size: <strong>25 MB strict MIME filter</strong></li>
          <li>Default automated retention: <strong>72 Hours after incident resolution</strong></li>
        </ul>
      </div>

      {/* GDPR Data Sovereignty & Account Erasure */}
      <div
        className="card-clean"
        style={{
          border: '1px solid var(--coral-emergency)',
          backgroundColor: 'var(--surface-elevated)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={18} color="var(--coral-emergency)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--coral-emergency)' }}>
            GDPR Data Sovereignty & Right to be Forgotten
          </h3>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.45 }}>
          You retain full ownership of your sensitive health data. You can export your data anytime or permanently delete your stored medical conditions, allergies, and notes from our database.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={async () => {
              const res = await api.get('/medical/export');
              const blob = new Blob([JSON.stringify(res.data.profile, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `medical-card-${user.id}.json`;
              a.click();
            }}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            Export JSON Medical Card
          </button>

          <button
            type="button"
            onClick={handleEraseData}
            disabled={erasing}
            className="btn-coral"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <Trash2 size={14} />
            {erasing ? 'Expunging...' : 'Permanently Erase Medical History'}
          </button>
        </div>
      </div>
    </div>
  );
};
