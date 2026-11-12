import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  ShieldCheck,
  AlertCircle,
  PhoneCall,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { fetchRoadRoute } from '../services/routingService';

// Custom Map Controller to auto-pan when user coordinates update
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

// Auto-Fit Bounds when road polyline is calculated
const RouteFitter = ({ polyline }) => {
  const map = useMap();
  useEffect(() => {
    if (polyline && polyline.length > 1) {
      try {
        const bounds = L.latLngBounds(polyline);
        map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16, animate: true });
      } catch (_) {}
    }
  }, [polyline, map]);
  return null;
};

// Custom user pulsing marker icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 26px; height: 26px;">
      <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(239,68,68,0.85);"></div>
      <div style="position: absolute; width: 48px; height: 48px; top: -11px; left: -11px; border-radius: 50%; background: rgba(239,68,68,0.3); animation: pulse 2s infinite;"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Custom Hospital marker icon
const hospitalIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: `
    <div style="background: #10b981; width: 28px; height: 28px; border-radius: 6px; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); color: white; font-weight: bold; font-size: 14px;">
      +
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Uber-style Responder / Ambulance marker icon
const responderIcon = L.divIcon({
  className: 'custom-responder-marker',
  html: `
    <div style="position: relative; width: 38px; height: 38px;">
      <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: #19b6a4; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(25,182,164,0.9); font-size: 20px;">
        🚑
      </div>
      <div style="position: absolute; width: 56px; height: 56px; top: -9px; left: -9px; border-radius: 50%; background: rgba(25,182,164,0.3); animation: pulse 1.6s infinite; pointer-events: none;"></div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

