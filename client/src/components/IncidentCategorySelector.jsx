import React from 'react';
import { HeartPulse, Car, Flame, ShieldAlert, Siren, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'MEDICAL',
    label: 'Medical',
    subtitle: 'Cardiac & Health Crisis',
    icon: HeartPulse,
    accent: '#FF5A52',
  },
  {
    id: 'ACCIDENT',
    label: 'Road Accident',
    subtitle: 'Collision & Trauma',
    icon: Car,
    accent: '#F59E0B',
  },
  {
    id: 'FIRE',
    label: 'Fire & Smoke',
    subtitle: 'Hazmat & Structure Fire',
    icon: Flame,
    accent: '#FB923C',
  },
  {
    id: 'CRIME',
    label: 'Personal Safety',
    subtitle: 'Threat & Physical Danger',
    icon: ShieldAlert,
    accent: '#19B6A4',
  },
  {
    id: 'POLICE',
    label: 'Police Dispatch',
    subtitle: 'Law Enforcement Need',
    icon: Siren,
    accent: '#38BDF8',
  },
  {
    id: 'GENERAL',
    label: 'Other Danger',
    subtitle: 'General Emergency',
    icon: AlertCircle,
    accent: '#A78BFA',
  },
];

export const IncidentCategorySelector = ({ selectedCategory, onSelect, disabled }) => {
  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Select Emergency Category
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Defaults to Medical
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
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
              disabled={disabled}
              onClick={() => onSelect(cat.id)}
              style={{
                backgroundColor: isSelected ? 'var(--surface-elevated)' : 'var(--surface-primary)',
                border: isSelected ? `2px solid ${cat.accent}` : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? `0 0 16px -2px ${cat.accent}45` : 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${cat.accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: cat.accent,
                  marginBottom: '0.35rem',
                }}
              >
                <Icon size={18} strokeWidth={2.4} />
              </div>

              <span style={{ fontSize: '0.825rem', fontWeight: '700', color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                {cat.label}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                {cat.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
