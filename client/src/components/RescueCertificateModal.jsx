import React from 'react';
import { Award, Printer, X, ShieldCheck, CheckCircle2, HeartPulse } from 'lucide-react';

export const RescueCertificateModal = ({ isOpen, onClose, responder, profile, incident }) => {
  if (!isOpen) return null;

  const responderName = responder?.name || profile?.name || 'Officer Vikram Singh';
  const badgeNumber = profile?.badgeNumber || 'EMS-GWL-042';
  const isTier2 = profile?.responderTier === 'TIER_2_MEDICAL';
  const tierTitle = isTier2
    ? 'Certified Tier-2 Medical Responder (CPR & ALS)'
    : 'Verified Tier-1 First Responder (Emergency Transport)';
  const incidentCode = incident?.incidentCode || 'INC-2026-GWL-842';
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const certId = `CS-CERT-2026-${(profile?._id || 'GWL').toString().slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#FAF9F6',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        {/* Modal Controls (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} color="#059669" />
            <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A' }}>
              Verified Good Samaritan Rescue Credential
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-teal"
              style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
            >
              <Printer size={15} />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
                padding: '4px',
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div
          className="printable-certificate"
          style={{
            backgroundColor: '#FFFFFF',
            border: '6px double #059669',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            color: '#0F172A',
          }}
        >
          {/* Subtle Security Watermark */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.03,
              fontSize: '110px',
              fontWeight: '900',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            CLINICAL SANCTUARY
          </div>

          {/* Certificate Header Emblem */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                border: '2px solid #059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <HeartPulse size={34} />
            </div>
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: '800',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#059669',
              marginBottom: '0.35rem',
            }}
          >
            CLINICAL SANCTUARY EMERGENCY RESPONSE NETWORK &bull; INDIA
          </div>

          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '900',
              letterSpacing: '0.04em',
              color: '#0F172A',
              margin: '0 0 0.5rem 0',
              textTransform: 'uppercase',
            }}
          >
            Certificate of Verified Rescue
          </h1>

          <div
            style={{
              fontSize: '0.85rem',
              color: '#64748B',
              fontStyle: 'italic',
              marginBottom: '1.25rem',
            }}
          >
            Awarded under the Good Samaritan Emergency Response Protection Initiative
          </div>

          <p style={{ fontSize: '0.92rem', color: '#475569', marginBottom: '0.35rem' }}>
            This officially certifies that
          </p>

          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: '900',
              color: '#0F172A',
              padding: '0.35rem 0',
              borderBottom: '2px solid #E2E8F0',
              display: 'inline-block',
              minWidth: '320px',
              marginBottom: '0.65rem',
            }}
          >
            {responderName}
          </div>

          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: '700',
              color: '#059669',
              marginBottom: '1rem',
            }}
          >
            {tierTitle} &bull; Badge: {badgeNumber}
          </div>

          <p
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: '#334155',
              maxWidth: '600px',
              margin: '0 auto 1.5rem auto',
            }}
          >
            has successfully responded to Emergency Case <strong>{incidentCode}</strong>, administering
            vital Golden Hour medical triage and life stabilization in Gwalior Regional Emergency Corridor.
            All protocol actions have been cryptographically verified in the Clinical Sanctuary audit registry.
          </p>

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              maxWidth: '640px',
              margin: '0 auto 1.5rem auto',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase' }}>Certificate ID</div>
              <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{certId}</strong>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase' }}>Date of Rescue</div>
              <strong style={{ color: '#0F172A' }}>{issueDate}</strong>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase' }}>Jurisdiction</div>
              <strong style={{ color: '#0F172A' }}>Gwalior, Madhya Pradesh</strong>
            </div>
          </div>

          {/* Dual Official Signatures */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-end',
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px dashed #CBD5E1',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: '1.25rem',
                  color: '#059669',
                  marginBottom: '2px',
                }}
              >
                Dr. A. K. Sharma
              </div>
              <div style={{ borderTop: '1.5px solid #64748B', width: '160px', margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#475569' }}>Medical Director</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Clinical Sanctuary Network</div>
            </div>

            {/* Official Seal Badge */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '2px dashed #059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.55rem',
                  fontWeight: '800',
                  textAlign: 'center',
                  letterSpacing: '0.04em',
                }}
              >
                <CheckCircle2 size={16} />
                <span>OFFICIAL</span>
                <span>SEAL</span>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: '1.25rem',
                  color: '#0F172A',
                  marginBottom: '2px',
                }}
              >
                Anita Verma
              </div>
              <div style={{ borderTop: '1.5px solid #64748B', width: '160px', margin: '0 auto 4px auto' }} />
              <div style={{ fontSize: '0.74rem', fontWeight: '700', color: '#475569' }}>Emergency Dispatch Chief</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Gwalior Regional Desk</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescueCertificateModal;
