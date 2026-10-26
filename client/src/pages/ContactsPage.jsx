import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Heart,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Star,
  Info,
  PhoneCall,
  X,
} from 'lucide-react';

export const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [isPrimary, setIsPrimary] = useState(false);
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contacts');
      if (res.data.success) {
        setContacts(res.data.contacts);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to load emergency contacts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const resetForm = () => {
    setName('');
    setPhone('');
    setRelationship('Parent');
    setIsPrimary(false);
    setEmail('');
    setFormError('');
    setIsAdding(false);
    setEditingContact(null);
  };

  const startEdit = (c) => {
    setEditingContact(c);
    setName(c.name);
    setPhone(c.phone);
    setRelationship(c.relationship || 'Family');
    setIsPrimary(c.isPrimary || false);
    setEmail(c.email || '');
    setIsAdding(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !phone.trim()) {
      setFormError('Contact name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        relationship,
        isPrimary,
        email: email.trim(),
      };

      if (editingContact) {
        await api.put(`/contacts/${editingContact._id}`, payload);
        setFeedback({ type: 'success', text: 'Contact updated successfully.' });
      } else {
        await api.post('/contacts', payload);
        setFeedback({ type: 'success', text: 'Emergency contact added successfully.' });
      }

      resetForm();
      fetchContacts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, contactName) => {
    if (!window.confirm(`Are you sure you want to remove ${contactName} from your emergency contacts?`)) {
      return;
    }

    try {
      await api.delete(`/contacts/${id}`);
      setFeedback({ type: 'success', text: `${contactName} was removed.` });
      fetchContacts();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to delete contact.' });
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
              backgroundColor: 'var(--teal-subtle)',
              border: '1px solid var(--teal-primary)',
              color: 'var(--teal-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Emergency Contacts Network
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Trusted individuals who immediately receive automated SMS alerts with your live GPS location during an SOS
            </p>
          </div>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="btn-teal"
            style={{ fontSize: '0.825rem', padding: '0.55rem 1rem' }}
          >
            <UserPlus size={16} />
            <span>Add Emergency Contact</span>
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? 'var(--status-success-bg)' : 'var(--coral-subtle)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--status-success)' : 'var(--coral-emergency)'}`,
            color: feedback.type === 'success' ? '#A7F3D0' : '#FECDD3',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            fontWeight: '600',
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

      {/* Dev Simulator Notification Informational Banner */}
      <div
        style={{
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
        }}
      >
        <Info size={16} color="var(--teal-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          <strong>Twilio SMS & Notification Dispatch Note:</strong> In academic local mode without active Twilio keys, the platform simulates delivery and writes tracking telemetry to the local database audit log. When real Twilio credentials are provided in <code style={{ color: 'var(--teal-primary)' }}>server/.env</code>, carrier SMS dispatches occur automatically.
        </div>
      </div>

      {/* Add / Edit Form Panel */}
      {isAdding && (
        <div
          className="card-clean"
          style={{
            border: '2px solid var(--teal-primary)',
            backgroundColor: 'var(--surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {editingContact ? 'Edit Emergency Contact' : 'Register New Emergency Contact'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div
              style={{
                backgroundColor: 'var(--coral-subtle)',
                border: '1px solid var(--coral-emergency)',
                color: '#FECDD3',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.8rem',
                marginBottom: '1rem',
              }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                PHONE NUMBER (WITH COUNTRY CODE) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +919876543210"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                RELATIONSHIP
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse / Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Doctor">Primary Physician / Doctor</option>
                <option value="Friend">Friend</option>
                <option value="Guardian">Guardian</option>
                <option value="Colleague">Colleague</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@example.com"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="isPrimaryCheckbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--teal-primary)', cursor: 'pointer' }}
              />
              <label htmlFor="isPrimaryCheckbox" style={{ fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                Designate as Primary Emergency Contact (prioritized in dispatch sequence)
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-teal"
                style={{ fontSize: '0.8rem' }}
              >
                {submitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Emergency Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--teal-primary)' }}>
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="card-clean" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Users size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>No Contacts Added Yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
              Add at least 1 or 2 family members, close friends, or your physician to receive automated SMS alerts during an SOS.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="btn-teal"
              style={{ margin: '0 auto' }}
            >
              <UserPlus size={16} /> Add First Contact
            </button>
          </div>
        ) : (
          contacts.map((c) => (
            <div
              key={c._id}
              className="card-clean"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                borderLeft: c.isPrimary ? '4px solid var(--teal-primary)' : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: c.isPrimary ? 'var(--teal-subtle)' : 'var(--surface-elevated)',
                    color: c.isPrimary ? 'var(--teal-primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: '800',
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>{c.name}</h3>
                    {c.isPrimary && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          color: 'var(--teal-primary)',
                          backgroundColor: 'var(--teal-subtle)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--teal-border)',
                        }}
                      >
                        PRIMARY
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface-elevated)', padding: '1px 6px', borderRadius: 'var(--radius-xs)' }}>
                      {c.relationship}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} color="var(--teal-primary)" />
                      {c.phone}
                    </span>
                    {c.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={13} color="var(--text-muted)" />
                        {c.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a
                  href={`tel:${c.phone}`}
                  className="btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', color: 'var(--teal-primary)' }}
                >
                  <PhoneCall size={14} /> Call
                </a>

                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.65rem' }}
                  title="Edit contact"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(c._id, c.name)}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.65rem', color: 'var(--coral-emergency)' }}
                  title="Remove contact"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
