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

  // Add Item to Array Field Helpers
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

  // Milestone 4 Feature: Play Voice Consent Audio Preview
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

  // Milestone 4 Feature: Export My Records (JSON)
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

  // Milestone 4 Feature: Permanently Erase Data
  const handlePermanentlyErase = async () => {
    const confirmation = window.prompt(
      'Type "ERASE" to permanently delete all medical conditions, allergy logs, and emergency voice consent tokens (GDPR Right to be Forgotten):'
    );
    if (confirmation !== 'ERASE') {
      alert('Erase cancelled. No data was deleted.');
      return;
    }

    try {
      const res = await api.delete('/medical/erase');
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
        fetchProfile();
      }
    } catch (e) {
      setFeedback({ type: 'error', text: 'Failed to erase data.' });
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase' }}>
            PATIENT RECORDS
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc' }}>
            Medical Profile
          </h2>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Edit2 size={16} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? '#10b98120' : '#ef444420',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Profile Presentation Card (Faithfully matches Milestone 4 Screenshot) */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Top Header Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #1e293b',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: '800',
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'R'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f8fafc' }}>
                {user?.name || 'Patient'}
              </h3>
              <span
                style={{
                  backgroundColor: '#ef444420',
                  color: '#ef4444',
                  border: '1px solid #ef444450',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}
              >
                {bloodGroup !== 'Unknown' ? bloodGroup : 'Blood Group Not Set'}
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              HEALTH ID: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>EAS-{user?.id?.slice(-8).toUpperCase() || '20261021'}</span> &bull; {user?.email}
            </div>
          </div>
        </div>

        {/* Biometrics Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ backgroundColor: '#141e33', padding: '0.85rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Age</span>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
              {age ? `${age} years` : '—'}
            </div>
          </div>

          <div style={{ backgroundColor: '#141e33', padding: '0.85rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Weight</span>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
              {weightKg ? `${weightKg} kg` : '—'}
            </div>
          </div>

          <div style={{ backgroundColor: '#141e33', padding: '0.85rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Height</span>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
              {heightCm ? `${heightCm} cm` : '—'}
            </div>
          </div>

          <div style={{ backgroundColor: '#141e33', padding: '0.85rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Gender</span>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
              {gender || '—'}
            </div>
          </div>
        </div>

        {/* Known Allergies Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Known Allergies
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {allergies.map((allergy, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: '#ef444420',
                  color: '#f87171',
                  border: '1px solid #ef444450',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}
              >
                {allergy}
              </span>
            ))}
            {allergies.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No recorded allergies</span>
            )}
          </div>
        </div>

        {/* Medical Conditions Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Medical Conditions
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {medicalConditions.map((cond, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: '#3b82f620',
                  color: '#60a5fa',
                  border: '1px solid #3b82f650',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}
              >
                {cond}
              </span>
            ))}
            {medicalConditions.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No recorded chronic conditions</span>
            )}
          </div>
        </div>

        {/* Current Medications Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Current Medications
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {medications.map((med, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: '#10b98120',
                  color: '#34d399',
                  border: '1px solid #10b98150',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}
              >
                {med}
              </span>
            ))}
            {medications.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No active prescribed medications</span>
            )}
          </div>
        </div>

        {/* Emergency Notes Section */}
        {emergencyNotes && (
          <div style={{ marginBottom: '2rem', backgroundColor: '#141e33', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              First Responder Instructions & Emergency Notes
            </span>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              {emergencyNotes}
            </p>
          </div>
        )}

        {/* Milestone 4: My Data & Privacy Controls Strip */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.85rem' }}>
            My Data & Privacy Controls
          </span>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Play Voice Consent Button */}
            <button
              type="button"
              onClick={handlePlayVoiceConsent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Volume2 size={16} />
              <span>Play Voice Consent</span>
            </button>

            {/* Export My Records (JSON) Button */}
            <button
              type="button"
              onClick={handleExportRecords}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#10b981',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <FileDown size={16} />
              <span>Export My Records (JSON)</span>
            </button>

            {/* Permanently Erase Data Button */}
            <button
              type="button"
              onClick={handlePermanentlyErase}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#7f1d1d25',
                border: '1px solid #ef444450',
                color: '#f87171',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                fontSize: '0.825rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
              <span>Permanently Erase Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc' }}>
                Edit Medical Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    BLOOD GROUP
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    GENDER
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    AGE (YRS)
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    style={{
                      width: '100%',
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    WEIGHT (KG)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="72"
                    style={{
                      width: '100%',
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                    HEIGHT (CM)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="175"
                    style={{
                      width: '100%',
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Allergies Tag Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  ALLERGIES
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); }}}
                    placeholder="e.g. Penicillin, Pollen, Peanuts"
                    style={{
                      flex: 1,
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#38bdf8',
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {allergies.map((a, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#ef444420',
                        color: '#f87171',
                        border: '1px solid #ef444440',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {a}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Medical Conditions Tag Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  CHRONIC MEDICAL CONDITIONS
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCondition(); }}}
                    placeholder="e.g. Asthma, Hypertension, Diabetes"
                    style={{
                      flex: 1,
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCondition}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#38bdf8',
                      borderRadius: '8px',
                      padding: '0 0.85rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {medicalConditions.map((c, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#3b82f620',
                        color: '#60a5fa',
                        border: '1px solid #3b82f640',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {c}
                      <X
                        size={12}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setMedicalConditions(medicalConditions.filter((_, i) => i !== idx))}
                      />
                    </span>
                  ))}
                </div>
              </div>

              {/* Emergency Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  EMERGENCY NOTES FOR RESPONDERS
                </label>
                <textarea
                  rows={3}
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                  placeholder="e.g. Carries EpiPen in backpack side pocket. Diabetic on morning insulin."
                  style={{
                    width: '100%',
                    backgroundColor: '#141e33',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.65rem 0.75rem',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="shareRespondersCheck"
                    checked={shareWithResponders}
                    onChange={(e) => setShareWithResponders(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                  />
                  <label htmlFor="shareRespondersCheck" style={{ fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Share blood group & allergies in emergency alerts with contacts & responders
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="voiceConsentCheck"
                    checked={voiceConsentGranted}
                    onChange={(e) => setVoiceConsentGranted(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                  />
                  <label htmlFor="voiceConsentCheck" style={{ fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Grant consent for automated emergency ambient audio recording during SOS
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.6rem 1.1rem',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.3rem',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
