import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Activity,
  Heart,
  Users,
  History,
  LogOut,
  Mic,
  MicOff,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export const MainLayout = ({
  children,
  gpsStatus = 'Active',
  voiceActive = false,
  onToggleVoice,
  voiceSupported = true,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Activity },
    { path: '/medical-profile', label: 'Medical Profile', icon: Heart },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/history', label: 'Case History', icon: History },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#070b14' }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Brand / Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1.1 }}>
              Clinical Sanctuary
            </h1>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>
              Smart Emergency Alert System
            </span>
          </div>
        </Link>

        {/* Status Indicators & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Telemetry Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* GPS Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#1e293b',
                padding: '0.3rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                color: gpsStatus === 'Active' ? '#10b981' : '#f59e0b',
                border: '1px solid #334155',
              }}
            >
              <MapPin size={13} />
              <span>GPS: {gpsStatus}</span>
            </div>

            {/* Voice Listener Toggle Pill */}
            {voiceSupported && onToggleVoice && (
              <button
                type="button"
                onClick={onToggleVoice}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: voiceActive ? '#ef444420' : '#1e293b',
                  borderColor: voiceActive ? '#ef4444' : '#334155',
                  color: voiceActive ? '#ef4444' : '#94a3b8',
                  border: '1px solid',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={voiceActive ? 'Click to disable voice listener' : 'Click to enable voice trigger'}
              >
                {voiceActive ? <Mic size={13} className="animate-pulse" /> : <MicOff size={13} />}
                <span>Voice SOS: {voiceActive ? 'Listening ("Emergency")' : 'Off'}</span>
              </button>
            )}
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: '600',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    backgroundColor: isActive ? '#1e293b' : 'transparent',
                    border: isActive ? '1px solid #334155' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem', borderLeft: '1px solid #1e293b' }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#cbd5e1', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>

              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* Academic Footer */}
      <footer
        style={{
          borderTop: '1px solid #1e293b',
          backgroundColor: '#070b14',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
        }}
      >
        <div>
          <strong>Clinical Sanctuary Emergency Alert System</strong> &bull; BTech AI Macro Project (June 2026)
        </div>
        <div>
          Madhav Institute of Technology & Science (MITS), Gwalior &bull; Aditya Chourasiya & Anurag Singh Yadav &bull; Supervised by Dr. Anu Sayal
        </div>
      </footer>
    </div>
  );
};
