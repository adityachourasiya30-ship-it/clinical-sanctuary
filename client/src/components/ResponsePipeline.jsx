import React from 'react';
import { CheckCircle2, Clock, Radio, Truck, AlertTriangle } from 'lucide-react';

export const ResponsePipeline = ({ status, notificationCount = 0, isSimulated = false }) => {
  // Determine current step index based on status
  // 0: Idle, 1: Created/Active, 2: Location Shared, 3: Contacts Notified, 4: Dispatched / Ready
  let activeStep = 0;
  if (status === 'CREATED' || status === 'ACTIVE') activeStep = 2;
  if (status === 'NOTIFYING') activeStep = 2;
  if (status === 'NOTIFIED' || status === 'PARTIALLY_FAILED') activeStep = 3;
  if (status === 'RESOLVED') activeStep = 4;

  const steps = [
    { id: 1, title: 'SOS Activated', desc: 'Emergency broadcast triggered' },
    { id: 2, title: 'Location Shared', desc: 'GPS telemetry stream active' },
    { id: 3, title: 'Contacts Notified', desc: isSimulated ? 'Dispatched (Dev Simulated)' : 'SMS broadcast delivered' },
    { id: 4, title: 'Emergency Dispatch', desc: status === 'RESOLVED' ? 'Emergency Case Resolved' : 'Responders notified' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#141e33',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '1.25rem',
        margin: '1.25rem 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#3b82f620',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.85rem',
            }}
          >
            01
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc' }}>Response Pipeline</h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Live Status Monitoring</span>
          </div>
        </div>

        {status && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: status === 'RESOLVED' ? '#10b98120' : '#ef444420',
              border: `1px solid ${status === 'RESOLVED' ? '#10b98150' : '#ef444450'}`,
              color: status === 'RESOLVED' ? '#10b981' : '#ef4444',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: status === 'RESOLVED' ? '#10b981' : '#ef4444',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          position: 'relative',
        }}
      >
        {steps.map((s) => {
          const isDone = activeStep >= s.id;
          const isCurrent = activeStep === s.id - 1;

          return (
            <div
              key={s.id}
              style={{
                backgroundColor: isDone ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.4)',
                border: isDone ? '1px solid #3b82f6' : '1px solid #1e293b',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '2px' }}>
                {isDone ? (
                  <CheckCircle2 size={18} color="#3b82f6" strokeWidth={2.5} />
                ) : (
                  <Clock size={18} color="#475569" />
                )}
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    color: isDone ? '#f8fafc' : '#64748b',
                  }}
                >
                  {s.title}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency dispatch metadata cards */}
      {status && status !== 'RESOLVED' && (
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #1e293b',
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
                backgroundColor: '#1e293b',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#cbd5e1',
              }}
            >
              <Truck size={14} color="#38bdf8" />
              <span>
                Nearest Emergency Services: <strong>108 (Medical) / 112 (National)</strong>
              </span>
            </div>

            <div
              style={{
                backgroundColor: '#1e293b',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#cbd5e1',
              }}
            >
              <Radio size={14} color="#10b981" />
              <span>
                Telemetry Interval: <strong>5 Seconds Live</strong>
              </span>
            </div>
          </div>

          {notificationCount > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Contacts contacted: <strong style={{ color: '#10b981' }}>{notificationCount}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
