import React from 'react';
import { HeartPulse, Car, Flame, ShieldAlert } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'MEDICAL',
    label: 'Medical',
    subtitle: 'Health & Cardiac Emergency',
    icon: HeartPulse,
    accent: '#ef4444',
  },
  {
    id: 'ACCIDENT',
    label: 'Accident',
    subtitle: 'Road Incident & Collision',
    icon: Car,
    accent: '#f59e0b',
  },
  {
    id: 'FIRE',
    label: 'Fire',
    subtitle: 'Smoke & Fire Outbreak',
    icon: Flame,
    accent: '#f97316',
  },
  {
    id: 'CRIME',
    label: 'Safety / Crime',
    subtitle: 'Personal Threat & Harassment',
    icon: ShieldAlert,
    accent: '#8b5cf6',
  },
];

export const IncidentCategorySelector = ({ selectedCategory, onSelect, disabled }) => {
  return (
    <div style={{ margin: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Incident Type
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Auto-defaults to Medical
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
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
                backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.65)',
                border: isSelected ? `2px solid ${cat.accent}` : '1px solid #1e293b',
                boxShadow: isSelected ? `0 0 15px -3px ${cat.accent}40` : 'none',
                borderRadius: '10px',
                padding: '0.85rem 0.6rem',
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
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: `${cat.accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: cat.accent,
                  marginBottom: '0.4rem',
                }}
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>

              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                {cat.label}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>
                {cat.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
