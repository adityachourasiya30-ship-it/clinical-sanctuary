import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Activity,
  Heart,
  Users,
  History,
  Building2,
  Ambulance,
  Radio,
  Sliders,
  LogOut,
  Mic,
  MicOff,
  MapPin,
  PhoneCall,
  Menu,
  X,
  User,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Common navigation items
  const baseNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Activity },
    { path: '/hospitals', label: 'Hospitals', icon: Building2 },
    { path: '/contacts', label: 'Contacts', icon: Users },
    { path: '/medical-profile', label: 'Medical Card', icon: Heart },
    { path: '/history', label: 'History', icon: History },
  ];

  // Role-specific operational tabs
  const roleNavItems = [];
  if (user?.role === 'RESPONDER' || user?.role === 'ADMIN') {
    roleNavItems.push({ path: '/responder', label: 'Responder Duty', icon: Ambulance, badge: 'Duty' });
  }
  if (user?.role === 'DISPATCHER' || user?.role === 'ADMIN') {
    roleNavItems.push({ path: '/dispatch', label: 'Dispatch Queue', icon: Radio, badge: 'Ops' });
  }

  const allNavItems = [...baseNavItems, ...roleNavItems, { path: '/settings', label: 'Settings', icon: Sliders }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Official Government Emergency Services Banner */}
      <div
        style={{
          backgroundColor: '#0C1624',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.35rem 1.25rem',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--coral-emergency)', fontWeight: '700' }}>OFFICIAL HELPLINES:</span>
          <span>National Emergency: <strong style={{ color: 'var(--text-main)' }}>112</strong></span>
          <span>&bull;</span>
          <span>Police: <strong style={{ color: 'var(--text-main)' }}>100</strong></span>
          <span>&bull;</span>
          <span>Ambulance: <strong style={{ color: 'var(--text-main)' }}>108</strong></span>
        </div>
        <div>
          <a
            href="tel:112"
            style={{
              color: 'var(--coral-emergency)',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              textDecoration: 'underline',
            }}
          >
            <PhoneCall size={12} />
            Immediate 112 Direct Dial
          </a>
        </div>
      </div>

      {/* Main Top Header */}
      <header
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Brand / Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--coral-emergency)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 0 16px var(--coral-glow)',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.1 }}>
                Clinical Sanctuary
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  color: 'var(--teal-primary)',
                  backgroundColor: 'var(--teal-subtle)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--teal-border)',
                }}
              >
                PRO
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Precision in every Response
            </span>
          </div>
        </Link>

        {/* Telemetry Status Pills & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* GPS Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--surface-elevated)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              color: gpsStatus === 'Active' ? 'var(--status-success)' : 'var(--status-warning)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <MapPin size={13} />
            <span>GPS: {gpsStatus}</span>
          </div>

          {/* Voice Listener Toggle */}
          {voiceSupported && onToggleVoice && (
            <button
              type="button"
              onClick={onToggleVoice}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: voiceActive ? 'var(--coral-subtle)' : 'var(--surface-elevated)',
                borderColor: voiceActive ? 'var(--coral-emergency)' : 'var(--border-subtle)',
                color: voiceActive ? 'var(--coral-emergency)' : 'var(--text-secondary)',
                border: '1px solid',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={voiceActive ? 'Click to disable voice listener' : 'Click to enable voice trigger'}
            >
              {voiceActive ? <Mic size={13} className="animate-emergency-pulse" /> : <MicOff size={13} />}
              <span>Voice: {voiceActive ? 'Active ("Emergency")' : 'Off'}</span>
            </button>
          )}

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="desktop-nav">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.42rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--surface-elevated)' : 'transparent',
                    border: isActive ? '1px solid var(--teal-border)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} style={{ color: isActive ? 'var(--teal-primary)' : 'inherit' }} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: item.badge === 'Duty' ? 'var(--coral-subtle)' : 'var(--teal-subtle)',
                        color: item.badge === 'Duty' ? 'var(--coral-emergency)' : 'var(--teal-primary)',
                        fontWeight: '700',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Role Pill */}
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                paddingLeft: '0.6rem',
                borderLeft: '1px solid var(--border-subtle)',
              }}
            >
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
                    backgroundColor: 'var(--teal-primary)',
                    color: '#071520',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--teal-primary)', fontWeight: '600' }}>
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
                title="Log out session"
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral-emergency)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Container */}
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>

      {/* Professional Emergency Healthcare Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface-primary)',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ color: 'var(--text-main)' }}>Clinical Sanctuary (ClinicalGuard)</strong>
          <span>&bull;</span>
          <span>Next-Generation Smart Emergency Alert & Response Platform</span>
          <span>&bull;</span>
          <span style={{ color: 'var(--teal-primary)' }}>Precision in every Response</span>
        </div>
        <div>
          Madhav Institute of Technology & Science (MITS), Gwalior &bull; Aditya Chourasiya & Anurag Singh Yadav &bull; Supervised by Dr. Anu Sayal
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Disclaimer: This system supplements emergency communication. In imminent life-threatening crises, dial national emergency <strong>112</strong> immediately.
        </div>
      </footer>
    </div>
  );
};
