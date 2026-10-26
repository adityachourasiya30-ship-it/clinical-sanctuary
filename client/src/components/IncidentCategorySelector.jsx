import React from 'react';
import { HeartPulse, Car, Flame, ShieldAlert, Siren, AlertCircle, Clock } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'MEDICAL',
    label: 'Medical',
    subtitle: 'Cardiac & Health Crisis',
    eta: '~3-4m',
    unitType: 'ALS Ambulance',
    icon: HeartPulse,
    accent: '#FF5A52',
  },
  {
    id: 'ACCIDENT',
    label: 'Road Accident',
    subtitle: 'Collision & Trauma',
    eta: '~4-5m',
    unitType: 'Trauma Unit',
    icon: Car,
    accent: '#F59E0B',
  },
  {
    id: 'FIRE',
    label: 'Fire & Smoke',
    subtitle: 'Hazmat & Structure',
    eta: '~5-7m',
    unitType: 'Fire Tender',
    icon: Flame,
    accent: '#FB923C',
  },
  {
    id: 'CRIME',
    label: 'Personal Safety',
    subtitle: 'Threat & Physical Danger',
    eta: '~3-4m',
    unitType: 'Rapid Patrol',
    icon: ShieldAlert,
    accent: '#19B6A4',
  },
  {
    id: 'POLICE',
    label: 'Police Dispatch',
    subtitle: 'Law Enforcement Need',
    eta: '~3-5m',
    unitType: 'PCR Unit',
    icon: Siren,
    accent: '#38BDF8',
  },
  {
    id: 'GENERAL',
    label: 'Other Danger',
    subtitle: 'General Emergency',
    eta: '~5-6m',
    unitType: 'Response Team',
    icon: AlertCircle,
    accent: '#A78BFA',
  },
];

export const IncidentCategorySelector = ({
  selectedCategory,
  onSelect,
  isEmergencyActive = false,
  onCategoryChangeWhileActive = null,
}) => {
  const handleCategoryClick = (catId) => {
    if (isEmergencyActive && onCategoryChangeWhileActive) {
      if (catId !== selectedCategory) {
        onCategoryChangeWhileActive(catId);
      }
    } else {
      onSelect(catId);
    }
  };

  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Emergency Service Tier
          </span>
          {isEmergencyActive && (
            <span
              style={{
                fontSize: '0.68rem',
                backgroundColor: 'var(--coral-subtle)',
                color: 'var(--coral-emergency)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: '700',
              }}
            >
              Active • Click to Switch
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Real-time ETA Estimates
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.65rem',
        }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.id)}
              style={{
                backgroundColor: isSelected ? 'var(--surface-elevated)' : 'var(--surface-primary)',
                border: isSelected ? `2px solid ${cat.accent}` : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? `0 0 16px -2px ${cat.accent}55` : 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {/* ETA Pill like Uber */}
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  color: cat.accent,
                  backgroundColor: `${cat.accent}15`,
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                <Clock size={9} />
                {cat.eta}
              </div>

              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${cat.accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.45rem',
                  marginTop: '0.3rem',
                }}
              >
                <Icon size={19} color={cat.accent} />
              </div>

              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                  marginBottom: '0.2rem',
                }}
              >
                {cat.label}
              </span>

              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.2,
                }}
              >
                {cat.unitType}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};