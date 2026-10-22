import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, Mail, User, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('rahul.patient@example.com');
    setPassword('EmergencyPass2026!');
    if (isRegister) {
      setName('Rahul Sharma');
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
        backgroundColor: '#070b14',
      }}
    >
      <div
        style={{
          maxWidth: '920px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Left Hero Panel (Matches Milestone 3 Screenshot) */}
        <div
          style={{
            padding: '2.5rem',
            backgroundColor: '#0a0f1d',
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <ShieldAlert size={18} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', letterSpacing: '-0.01em', color: '#f8fafc' }}>
                Clinical Sanctuary
              </span>
            </div>

            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                letterSpacing: '0.1em',
                color: '#38bdf8',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              Medical Orchestration
            </span>

            <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.2, marginBottom: '1rem' }}>
              Precision in every Response.
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '2rem' }}>
              Access the Clinical Sanctuary gateway. Real-time medical telemetry, patient logistics, and instant emergency dispatch management.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#10b981' }}><ShieldCheck size={20} /></div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc' }}>Hi-Res Security</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Encrypted AES-256 patient telemetry pathways</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#38bdf8' }}><Zap size={20} /></div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc' }}>Low Latency</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Sub-second GPS updates & emergency routing</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #1e293b', fontSize: '0.7rem', color: '#475569' }}>
            &copy; 2026 Clinical Sanctuary &bull; Medical-Grade Precision
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.35rem' }}>
              {isRegister ? 'Create Sanctuary Account' : 'Sign In to Clinical Sanctuary'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {isRegister
                ? 'Register your profile to access smart emergency assistance.'
                : 'Please enter your medical credentials to proceed.'}
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  FULL NAME
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    style={{
                      width: '100%',
                      backgroundColor: '#141e33',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.35rem' }}>
                EMAIL OR HEALTH ID
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.patient@example.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#141e33',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8' }}>
                  SECURITY PASSWORD
                </label>
                {!isRegister && (
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', cursor: 'pointer' }}>
                    Forgot?
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    backgroundColor: '#141e33',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register & Access Sanctuary' : 'Access Sanctuary'}
            </button>
          </form>

          {/* Quick Demo Fill Pill for Fast Evaluation */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                backgroundColor: 'transparent',
                border: '1px dashed #334155',
                borderRadius: '6px',
                color: '#38bdf8',
                fontSize: '0.72rem',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Auto-fill sample credentials
            </button>
          </div>

          {/* Google Sign In Container */}
          <div style={{ margin: '1.25rem 0 0.5rem 0', textAlign: 'center' }}>
            <div id="googleSignInBtn" style={{ minHeight: '40px' }} />
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {isRegister ? (
                <>Already have an account? <strong style={{ color: '#38bdf8' }}>Sign In</strong></>
              ) : (
                <>New to the system? <strong style={{ color: '#38bdf8' }}>Create Account</strong></>
              )}
            </button>
          </div>

          {/* Emergency Bottom Alert Banner */}
          <div
            style={{
              marginTop: '1.75rem',
              padding: '0.65rem',
              borderRadius: '8px',
              backgroundColor: '#ef444415',
              border: '1px solid #ef444430',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: '#f87171',
              fontWeight: '600',
            }}
          >
            NEED URGENT HELP? CONTACT EMERGENCY DISPATCH (112 / 108)
          </div>
        </div>
      </div>
    </div>
  );
};
