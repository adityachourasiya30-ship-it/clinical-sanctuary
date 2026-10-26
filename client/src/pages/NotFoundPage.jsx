import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, PhoneCall, Building2 } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div className="card-clean" style={{ maxWidth: '520px', width: '100%', padding: '3rem 2rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--coral-subtle)',
            color: 'var(--coral-emergency)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '2px solid var(--coral-emergency)',
          }}
        >
          <ShieldAlert size={34} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          404 — Page Not Found
        </h1>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem' }}>
          The requested emergency navigation path does not exist or has been relocated.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn-teal" style={{ justifyContent: 'center' }}>
            <ArrowLeft size={16} /> Return to Emergency Dashboard
          </Link>

          <Link to="/hospitals" className="btn-secondary" style={{ justifyContent: 'center' }}>
            <Building2 size={16} /> Find Nearby Healthcare Centers
          </Link>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--coral-subtle)',
              border: '1px solid var(--coral-emergency)',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#FECDD3' }}>
              In an active crisis? <a href="tel:112" style={{ color: 'white', fontWeight: '800', textDecoration: 'underline' }}>Dial 112 (National Emergency)</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
