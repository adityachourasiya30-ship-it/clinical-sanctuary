import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ShieldCheck,
  Zap,
  Ambulance,
  Radio,
  UserCheck,
  PhoneCall,
} from 'lucide-react';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Initialize Google Identity Services (GIS) if available
  useEffect(() => {
    /* global google */
    if (typeof window !== 'undefined' && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: 'your-google-oauth-client-id.apps.googleusercontent.com',
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              try {
                await googleLogin(response.credential);
                navigate('/dashboard');
              } catch (err) {
                setError(err.response?.data?.message || 'Google authentication failed.');
              } finally {
                setLoading(false);
              }
            }
          },
        });

        const googleBtnDiv = document.getElementById('googleSignInBtn');
        if (googleBtnDiv) {
          window.google.accounts.id.renderButton(googleBtnDiv, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            width: '100%',
          });
        }
      } catch (e) {
        console.warn('Google Identity Services init warning:', e);
      }
    }
  }, [googleLogin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, { role, badgeNumber, organization });
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 404) {
        setError('Authentication service endpoint not found (404). Please verify backend URL deployment.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to backend server. The service may be waking up (Render cold-start) or unreachable. Please retry in 15 seconds.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillPersona = (pEmail, pPassword, pRole, pName) => {
    setEmail(pEmail);
    setPassword(pPassword);
    setRole(pRole);
    if (isRegister) {
      setName(pName);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Left Hero Panel */}
        <div
          style={{
            padding: '2.5rem',
            backgroundColor: '#0E1726',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--coral-emergency)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 0 16px var(--coral-glow)',
                }}
              >
                <ShieldAlert size={20} />
              </div>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.01em', color: 'var(--text-main)', display: 'block', lineHeight: 1.1 }}>
                  Clinical Sanctuary
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--teal-primary)', fontWeight: '600' }}>
                  ClinicalGuard Platform
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                color: 'var(--teal-primary)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Emergency Response Gateway
            </span>

            <h2 style={{ fontSize: '1.95rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '1rem' }}>
              Precision in every Response.
            </h2>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '2rem' }}>
              Instant SOS activation, verified responder telemetry, patient medical safety, and automated contact notifications built for mission-critical response.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--teal-primary)' }}><ShieldCheck size={20} /></div>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-main)' }}>Consent-Driven Privacy</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Role-restricted access to sensitive medical profiles</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--coral-emergency)' }}><Zap size={20} /></div>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-main)' }}>Multi-Channel SOS Trigger</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Touch, speech recognition ("Emergency"), and audio recording</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Persona Fill Pills for Easy Testing */}
          <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              ONE-CLICK DEMO ACCESS (SELECT ROLE):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => fillPersona('rahul.patient@example.com', 'EmergencyPass2026!', 'USER', 'Rahul Sharma')}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <UserIcon size={12} color="var(--teal-primary)" />
                Citizen (Rahul)
              </button>

              <button
                type="button"
                onClick={() => fillPersona('vikram.responder@example.com', 'EmergencyPass2026!', 'RESPONDER', 'Officer Vikram Singh')}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Ambulance size={12} color="var(--coral-emergency)" />
                Responder (Vikram)
              </button>

              <button
                type="button"
                onClick={() => fillPersona('anita.dispatcher@example.com', 'EmergencyPass2026!', 'DISPATCHER', 'Anita Verma')}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Radio size={12} color="var(--status-info)" />
                Dispatcher (Anita)
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {isRegister ? 'Register Sanctuary Account' : 'Sign In to Clinical Sanctuary'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              {isRegister
                ? 'Create a secure profile to activate assistance and emergency response.'
                : 'Enter your credentials to manage your emergency settings.'}
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'var(--coral-subtle)',
                border: '1px solid var(--coral-emergency)',
                color: '#FECDD3',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} color="var(--coral-emergency)" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    FULL NAME
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    ACCOUNT ROLE
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
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
                  >
                    <option value="USER">Citizen / Patient</option>
                    <option value="RESPONDER">Field Responder (Paramedic / EMT)</option>
                    <option value="DISPATCHER">Central Dispatcher</option>
                  </select>
                </div>

                {role === 'RESPONDER' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        BADGE NUMBER
                      </label>
                      <input
                        type="text"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                        placeholder="e.g. EMT-108"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.55rem',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        ORGANIZATION
                      </label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. City Ambulance"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.55rem',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  PASSWORD
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-teal"
              style={{
                marginTop: '0.5rem',
                justifyContent: 'center',
                padding: '0.75rem',
                fontSize: '0.9rem',
                width: '100%',
              }}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register Sanctuary Account' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Google Sign In Container */}
          <div style={{ margin: '1.25rem 0 0.5rem 0', textAlign: 'center' }}>
            <div id="googleSignInBtn" style={{ minHeight: '40px' }} />
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {isRegister ? (
                <>Already have an account? <strong style={{ color: 'var(--teal-primary)' }}>Sign In</strong></>
              ) : (
                <>New to the platform? <strong style={{ color: 'var(--teal-primary)' }}>Create Account</strong></>
              )}
            </button>
          </div>

          {/* Official Emergency Contact Direct Dial */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--coral-subtle)',
              border: '1px solid var(--coral-emergency)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#FECDD3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <PhoneCall size={14} color="var(--coral-emergency)" />
            <span>CRISIS HOTLINE: <a href="tel:112" style={{ color: 'white', fontWeight: '800', textDecoration: 'underline' }}>DIAL 112 (POLICE / AMBULANCE)</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};