export const EmergencyMap = ({
  centerCoordinates,
  accuracy = 0,
  breadcrumbCoordinates = [],
  hospitals = [],
  assignedResponder = null,
  height = '420px',
  status = 'SEARCHING',
  incident = null,
  // Backward compatibility alias props
  userLocation = null,
  breadcrumbs = null,
  isEmergency = false,
}) => {
  const coords = centerCoordinates || userLocation;
  const crumbs = breadcrumbCoordinates.length > 0 ? breadcrumbCoordinates : breadcrumbs || [];

  const defaultPos = [26.2183, 78.1828]; // MITS Gwalior default anchor
  const currentPos =
    coords && coords.latitude && coords.longitude
      ? [coords.latitude, coords.longitude]
      : defaultPos;

  const polylinePositions = crumbs
    .filter((pt) => pt.latitude && pt.longitude)
    .map((pt) => [pt.latitude, pt.longitude]);

  // Compute responder origin anchor (profile coordinates or realistic offset for simulation)
  const initialResponderPos = assignedResponder
    ? [
        assignedResponder.location?.latitude || currentPos[0] + 0.0075,
        assignedResponder.location?.longitude || currentPos[1] + 0.0085,
      ]
    : null;

  // Real OSRM Road Route State
  const [routePolyline, setRoutePolyline] = useState([]);
  const [routeTelemetry, setRouteTelemetry] = useState({
    distanceKm: 1.2,
    durationMins: 3,
    isFallback: false,
    summary: 'OSRM Road Route',
  });
  const [animatedPos, setAnimatedPos] = useState(initialResponderPos);

  const animRef = useRef(null);
  const startTimeRef = useRef(null);

  // Fetch true driving route from free public OSRM when responder & patient locations exist
  useEffect(() => {
    if (!initialResponderPos || !currentPos) {
      setRoutePolyline([]);
      return;
    }

    let isSubscribed = true;

    const loadRoute = async () => {
      const result = await fetchRoadRoute(initialResponderPos, currentPos);
      if (isSubscribed && result.success) {
        setRoutePolyline(result.polyline);
        setRouteTelemetry({
          distanceKm: result.distanceKm,
          durationMins: result.durationMins,
          isFallback: result.isFallback,
          summary: result.summary || 'OSRM Road Network',
        });
      }
    };

    loadRoute();

    return () => {
      isSubscribed = false;
    };
  }, [
    initialResponderPos?.[0],
    initialResponderPos?.[1],
    currentPos[0],
    currentPos[1],
  ]);

  // Smooth Marker Animation along Road Polyline using requestAnimationFrame
  useEffect(() => {
    if (!routePolyline || routePolyline.length === 0) {
      setAnimatedPos(initialResponderPos);
      return;
    }

    if (status === 'ARRIVED') {
      setAnimatedPos(currentPos);
      return;
    }

    if (status !== 'EN_ROUTE') {
      setAnimatedPos(routePolyline[0]);
      return;
    }

    // When status === 'EN_ROUTE', animate along road coordinates smoothly
    const totalPoints = routePolyline.length;
    const durationMs = 32000; // Simulated 32-second transit along path
    startTimeRef.current = performance.now();

    const animateStep = (timestamp) => {
      const elapsed = timestamp - startTimeRef.current;
      // Loop or smoothly progress along route nodes
      const progress = Math.min((elapsed % durationMs) / durationMs, 0.98);

      const exactIndex = progress * (totalPoints - 1);
      const idx = Math.floor(exactIndex);
      const subT = exactIndex - idx;

      const p1 = routePolyline[idx];
      const p2 = routePolyline[Math.min(idx + 1, totalPoints - 1)];

      if (p1 && p2) {
        const currentLat = p1[0] + (p2[0] - p1[0]) * subT;
        const currentLng = p1[1] + (p2[1] - p1[1]) * subT;
        setAnimatedPos([currentLat, currentLng]);
      }

      animRef.current = requestAnimationFrame(animateStep);
    };

    animRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [routePolyline, status, currentPos, initialResponderPos]);

  // Responder info fallback
  const responderInfo = assignedResponder || {
    name: 'Officer Vikram Singh',
    vehicle: 'ALS Ambulance (DL-01-EM-402)',
    badgeNumber: 'EMS-042',
    phone: '+919876543210',
    responderTier: incident?.responderTier || 'TIER_2_MEDICAL',
  };

  const currentTier = incident?.responderTier || assignedResponder?.responderTier || 'TIER_2_MEDICAL';
  const isTier1 = currentTier === 'TIER_1_TRANSPORT';
  const pickupPin = incident?.pickupOtp;
  const showFloatingCard = Boolean(assignedResponder || isEmergency || status === 'EN_ROUTE' || status === 'ARRIVED');

  return (
    <div
      style={{
        width: '100%',
        height,
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={currentPos}
        zoom={14}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater center={currentPos} />
        {routePolyline.length > 1 && <RouteFitter polyline={routePolyline} />}

        {/* Live User Position Marker & Accuracy Circle */}
        {coords && (
          <>
            <Marker position={currentPos} icon={userIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ display: 'block', color: '#ef4444', marginBottom: '2px' }}>
                    🚨 Emergency Rendezvous Point
                  </strong>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    Lat: {currentPos[0].toFixed(5)}, Lng: {currentPos[1].toFixed(5)}
                  </span>
                  {accuracy > 0 && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      GPS Accuracy: &plusmn;{Math.round(accuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>

            {accuracy > 0 && (
              <Circle
                center={currentPos}
                radius={accuracy}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.1,
                  weight: 1,
                  dashArray: '4, 4',
                }}
              />
            )}
          </>
        )}

        {/* Road Route Polyline from OSRM */}
        {routePolyline.length > 0 && (
          <>
            {/* Outer soft glow line */}
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#19B6A4',
                weight: 7,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Inner crisp line */}
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: routeTelemetry.isFallback ? '#f59e0b' : '#19B6A4',
                weight: 3.5,
                opacity: 0.95,
                dashArray: routeTelemetry.isFallback ? '8, 8' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {/* Animated Uber-style Responder Marker */}
        {animatedPos && (
          <Marker position={animatedPos} icon={responderIcon}>
            <Popup>
              <div style={{ padding: '6px' }}>
                <strong style={{ display: 'block', color: '#19B6A4', marginBottom: '2px' }}>
                  🚑 {responderInfo.vehicle || 'ALS Ambulance'}
                </strong>
                <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: '600' }}>
                  {responderInfo.name} &bull;{' '}
                  <span style={{ color: isTier1 ? '#60A5FA' : '#19B6A4' }}>
                    {isTier1 ? 'Tier 1 Transport' : 'Tier 2 Medical'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  Status:{' '}
                  {status === 'ARRIVED'
                    ? 'Arrived on Scene'
                    : status === 'EN_ROUTE'
                    ? 'Sirens Active & En Route'
                    : 'Dispatched & Preparing'}
                </div>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px', fontWeight: '700' }}>
                  Distance: {routeTelemetry.distanceKm} km (~{routeTelemetry.durationMins} mins)
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Breadcrumb Trail */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: '#38bdf8', weight: 3, opacity: 0.8 }}
          />
        )}

        {/* Nearby Hospitals & Clinics */}
        {hospitals.map((hosp, idx) => {
          if (!hosp.latitude || !hosp.longitude) return null;
          return (
            <Marker key={hosp.id || idx} position={[hosp.latitude, hosp.longitude]} icon={hospitalIcon}>
              <Popup>
                <div style={{ padding: '6px', maxWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    {hosp.verified ? (
                      <ShieldCheck size={16} color="#10b981" />
                    ) : (
                      <AlertCircle size={16} color="#f59e0b" />
                    )}
                    <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{hosp.name}</strong>
                  </div>

                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    {hosp.type || 'Healthcare Facility'} &bull;{' '}
                    <strong style={{ color: '#38bdf8' }}>{hosp.distanceKm} km away</strong>
                  </div>

                  <div
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: hosp.verified ? '#10b98120' : '#f59e0b20',
                      color: hosp.verified ? '#10b981' : '#f59e0b',
                      marginBottom: '8px',
                      display: 'inline-block',
                    }}
                  >
                    {hosp.verified ? 'Verified Facility' : 'Public OSM Facility'}
                  </div>

                  {hosp.navigationUrl && (
                    <a
                      href={hosp.navigationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textDecoration: 'none',
                      }}
                    >
                      <Navigation size={12} />
                      Navigate in Google Maps
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend (Top-Right) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 999,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '5px 9px',
          fontSize: '11px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          Patient
        </span>
        {initialResponderPos && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#19B6A4', fontWeight: '700' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#19B6A4' }} />
            Ambulance
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
          Hospitals
        </span>
      </div>

      {/* Uber-Style Floating Bottom Sheet Telemetry Card */}
      {showFloatingCard && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1000,
            backgroundColor: 'rgba(8, 22, 18, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid var(--teal-primary)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            boxShadow: '0 10px 35px rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: '#FFFFFF',
          }}
        >
          {/* Left: Responder Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 182, 164, 0.2)',
                border: '2px solid var(--teal-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              🚑
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#FFFFFF' }}>
                  {responderInfo.name}
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: isTier1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(25, 182, 164, 0.2)',
                    color: isTier1 ? '#60A5FA' : 'var(--teal-primary)',
                    border: `1px solid ${isTier1 ? 'rgba(59, 130, 246, 0.4)' : 'var(--teal-border)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Sparkles size={10} />
                  {isTier1 ? 'Tier 1 Transport' : 'Tier 2 Medical ALS'}
                </span>
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                {responderInfo.vehicle} &bull;{' '}
                <span style={{ color: 'var(--text-muted)' }}>{responderInfo.badgeNumber || 'EMS-Active'}</span>
              </div>
            </div>
          </div>

          {/* Center: Live ETA & OSRM Mode Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--teal-primary)',
                borderRadius: '6px',
                padding: '0.35rem 0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Clock size={14} color="var(--teal-primary)" />
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--teal-primary)' }}>
                {status === 'ARRIVED'
                  ? '📍 On Scene (Arrived)'
                  : `${routeTelemetry.distanceKm} km • ~${routeTelemetry.durationMins} mins ETA`}
              </div>
            </div>

            <span
              style={{
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
              title="Real-time road coordinates provided by Project OSRM"
            >
              {routeTelemetry.isFallback ? 'Haversine Direct Fallback' : 'OSRM Live Road Route'}
            </span>
          </div>

          {/* Right: Pickup PIN & Direct Call */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {pickupPin && (
              <div
                style={{
                  backgroundColor: 'rgba(25, 182, 164, 0.15)',
                  border: '1px solid var(--teal-primary)',
                  borderRadius: '6px',
                  padding: '0.3rem 0.65rem',
                  textAlign: 'center',
                }}
                title="Share this 4-digit code with the Paramedic upon arrival"
              >
                <div
                  style={{
                    fontSize: '0.58rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Pickup PIN
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    letterSpacing: '0.12em',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {pickupPin}
                </div>
              </div>
            )}

            <a
              href={`tel:${responderInfo.phone || '9876543210'}`}
              className="btn-teal"
              style={{
                fontSize: '0.78rem',
                padding: '0.45rem 0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
              }}
            >
              <PhoneCall size={13} />
              Call
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyMap;
