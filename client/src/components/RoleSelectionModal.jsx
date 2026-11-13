import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MagicCard } from './ui/MagicCard';
import {
  ShieldAlert,
  Ambulance,
  Radio,
  CheckCircle,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';

export const RoleSelectionModal = ({ isOpen, onClose, canDismiss = false }) => {
  const { user, updateRole } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(user?.role || 'CITIZEN');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const roles = [
    {
      id: 'CITIZEN',
      title: 'Citizen',
      tagline: 'Need Help / Personal Safety',
      badge: 'Immediate Help',
      badgeColor: '#E11D48',
      badgeBg: 'rgba(225, 29, 72, 0.12)',
      icon: ShieldAlert,
      iconColor: '#E11D48',
      description:
        'Activate 1-tap SOS assistance, broadcast live GPS breadcrumbs to family contacts, and track incoming paramedic units on real road routes.',
      route: '/dashboard',
      actionLabel: 'Enter as Citizen',
    },
    {
      id: 'RESPONDER',
      title: 'Responder / Paramedic',
      tagline: 'Help Others / Field Duty',
      badge: 'Field Ops',
      badgeColor: '#059669',
      badgeBg: 'rgba(5, 150, 105, 0.12)',
      icon: Ambulance,
      iconColor: '#059669',
      description:
        'Respond to critical incidents in Gwalior, utilize on-scene 110 BPM CPR guidance, nearest hospital handover, and earn Verified Rescue Certificates.',
      route: '/responder',
      actionLabel: 'Enter as Responder',
    },
    {
      id: 'DISPATCHER',
      title: 'Control Room Dispatcher',
      tagline: 'Command Center & Triage',
      badge: 'HQ Operations',
      badgeColor: '#2563EB',
      badgeBg: 'rgba(37, 99, 235, 0.12)',
      icon: Radio,
      iconColor: '#2563EB',
      description:
        'Monitor regional emergency heatmaps, manage incoming triage queue, dispatch paramedic fleets, and review audio evidence logs.',
      route: '/dispatch',
      actionLabel: 'Enter as Dispatcher',
    },
  ];

  const handleSelectAndProceed = async (roleId, route) => {
    setLoading(true);
    try {
      if (updateRole) {
        await updateRole(roleId);
      }
      if (onClose) onClose();
      navigate(route);
    } catch (err) {
      console.error('Failed to update role:', err);
      // Fallback navigation
      if (onClose) onClose();
      navigate(route);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        className="card-clean"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FAF9F6',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {canDismiss && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: '700',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={13} />
            <span>Welcome to Clinical Sanctuary</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            How would you like to use Clinical Sanctuary?
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
            Choose your primary experience. You can switch your role anytime from the header pill.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          {roles.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedRole === item.id;

            return (
              <MagicCard
                key={item.id}
                onClick={() => setSelectedRole(item.id)}
                gradientColor={item.badgeBg.replace('0.12', '0.25')}
                spotlightBorderColor={item.badgeColor}
                borderColor={isSelected ? item.badgeColor : 'var(--border-subtle)'}
                borderRadius="1rem"
                style={{
                  borderWidth: isSelected ? '2.5px' : '1.5px',
                  boxShadow: isSelected ? `0 14px 30px -5px ${item.badgeBg}` : '0 2px 6px rgba(0, 0, 0, 0.03)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '0.75rem',
                          backgroundColor: item.badgeBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.iconColor,
                        }}
                      >
                        <Icon size={24} />
                      </div>

                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          color: item.badgeColor,
                          backgroundColor: item.badgeBg,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {item.title}
                    </h3>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: item.badgeColor, marginBottom: '0.75rem' }}>
                      {item.tagline}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAndProceed(item.id, item.route);
                    }}
                    disabled={loading}
                    style={{
                      backgroundColor: isSelected ? item.badgeColor : 'var(--surface-elevated)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.65rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: isSelected ? `0 4px 14px ${item.badgeBg}` : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {loading && selectedRole === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </MagicCard>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Session authenticated for <strong style={{ color: 'var(--text-main)' }}>{user?.email || 'User'}</strong>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
