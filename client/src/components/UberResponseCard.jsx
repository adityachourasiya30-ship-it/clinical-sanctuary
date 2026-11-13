import React, { useState } from 'react';
import {
  Ambulance,
  PhoneCall,
  Share2,
  CheckCircle,
  Navigation,
  Clock,
  Radio,
  Sparkles,
  Zap,
  Copy,
  ExternalLink,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import api from '../services/api';
import { TelemetrySyncBeam } from './ui/AnimatedBeam';

export const UberResponseCard = ({
  incident,
  onStatusUpdated,
  onCancelRequested,
  isFloating = false,
}) => {
  const [advancing, setAdvancing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!incident || ['RESOLVED', 'CANCELLED'].includes(incident.status)) {
    return null;
  }

  const isSearching = ['SEARCHING', 'CREATED', 'SUBMITTED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED'].includes(incident.status);
  const isAssigned = incident.status === 'ASSIGNED';
  const isEnRoute = incident.status === 'EN_ROUTE';
  const isArrived = incident.status === 'ARRIVED';

  // Extract responder details if available
  const responder = incident.assignedResponder || (isAssigned || isEnRoute || isArrived ? {
    name: 'Officer Vikram Singh',
    role: 'Emergency Paramedic Lead',
    vehicle: 'Advanced Life Support Ambulance (ALS-104)',
    badgeNumber: 'EMS-GWL-042',
    phone: '+919876543210',
    rating: '4.98 ★ (340 Responses)',
    distance: isEnRoute ? '0.8 km' : (isArrived ? 'On Scene' : '1.4 km'),
    eta: isEnRoute ? '2 mins' : (isArrived ? 'Arrived' : '4 mins'),
  } : null);

  const handleSimulateNextStep = async () => {
    setAdvancing(true);
    try {
      const incId = incident._id || incident.id || incident.incidentCode;
      const res = await api.post(`/incidents/${incId}/simulate-flow`);
      if (res.data.success && onStatusUpdated) {
        onStatusUpdated(res.data.incident);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleCopyTrackLink = () => {
    const url = `${window.location.origin}/track/${incident.incidentCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={isFloating ? '' : 'card-clean'}
      style={{
        margin: isFloating ? '0' : '1.25rem 0',
        backgroundColor: isFloating ? 'rgba(255, 255, 255, 0.95)' : 'var(--surface-primary, #FFFFFF)',
        backdropFilter: isFloating ? 'blur(16px)' : undefined,
        WebkitBackdropFilter: isFloating ? 'blur(16px)' : undefined,
        border: isFloating ? '1.5px solid rgba(226, 232, 240, 0.9)' : '2px solid var(--teal-primary)',
        borderRadius: isFloating ? '24px' : 'var(--radius-md, 16px)',
        boxShadow: isFloating
          ? '0 12px 40px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)'
          : '0 8px 30px rgba(25, 182, 164, 0.18)',
        padding: isFloating ? '1.25rem 1.4rem' : '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        maxHeight: isFloating ? '80vh' : undefined,
        overflowY: isFloating ? 'auto' : undefined,
      }}
    >
      {/* Top Banner indicating Uber-style status & Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isArrived
                ? 'var(--status-success, #059669)'
                : isEnRoute
                ? 'var(--coral-emergency, #E11D48)'
                : 'var(--teal-primary, #059669)',
              animation: 'emergency-pulse 1.3s infinite',
            }}
          />
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: 'var(--text-secondary, #475569)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              UBER-DISPATCH TELEMETRY
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: '900',
                color: 'var(--text-main, #0F172A)',
                letterSpacing: '-0.01em',
              }}
            >
              {isSearching && '🔍 Dispatching Nearest Certified Paramedic...'}
              {isAssigned && '✅ Paramedic Unit Matched & Assigned'}
              {isEnRoute && '🚑 Emergency Unit En Route (Sirens Active)'}
              {isArrived && '📍 Paramedic Arrived On Scene'}
            </div>
          </div>
        </div>

        {/* Status Badges: Pickup OTP & Live ETA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Pickup OTP Box with JetBrains Mono font */}
          {incident.pickupOtp && (
            <div
              style={{
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                border: '1.5px solid var(--teal-primary, #059669)',
                borderRadius: '12px',
                padding: '0.35rem 0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
              title="Share this 4-digit code with the Paramedic upon arrival to verify response"
            >
              <ShieldCheck size={16} color="var(--teal-primary, #059669)" />
              <div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '800',
                  }}
                >
                  Pickup OTP
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: '900',
                    color: '#059669',
                    letterSpacing: '0.12em',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    lineHeight: 1.1,
                  }}
                >
                  {incident.pickupOtp}
                </div>
              </div>
            </div>
          )}

          {/* Live ETA Box */}
          {(isEnRoute || isAssigned) && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid var(--teal-primary, #059669)',
                borderRadius: '12px',
                padding: '0.35rem 0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Clock size={16} color="var(--teal-primary, #059669)" />
              <div>
                <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: '700' }}>Estimated Arrival</div>
                <div style={{ fontSize: '0.92rem', fontWeight: '900', color: 'var(--teal-primary, #059669)', lineHeight: 1.1 }}>
                  {responder?.eta || '3 mins'} &bull; {responder?.distance || '850m away'}
                </div>
              </div>
            </div>
          )}

          {/* Tier Badge */}
          {incident.responderTier && (
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: '800',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                backgroundColor:
                  incident.responderTier === 'TIER_1_TRANSPORT' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(5, 150, 105, 0.15)',
                color: incident.responderTier === 'TIER_1_TRANSPORT' ? '#2563EB' : '#059669',
                border: `1.5px solid ${incident.responderTier === 'TIER_1_TRANSPORT' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(5, 150, 105, 0.35)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={12} />
              {incident.responderTier === 'TIER_1_TRANSPORT' ? 'Tier 1: Transport' : 'Tier 2: Medical ALS'}
            </div>
          )}
        </div>
      </div>

      {/* Magic UI AnimatedBeam: [Citizen GPS] ➔ [Live Dispatch] ➔ [Responder Unit] */}
      <div style={{ margin: '0.75rem 0 1rem 0' }}>
        <TelemetrySyncBeam
          status={incident.status}
          responderName={responder?.name}
          responderTier={incident.responderTier}
          eta={responder?.eta || '3 mins'}
          distance={responder?.distance || '0.8 km'}
        />
      </div>

      {/* If Searching, show radar ping & subtle Demo Match Button */}
      {isSearching && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            border: '1.5px dashed var(--teal-primary, #059669)',
            textAlign: 'center',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'rgba(5, 150, 105, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.5rem auto',
              animation: 'emergency-pulse 1.5s infinite',
            }}
          >
            <Radio size={24} color="var(--teal-primary, #059669)" />
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main, #0F172A)', marginBottom: '0.2rem' }}>
            Broadcasting to Nearest Emergency Fleets
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '400px', margin: '0 auto 0.75rem auto', lineHeight: 1.4 }}>
            Locating certified paramedic units and ALS ambulances within Gwalior emergency corridor...
          </div>

          <button
            type="button"
            onClick={handleSimulateNextStep}
            disabled={advancing}
            style={{
              backgroundColor: 'rgba(5, 150, 105, 0.12)',
              color: '#059669',
              border: '1.5px solid #059669',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: advancing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
              transition: 'all 0.15s ease',
            }}
            title="Instantly simulate an incoming responder match for solo testing without opening a second tab"
          >
            <Zap size={14} color="#059669" />
            {advancing ? 'Connecting Fleet Dispatch...' : '⚡ Simulate Responder Match (Demo)'}
          </button>
        </div>
      )}

      {/* Responder Profile Box (Uber Driver Card) */}
      {(isAssigned || isEnRoute || isArrived) && responder && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border-subtle, #E2E8F0)',
            borderRadius: '16px',
            padding: '0.9rem 1.15rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                border: '2px solid var(--teal-primary, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ambulance size={24} color="var(--teal-primary, #059669)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
                  {responder.name || 'Officer Vikram Singh'}
                </span>
                <span title="Verified Emergency Responder" style={{ display: 'flex' }}>
                  <ShieldCheck size={16} color="var(--teal-primary, #059669)" />
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--teal-primary, #059669)', fontWeight: '700' }}>
                {responder.vehicle || 'ALS Ambulance (DL-01-EM-402)'} &bull; {responder.badgeNumber || 'EMS-042'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                {responder.rating || 'Verified Medical Service • Immediate Priority Clearance'}
              </div>
            </div>
          </div>

          {/* Quick Contact Actions like Uber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href={`tel:${responder.phone || '9876543210'}`}
              className="btn-teal"
              style={{ fontSize: '0.78rem', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PhoneCall size={14} />
              Call Responder
            </a>

            <button
              type="button"
              onClick={handleCopyTrackLink}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {copied ? <CheckCircle size={14} color="var(--status-success, #059669)" /> : <Share2 size={14} />}
              {copied ? 'Link Copied!' : 'Share Live GPS'}
            </button>
          </div>
        </div>
      )}

      {/* Simulator & Live Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-subtle, #E2E8F0)',
        }}
      >
        <button
          type="button"
          onClick={handleSimulateNextStep}
          disabled={advancing}
          style={{
            backgroundColor: 'var(--teal-subtle, rgba(5, 150, 105, 0.1))',
            color: 'var(--teal-primary, #059669)',
            border: '1px solid var(--teal-border, rgba(5, 150, 105, 0.25))',
            borderRadius: '8px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.76rem',
            fontWeight: '800',
            cursor: advancing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}
          title="Advances the Uber lifecycle for testing without needing a second device"
        >
          <Zap size={14} color="var(--teal-primary, #059669)" />
          {advancing ? 'Updating Fleet Dispatch...' : (
            isSearching ? '⚡ Simulate Responder Match (Demo)' : (
              isAssigned ? '⚡ Start Driving (Switch to EN_ROUTE)' : (
                isEnRoute ? '⚡ Mark Paramedic ARRIVED' : '⚡ Complete Medical Care (RESOLVE)'
              )
            )
          )}
        </button>

        <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
          Incident Code: <strong style={{ color: 'var(--text-main, #0F172A)', fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}>{incident.incidentCode}</strong>
        </span>
      </div>
    </div>
  );
};

export default UberResponseCard;
