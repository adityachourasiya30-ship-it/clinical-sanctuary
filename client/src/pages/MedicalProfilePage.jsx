import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Edit2,
  FileDown,
  Trash2,
  Volume2,
  ShieldCheck,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  User,
  Activity,
} from 'lucide-react';

export const MedicalProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form Fields
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [allergies, setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [medicalConditions, setMedicalConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  const [medications, setMedications] = useState([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [age, setAge] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [gender, setGender] = useState('Male');
  const [voiceConsentGranted, setVoiceConsentGranted] = useState(false);
  const [shareWithResponders, setShareWithResponders] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medical');
      if (res.data.success) {
        const p = res.data.profile;
        setProfile(p);
        setBloodGroup(p.bloodGroup || 'Unknown');
        setAllergies(p.allergies || []);
        setMedicalConditions(p.medicalConditions || []);
        setMedications(p.medications || []);
        setEmergencyNotes(p.emergencyNotes || '');
        setAge(p.age || '');
        setWeightKg(p.weightKg || '');
        setHeightCm(p.heightCm || '');
        setGender(p.gender || 'Prefer not to say');
        setVoiceConsentGranted(Boolean(p.voiceConsentGranted));
        setShareWithResponders(p.shareWithResponders !== false);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to load medical records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        bloodGroup,
        allergies,
        medicalConditions,
        medications,
        emergencyNotes,
        age: age ? Number(age) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        gender,
        voiceConsentGranted,
        shareWithResponders,
      };

      const res = await api.put('/medical', payload);
      if (res.data.success) {
        setProfile(res.data.profile);
        setIsEditing(false);
        setFeedback({ type: 'success', text: 'Medical profile updated successfully.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to save medical records.' });
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const addCondition = () => {
    if (conditionInput.trim() && !medicalConditions.includes(conditionInput.trim())) {
      setMedicalConditions([...medicalConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const addMedication = () => {
    if (medicationInput.trim() && !medications.includes(medicationInput.trim())) {
      setMedications([...medications, medicationInput.trim()]);
      setMedicationInput('');
    }
  };

  const handlePlayVoiceConsent = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Voice Consent Active. During an emergency activation, Clinical Sanctuary is authorized to capture ambient microphone audio evidence for first responder coordination.'
      );
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis not supported on this browser.');
    }
  };

  const handleExportRecords = async () => {
    try {
      const res = await api.get('/medical/export');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `clinical_sanctuary_records_${user?.name?.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setFeedback({ type: 'success', text: 'Medical records successfully exported as JSON.' });
    } catch (e) {
      setFeedback({ type: 'error', text: 'Error exporting records.' });
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="card-clean" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--coral-subtle)',
              border: '1px solid var(--coral-emergency)',
              color: 'var(--coral-emergency)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Emergency Patient Medical Card
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Critical health indicators, blood group, drug allergies, and medications shared with arriving paramedics
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handleExportRecords}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <FileDown size={14} /> Export JSON
          </button>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-teal"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              <Edit2 size={14} /> Edit Medical Card
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--coral-subtle)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--status-success)' : 'var(--coral-emergency)'}`,
            color: feedback.type === 'success' ? '#A7F3D0' : '#FECDD3',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            &times;
          </button>
        </div>
      )}

      {/* Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="card-clean" style={{ border: '2px solid var(--teal-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Update Medical Profile
            </h3>
            <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>
              Cancel
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                BLOOD GROUP *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                AGE
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                WEIGHT (KG)
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 70"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                GENDER
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Allergies Tags */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              CRITICAL DRUG & SUBSTANCE ALLERGIES
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa"
                style={{
                  flex: 1,
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
              <button type="button" onClick={addAllergy} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {allergies.map((a, i) => (
                <span key={i} className="badge-tag" style={{ backgroundColor: 'var(--coral-subtle)', color: 'var(--coral-emergency)', border: '1px solid var(--coral-emergency)' }}>
                  {a}
                  <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setAllergies(allergies.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
          </div>

          {/* Medical Conditions */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              EXISTING MEDICAL CONDITIONS & CHRONIC DIAGNOSES
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                placeholder="e.g. Asthma, Type-1 Diabetes"
                style={{
                  flex: 1,
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
              <button type="button" onClick={addCondition} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {medicalConditions.map((c, i) => (
                <span key={i} className="badge-tag" style={{ backgroundColor: 'var(--teal-subtle)', color: 'var(--teal-primary)', border: '1px solid var(--teal-border)' }}>
                  {c}
                  <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setMedicalConditions(medicalConditions.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
          </div>

          {/* Emergency Notes */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              EMERGENCY PHYSICIAN & FIRST RESPONDER CLINICAL NOTES
            </label>
            <textarea
              rows={3}
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              placeholder="e.g. Carries EpiPen in backpack. Severe bronchospasm history."
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" className="btn-teal" style={{ fontSize: '0.85rem' }}>
              Save Medical Card
            </button>
          </div>
        </form>
      ) : (
        /* Profile Display Card */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Blood & Vital Card */}
          <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                PRIMARY BLOOD IDENTIFIER
              </span>
              <Heart size={20} color="var(--coral-emergency)" />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: 'var(--coral-emergency)',
                  backgroundColor: 'var(--coral-subtle)',
                  padding: '0.2rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--coral-emergency)',
                }}
              >
                {bloodGroup}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Rh System Verified
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>AGE</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{age || 'N/A'} yrs</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>WEIGHT</span>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{weightKg ? `${weightKg} kg` : 'N/A'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <button
                type="button"
                onClick={handlePlayVoiceConsent}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
              >
                <Volume2 size={14} color="var(--teal-primary)" /> Play Voice Consent Statement
              </button>
            </div>
          </div>

          {/* Clinical Allergies & Conditions */}
          <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                RECORDED ALLERGIES ({allergies.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {allergies.length ? (
                  allergies.map((a, i) => (
                    <span key={i} className="badge-tag" style={{ backgroundColor: 'var(--coral-subtle)', color: 'var(--coral-emergency)', border: '1px solid var(--coral-emergency)' }}>
                      {a}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No known drug allergies reported</span>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                CHRONIC CONDITIONS ({medicalConditions.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {medicalConditions.length ? (
                  medicalConditions.map((c, i) => (
                    <span key={i} className="badge-tag" style={{ backgroundColor: 'var(--teal-subtle)', color: 'var(--teal-primary)', border: '1px solid var(--teal-border)' }}>
                      {c}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No chronic conditions recorded</span>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                EMERGENCY RESPONDER NOTES
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                {emergencyNotes || 'No specific emergency instructions provided.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
