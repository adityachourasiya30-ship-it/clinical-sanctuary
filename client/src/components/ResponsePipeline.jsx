import React from 'react';
import { CheckCircle2, Clock, Radio, Truck, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';

export const ResponsePipeline = ({ status, notificationCount = 0, isSimulated = false, assignedResponder = null }) => {
  // Determine active step index:
  // 1: Created / Location Pending
  // 2: Active / Location Streaming
  // 3: Notified
  // 4: Assigned / En Route
  // 5: Resolved
  let activeStep = 0;
  if (['CREATED', 'LOCATION_PENDING'].includes(status)) activeStep = 1;
  if (['ACTIVE', 'NOTIFYING'].includes(status)) activeStep = 2;
  if (['NOTIFIED', 'NOTIFICATION_ATTEMPTED', 'PARTIALLY_FAILED'].includes(status)) activeStep = 3;
  if (['ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(status)) activeStep = 4;
  if (status === 'RESOLVED') activeStep = 5;
  if (status === 'CANCELLED') activeStep = 0;

  const steps = [
    { id: 1, title: 'SOS Activated', desc: 'Emergency broadcast triggered' },
    { id: 2, title: 'Live GPS Shared', desc: 'Continuous telemetry active' },
    { id: 3, title: 'Contacts Alerted', desc: isSimulated ? 'Dispatched (Simulated Dev Mode)' : 'SMS notification confirmed' },
    { id: 4, title: 'Responder Matching', desc: assignedResponder ? `${assignedResponder.name || 'Paramedic'} En Route` : 'Station dispatch notified' },
    { id: 5, title: 'Case Concluded', desc: status === 'RESOLVED' ? 'Marked safe and resolved' : 'Awaiting arrival & triage' },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        margin: '1.25rem 0',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--teal-subtle)',
              color: 'var(--teal-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '0.85rem',
              border: '1px solid var(--teal-border)',
            }}
          >
            01
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>Response Pipeline</h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real-time Emergency Lifecycle</span>
          </div>
        </div>

        {status && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: status === 'RESOLVED' ? 'var(--status-success-bg)' : status === 'CANCELLED' ? 'var(--surface-elevated)' : 'var(--coral-subtle)',
              border: `1px solid ${status === 'RESOLVED' ? 'var(--status-success)' : status === 'CANCELLED' ? 'var(--border-subtle)' : 'var(--coral-emergency)'}`,
              color: status === 'RESOLVED' ? 'var(--status-success)' : status === 'CANCELLED' ? 'var(--text-secondary)' : 'var(--coral-emergency)',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: status === 'RESOLVED' ? 'var(--status-success)' : status === 'CANCELLED' ? 'var(--text-muted)' : 'var(--coral-emergency)',
                display: 'inline-block',
              }}
            />
            {status}
          </div>
        )}
      </div>

      {/* Stepper track */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {steps.map((s) => {
          const isDone = activeStep >= s.id;
          const isCurrent = activeStep === s.id - 1;

          return (
            <div
              key={s.id}
              style={{
                backgroundColor: isDone ? 'var(--surface-elevated)' : 'var(--surface-primary)',
                border: isDone ? '1px solid var(--teal-border)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {isDone ? (
                  <CheckCircle2 size={18} color="var(--teal-primary)" strokeWidth={2.4} />
                ) : (
                  <Clock size={18} color="var(--text-muted)" />
                )}
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    color: isDone ? 'var(--text-main)' : 'var(--text-muted)',
                  }}
                >
                  {s.title}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {s.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responder & Operational Status Bar */}
      {status && !['RESOLVED', 'CANCELLED'].includes(status) && (
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                backgroundColor: 'var(--surface-elevated)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Truck size={14} color="var(--teal-primary)" />
              <span>
                Helpline Fallback: <strong>112 (National) / 108 (Medical)</strong>
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-elevated)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Radio size={14} color="var(--status-success)" />
              <span>
                Telemetry Interval: <strong>5s Continuous</strong>
              </span>
            </div>

            {assignedResponder && (
              <div
                style={{
                  backgroundColor: 'var(--teal-subtle)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--teal-primary)',
                  border: '1px solid var(--teal-border)',
                }}
              >
                <UserCheck size={14} />
                <span>
                  Responder: <strong>{assignedResponder.name}</strong> ({assignedResponder.vehicleType || 'Ambulance'})
                </span>
              </div>
            )}
          </div>

          {notificationCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Contacts notified: <strong style={{ color: 'var(--teal-primary)' }}>{notificationCount}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
