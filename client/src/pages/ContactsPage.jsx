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
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#3b82f620',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f8fafc' }}>
              Emergency Contacts
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Registered contacts who receive automated SMS alerts with your live location during an SOS
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
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            }}
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

      {/* Twilio Dev Simulation Notice Banner */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
        }}
      >
        <Info size={16} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          <strong>Twilio SMS & Dev Dispatch Note:</strong> In development mode without Twilio environment variables, the system simulates SMS dispatches and logs tracking URLs to the database and terminal without charging real phone numbers. Once Twilio credentials are configured in <code style={{ color: '#38bdf8' }}>server/.env</code>, real SMS messages are automatically delivered.
        </div>
      </div>

      {/* Add / Edit Form Panel */}
      {isAdding && (
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #3b82f6',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
              {editingContact ? 'Edit Emergency Contact' : 'New Emergency Contact'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveContact} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
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
                  backgroundColor: '#141e33',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                PHONE NUMBER (E.164 format) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                style={{
                  width: '100%',
                  backgroundColor: '#141e33',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                RELATIONSHIP
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#141e33',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse / Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Doctor">Doctor / Physician</option>
                <option value="Friend">Close Friend</option>
                <option value="Colleague">Colleague</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                EMAIL (OPTIONAL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                style={{
                  width: '100%',
                  backgroundColor: '#141e33',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
              <input
                type="checkbox"
                id="isPrimaryCheckbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
              />
              <label htmlFor="isPrimaryCheckbox" style={{ fontSize: '0.825rem', color: '#cbd5e1', cursor: 'pointer' }}>
                Designate as Primary Emergency Contact (receives priority SMS first)
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={resetForm}
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
                disabled={submitting}
                style={{
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.3rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Emergency Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {contacts.map((contact) => (
          <div
            key={contact._id}
            style={{
              backgroundColor: '#0f172a',
              border: contact.isPrimary ? '1px solid #ef4444' : '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: contact.isPrimary ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc' }}>
                    {contact.name}
                  </span>
                  {contact.isPrimary && (
                    <span
                      style={{
                        backgroundColor: '#ef444420',
                        color: '#ef4444',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Star size={10} fill="#ef4444" />
                      PRIMARY
                    </span>
                  )}
                </div>

                <span
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                  }}
                >
                  {contact.relationship}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#cbd5e1' }}>
                  <Phone size={14} color="#38bdf8" />
                  <span>{contact.phone}</span>
                </div>

                {contact.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <Mail size={14} color="#64748b" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                borderTop: '1px solid #1e293b',
                paddingTop: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => startEdit(contact)}
                style={{
                  background: 'none',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Edit2 size={12} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(contact._id, contact.name)}
                style={{
                  background: 'none',
                  border: '1px solid #ef444440',
                  borderRadius: '6px',
                  color: '#f87171',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {contacts.length === 0 && !loading && !isAdding && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#0f172a',
            border: '1px dashed #1e293b',
            borderRadius: '12px',
          }}
        >
          <Users size={36} color="#475569" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '0.35rem' }}>
            No Emergency Contacts Configured
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
            Add trusted family members, close friends, or medical professionals who should be alerted when you press the SOS button.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Add Your First Contact
          </button>
        </div>
      )}
    </div>
  );
};
