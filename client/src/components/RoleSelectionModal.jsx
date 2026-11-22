import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Ambulance,
  Radio,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';

export const RoleSelectionModal = ({ isOpen, onClose, canDismiss = false, isDismissible = false }) => {
  const { user, updateRole } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Smart close button behavior:
  // If user.roleSelected !== true (mandatory first-time onboarding gate), keep it non-dismissible (no close button).
  // If user.roleSelected === true (opened later from settings to change roles), allow dismissal.
  const allowDismiss = Boolean(
    (canDismiss || isDismissible) &&
    user?.roleSelected === true &&
    typeof onClose === 'function'
  );

  const roles = [
    {
      id: 'CITIZEN',
      title: 'Citizen',
      tagline: 'Need Help / Personal Safety',
      badge: 'Immediate Help',
      accentColor: '#E11D48',
      accentBorder: 'rgba(225, 29, 72, 0.65)',
      accentGlow: 'rgba(225, 29, 72, 0.22)',
      icon: ShieldAlert,
      iconColor: '#E11D48',
      iconBg: 'rgba(225, 29, 72, 0.14)',
      description:
        'Activate 1-tap SOS assistance, broadcast live GPS breadcrumbs to family contacts, and track incoming paramedic units on real road routes.',
      route: '/dashboard',
      actionLabel: 'Continue as Citizen',
    },
    {
      id: 'RESPONDER',
      title: 'Responder / Paramedic',
      tagline: 'Help Others / Field Duty',
      badge: 'Field Ops',
      accentColor: '#3D789E',
      accentBorder: 'rgba(61, 120, 158, 0.65)',
      accentGlow: 'rgba(61, 120, 158, 0.22)',
      icon: Ambulance,
      iconColor: '#38BDF8',
      iconBg: 'rgba(56, 189, 248, 0.14)',
      description:
        'Respond to critical incidents in Gwalior, utilize on-scene 110 BPM CPR guidance, nearest hospital handover, and earn Verified Rescue Certificates.',
      route: '/responder',
      actionLabel: 'Continue as Responder',
    },
    {
      id: 'DISPATCHER',
      title: 'Control Room Dispatcher',
      tagline: 'Command Center & Triage',
      badge: 'HQ Operations',
      accentColor: '#3D789E',
      accentBorder: 'rgba(61, 120, 158, 0.65)',
      accentGlow: 'rgba(61, 120, 158, 0.22)',
      icon: Radio,
      iconColor: '#38BDF8',
      iconBg: 'rgba(56, 189, 248, 0.14)',
      description:
        'Monitor regional emergency heatmaps, manage incoming triage queue, dispatch paramedic fleets, and review audio evidence logs.',
      route: '/dispatch',
      actionLabel: 'Continue as Dispatcher',
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
        backgroundColor: 'rgba(5, 8, 14, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      {/* Unified Dark Slate Container */}
      <div
        className="bg-[#131A26] border border-white/10 rounded-2xl shadow-2xl"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#131A26',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 40px rgba(0, 0, 0, 0.5)',
          padding: '2.25rem 2rem',
          position: 'relative',
        }}
      >
        {/* Smart Dismissible Close (×) Button */}
        {allowDismiss && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#CBD5E1',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#CBD5E1';
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Modal Header: Crisp Flat Layout */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: '800',
              color: '#F8FAFC',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Choose your role
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#CBD5E1',
              maxWidth: '480px',
              margin: '0 auto',
              lineHeight: 1.55,
            }}
          >
            You can switch roles anytime from your account settings.
          </p>
        </div>

        {/* 3 Equal Role Cards with Subtle Neutral Borders & Smooth Hover/Select Highlights */}
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
            const isHighlighted = hoveredRole === item.id || selectedRole === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredRole(item.id)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => setSelectedRole(item.id)}
                className="bg-[#1A2333] border border-white/15"
                style={{
                  backgroundColor: '#1A2333',
                  border: isHighlighted
                    ? `1.5px solid ${item.accentBorder}`
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isHighlighted
                    ? `0 0 24px ${item.accentGlow}, 0 8px 24px rgba(0, 0, 0, 0.35)`
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transform: isHighlighted ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* Card Icon & Neutral Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.15rem',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '0.75rem',
                        backgroundColor: item.iconBg,
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
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: '#CBD5E1',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: '800',
                      color: '#F8FAFC',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {item.title}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: item.iconColor,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {item.tagline}
                  </div>

                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#94A3B8',
                      lineHeight: 1.55,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRole(item.id);
                    handleSelectAndProceed(item.id, item.route);
                  }}
                  disabled={loading}
                  style={{
                    backgroundColor: isHighlighted ? item.accentColor : 'rgba(255, 255, 255, 0.08)',
                    color: isHighlighted ? '#FFFFFF' : '#F8FAFC',
                    border: isHighlighted
                      ? `1px solid ${item.accentColor}`
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '0.625rem',
                    padding: '0.7rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: isHighlighted ? `0 4px 14px ${item.accentGlow}` : 'none',
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
            );
          })}
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
          Session authenticated for <strong style={{ color: '#F8FAFC' }}>{user?.email || 'User'}</strong>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
