import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, ShieldCheck, AlertCircle } from 'lucide-react';

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

// Custom user pulsing marker icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(239,68,68,0.8);"></div>
      <div style="position: absolute; width: 44px; height: 44px; top: -10px; left: -10px; border-radius: 50%; background: rgba(239,68,68,0.3); animation: pulse 2s infinite;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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

export const EmergencyMap = ({
  centerCoordinates,
  accuracy = 0,
  breadcrumbCoordinates = [],
  hospitals = [],
  height = '380px',
}) => {
  const defaultPos = [26.2183, 78.1828]; // MITS Gwalior default anchor
  const currentPos =
    centerCoordinates && centerCoordinates.latitude && centerCoordinates.longitude
      ? [centerCoordinates.latitude, centerCoordinates.longitude]
      : defaultPos;

  const polylinePositions = breadcrumbCoordinates
    .filter((pt) => pt.latitude && pt.longitude)
    .map((pt) => [pt.latitude, pt.longitude]);

  return (
    <div style={{ width: '100%', height, position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
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

        {/* Live User Position Marker & Accuracy Circle */}
        {centerCoordinates && (
          <>
            <Marker position={currentPos} icon={userIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ display: 'block', color: '#ef4444', marginBottom: '2px' }}>
                    🚨 Your Live Position
                  </strong>
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    Lat: {currentPos[0].toFixed(5)}, Lng: {currentPos[1].toFixed(5)}
                  </span>
                  {accuracy > 0 && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Accuracy: &plusmn;{Math.round(accuracy)}m
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

        {/* Breadcrumb Trail */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.85 }}
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
                    {hosp.verified ? 'Verified Medical Facility' : 'OSM Public Data (Unverified)'}
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

      {/* Floating map legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '11px',
          display: 'flex',
          gap: '12px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          User
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
          Hospitals
        </span>
      </div>
    </div>
  );
};
