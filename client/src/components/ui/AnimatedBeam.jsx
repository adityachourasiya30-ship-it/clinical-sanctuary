import React, { useId } from 'react';
import { MapPin, Radio, Ambulance, ShieldCheck, Zap } from 'lucide-react';

/**
 * Magic UI - AnimatedBeam
 * Animated beam / SVG connection with continuous moving gradient (#3D789E Steel Blue to #E11D48 Emergency Red).
 * Zero-dependency pure React + SVG implementation.
 */
export const AnimatedBeam = ({
  startX = 0,
  startY = 20,
  endX = 100,
  endY = 20,
  curvature = 0,
  gradientStartColor = '#3D789E', // Steel Blue
  gradientStopColor = '#E11D48',  // Emergency Crimson Red
  pathColor = 'rgba(226, 232, 240, 0.8)',
  pathWidth = 2,
  duration = 2.4,
  reverse = false,
  className = '',
}) => {
  const id = useId();
  const gradientId = `beam-grad-${id.replace(/:/g, '')}`;

  // Cubic bezier control points for curved paths
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - curvature;
  const pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

  return (
    <svg
      className={`animated-beam-svg ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={`${startX}%`}
          y1={`${startY}%`}
          x2={`${endX}%`}
          y2={`${endY}%`}
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="50%" stopColor={gradientStopColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStartColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Base static path */}
      <path
        d={pathD}
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeLinecap="round"
      />

      {/* Animated glowing telemetry beam */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={pathWidth + 1.5}
        strokeLinecap="round"
        strokeDasharray="40 120"
        style={{
          animation: `beam-flow-${gradientId} ${duration}s linear infinite ${reverse ? 'reverse' : 'normal'}`,
        }}
      />

      <style>{`
        @keyframes beam-flow-${gradientId} {
          0% {
            stroke-dashoffset: 160;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </svg>
  );
};

/**
 * TelemetrySyncBeam
 * 3-Node Connected Telemetry sync display:
 * [Citizen GPS] ➔ [Live Dispatch] ➔ [Responder Unit]
 * Custom Steel Blue (#3D789E) and Emergency Crimson Red (#E11D48) live gradient.
 */
export const TelemetrySyncBeam = ({
  status = 'EN_ROUTE',
  responderName = 'Officer Vikram Singh',
  responderTier = 'TIER_2_MEDICAL',
  eta = '3 mins',
  distance = '0.8 km',
  className = '',
}) => {
  const isAssigned = ['ASSIGNED', 'EN_ROUTE', 'ARRIVED'].includes(status);
  const isEnRoute = status === 'EN_ROUTE';
  const isArrived = status === 'ARRIVED';

  return (
    <div
      className={`telemetry-sync-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        padding: '0.85rem 1rem',
        borderRadius: '16px',
        backgroundColor: 'rgba(237, 244, 248, 0.75)', // --brand-blue-soft
        border: '1px solid rgba(61, 120, 158, 0.22)',
        overflow: 'hidden',
      }}
    >
      {/* Visual Connecting Beams */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '12%',
          right: '12%',
          height: '2px',
          backgroundColor: '#E2E8F0',
          zIndex: 1,
        }}
      >
        {/* Animated glowing telemetry beam (#3D789E to #E11D48) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isEnRoute
              ? 'linear-gradient(90deg, #E11D48, #3D789E, #2B5876)'
              : 'linear-gradient(90deg, #3D789E, #2B5876, #3D789E)',
            backgroundSize: '200% 100%',
            animation: 'telemetry-gradient-slide 2s linear infinite',
            opacity: isAssigned ? 1 : 0.45,
          }}
        />
      </div>

      {/* 3 Telemetry Nodes */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        {/* Node 1: Citizen GPS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '30%' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #E11D48',
              boxShadow: '0 0 14px rgba(225, 29, 72, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E11D48',
              marginBottom: '0.4rem',
              position: 'relative',
            }}
          >
            <MapPin size={20} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#E11D48',
                border: '2px solid #FFFFFF',
              }}
            />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
            Citizen GPS
          </span>
          <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '500' }}>
            Rendezvous Point
          </span>
        </div>

        {/* Node 2: Live Dispatch */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '30%' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #3D789E',
              boxShadow: '0 0 14px rgba(61, 120, 158, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3D789E',
              marginBottom: '0.4rem',
              position: 'relative',
            }}
          >
            <Radio size={19} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#3D789E',
                border: '2px solid #FFFFFF',
              }}
            />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
            Live Dispatch
          </span>
          <span style={{ fontSize: '0.68rem', color: '#3D789E', fontWeight: '700' }}>
            OSRM Sync Active
          </span>
        </div>

        {/* Node 3: Responder Unit */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '30%' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: isArrived ? '#3D789E' : '#FFFFFF',
              border: `2px solid ${isArrived ? '#3D789E' : '#2B5876'}`,
              boxShadow: isArrived
                ? '0 0 14px rgba(61, 120, 158, 0.35)'
                : '0 0 14px rgba(43, 88, 118, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isArrived ? '#FFFFFF' : '#3D789E',
              marginBottom: '0.4rem',
              position: 'relative',
            }}
          >
            <Ambulance size={20} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isArrived ? '#3D789E' : '#2B5876',
                border: '2px solid #FFFFFF',
              }}
            />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-main, #0F172A)' }}>
            {isArrived ? 'On Scene' : isEnRoute ? `En Route (${eta})` : 'Assigned Unit'}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#3D789E', fontWeight: '700' }}>
            {responderTier === 'TIER_2_MEDICAL' ? 'Tier 2 Medical' : 'Tier 1 Transport'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes telemetry-gradient-slide {
          0% {
            background-position: 100% 0%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBeam;
