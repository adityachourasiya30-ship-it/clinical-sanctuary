import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { EmergencyMap } from '../components/EmergencyMap';
import {
  Building2,
  MapPin,
  PhoneCall,
  Navigation,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

export const HospitalsPage = () => {
  const { location, error: gpsError, loading: gpsLoading, refreshLocation } = useGeolocation();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const lat = location?.latitude || 26.2183; // fallback to MITS Gwalior region
        const lng = location?.longitude || 78.1828;
        const res = await api.get(`/hospitals/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm * 1000}`);
        if (res.data.success) {
          setHospitals(res.data.hospitals || []);
        }
      } catch (err) {
        console.warn('Failed to fetch hospitals:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [location?.latitude, location?.longitude, radiusKm]);

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div className="card-clean" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Building2 size={24} color="var(--teal-primary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
              Nearby Emergency Healthcare Directory
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Verified trauma centers, district civil hospitals, and 24x7 emergency medical rooms within your search perimeter.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', alignSelf: 'flex-start', marginTop: '0.2rem' }}>
          <button
            type="button"
            onClick={refreshLocation}
            disabled={gpsLoading}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} className={gpsLoading ? 'animate-spin' : ''} />
            Calibrate GPS
          </button>
        </div>
      </div>

      {/* Search & Filter Bar (Positioned Prominently Ahead of Content) */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 320px', maxWidth: '520px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospital by name or locality..."
            aria-label="Search hospitals by name or locality"
            style={{
              width: '100%',
              height: '40px',
              boxSizing: 'border-box',
              backgroundColor: '#1A2333',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 0.85rem 0 2.4rem',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#38BDF8'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)'; }}
          />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '40px' }}>
          <label htmlFor="search-radius-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Search Radius:
          </label>
          <select
            id="search-radius-select"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            style={{
              height: '40px',
              boxSizing: 'border-box',
              backgroundColor: '#1A2333',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 0.85rem',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={15}>15 km</option>
            <option value={25}>25 km</option>
          </select>
        </div>
      </div>

      {/* Compact Operational Notice Banner (Positioned Below Search Controls) */}
      <div
        role="note"
        aria-label="Operational Disclaimer"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderLeft: '3px solid var(--teal-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.55rem 0.95rem',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <AlertCircle size={16} color="var(--teal-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-main)' }}>Operational Notice:</strong> Facility listings show geographic proximity derived from verified OpenStreetMap anchor nodes. Proximity does not guarantee available ICU beds or immediate admission without prior telephone triage.
        </div>
      </div>

      {/* Main Content Layout: Grid of Cards + Map View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Facility Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--teal-primary)' }}>
              Loading anchor healthcare centers...
            </div>
          ) : filteredHospitals.length === 0 ? (
            <div className="card-clean" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <Building2 size={36} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>No facilities found</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Try increasing the search radius or adjusting your query.
              </p>
            </div>
          ) : (
            filteredHospitals.map((h, i) => (
              <div key={i} className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>{h.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                      <MapPin size={13} color="var(--teal-primary)" />
                      <span>{h.address || 'Emergency Trauma Center'}</span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: 'var(--teal-primary)',
                      backgroundColor: 'var(--teal-subtle)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--teal-border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.distanceKm !== undefined ? `${h.distanceKm} km` : 'Proximity Anchor'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {h.phone ? (
                    <a
                      href={`tel:${h.phone}`}
                      className="btn-coral"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                    >
                      <PhoneCall size={14} />
                      Emergency Desk: {h.phone}
                    </a>
                  ) : (
                    <a
                      href="tel:108"
                      className="btn-secondary"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.45rem 0.85rem',
                        backgroundColor: '#242C34',
                        border: '1px solid rgba(225, 29, 72, 0.45)',
                        color: '#FCA5A5',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <PhoneCall size={14} color="#E11D48" />
                      <span>Dial 108 Ambulance</span>
                    </a>
                  )}

                  {h.latitude && h.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      aria-label={`Get directions to ${h.name} on Google Maps (opens in new tab)`}
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Navigation size={14} />
                      <span>Directions (Maps)</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Map View */}
        <div className="card-clean" style={{ height: '560px', position: 'sticky', top: '80px', overflow: 'hidden', isolation: 'isolate' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin size={18} color="var(--teal-primary)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Geographic Facility Map
            </h4>
          </div>
          <div style={{ height: 'calc(100% - 35px)' }}>
            <EmergencyMap
              userLocation={location}
              hospitals={filteredHospitals}
              isEmergency={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
