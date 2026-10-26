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
} from 'lucide-react';
import api from '../services/api';

export const UberResponseCard = ({
  incident,
  onStatusUpdated,
  onCancelRequested,
}) => {
  const [advancing, setAdvancing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!incident || ['RESOLVED', 'CANCELLED'].includes(incident.status)) {
    return null;
  }

  const isSearching = ['CREATED', 'SUBMITTED', 'ACTIVE', 'NOTIFYING', 'NOTIFIED', 'PARTIALLY_FAILED'].includes(incident.status);
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
      className="card-clean"
      style={{
        margin: '1.25rem 0',
        border: '2px solid var(--teal-primary)',
        boxShadow: '0 8px 30px rgba(25, 182, 164, 0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner indicating Uber-style status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isArrived ? 'var(--status-success)' : (isEnRoute ? 'var(--coral-emergency)' : 'var(--teal-primary)'),
              animation: 'emergency-pulse 1.3s infinite',
            }}
          />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              UBER-ASSISTANCE WORKFLOW
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#FFFFFF' }}>
              {isSearching && '🔍 Dispatching Nearest Paramedic Unit...'}
              {isAssigned && '✅ Paramedic Unit Matched & Assigned'}
              {isEnRoute && '🚑 Emergency Unit En Route (Sirens Active)'}
              {isArrived && '📍 Unit Arrived On Scene (Medical Triage Active)'}
            </div>
          </div>
        </div>

        {/* Live ETA Box */}
        {(isEnRoute || isAssigned) && (
          <div
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--teal-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Clock size={16} color="var(--teal-primary)" />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Estimated Arrival</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--teal-primary)' }}>
                {responder?.eta || '3 mins'} ({responder?.distance || '850m away'})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Dots: Uber-style route timeline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.75rem 0 1.25rem 0', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            right: '5%',
            height: '3px',
            backgroundColor: 'var(--surface-elevated)',
            zIndex: 1,
            transform: 'translateY(-50%)',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: 'var(--teal-primary)',
              width: isSearching ? '25%' : (isAssigned ? '50%' : (isEnRoute ? '75%' : '100%')),
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {[
          { label: 'Dispatched', active: true },
          { label: 'Matched', active: isAssigned || isEnRoute || isArrived },
          { label: 'En Route', active: isEnRoute || isArrived },
          { label: 'Arrived', active: isArrived },
        ].map((step, idx) => (
          <div key={idx} style={{ zIndex: 2, textAlign: 'center', backgroundColor: 'var(--surface-primary)', padding: '0 4px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: step.active ? 'var(--teal-primary)' : 'var(--surface-elevated)',
                border: step.active ? '2px solid #FFFFFF' : '2px solid var(--border-subtle)',
                color: step.active ? '#071A12' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 4px auto',
              }}
            >
              {idx + 1}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: step.active ? '700' : '500', color: step.active ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* If Searching, show animated Radar Ping */}
      {isSearching && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--teal-primary)',
            textAlign: 'center',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(25, 182, 164, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
              animation: 'emergency-pulse 1.5s infinite',
            }}
          >
            <Radio size={26} color="var(--teal-primary)" />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Broadcasting to Nearest Emergency Fleets
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
            Locating certified paramedic units and ALS ambulances within Gwalior emergency corridor...
          </div>
        </div>
      )}

      {/* Responder Profile Box (Uber Driver Card) */}
      {(isAssigned || isEnRoute || isArrived) && responder && (
        <div
          style={{
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 182, 164, 0.2)',
                border: '2px solid var(--teal-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ambulance size={26} color="var(--teal-primary)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#FFFFFF' }}>
                  {responder.name || 'Officer Vikram Singh'}
                </span>
                <span title="Verified Emergency Responder" style={{ display: 'flex' }}>
                  <ShieldCheck size={16} color="var(--teal-primary)" />
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--teal-primary)', fontWeight: '600' }}>
                {responder.vehicle || 'ALS Ambulance (DL-01-EM-402)'} &bull; {responder.badgeNumber || 'EMS-042'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
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
              {copied ? <CheckCircle size={14} color="var(--status-success)" /> : <Share2 size={14} />}
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
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={handleSimulateNextStep}
          disabled={advancing}
          style={{
            backgroundColor: 'var(--teal-subtle)',
            color: 'var(--teal-primary)',
            border: '1px solid var(--teal-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.85rem',
            fontSize: '0.76rem',
            fontWeight: '700',
            cursor: advancing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}
          title="Advances the Uber lifecycle for testing without needing a second device"
        >
          <Zap size={14} color="var(--teal-primary)" />
          {advancing ? 'Updating Fleet Dispatch...' : (
            isSearching ? '⚡ Auto-Match Nearby Paramedic (Demo)' : (
              isAssigned ? '⚡ Start Driving (Switch to EN_ROUTE)' : (
                isEnRoute ? '⚡ Mark Paramedic ARRIVED' : '⚡ Complete Medical Care (RESOLVE)'
              )
            )
          )}
        </button>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Incident Code: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{incident.incidentCode}</strong>
        </span>
      </div>
    </div>
  );
};