import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Radio,
  Users,
  ShieldAlert,
  Ambulance,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  UserCheck,
} from 'lucide-react';

export const DispatcherPage = () => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [assigningResponderId, setAssigningResponderId] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState(null);

  const loadDispatchData = async () => {
    setLoading(true);
    try {
      const queryParams = [];
      if (filterCategory) queryParams.push(`category=${filterCategory}`);
      if (filterStatus) queryParams.push(`status=${filterStatus}`);
      const qs = queryParams.length ? `?${queryParams.join('&')}` : '';

      const [statsRes, queueRes, respRes] = await Promise.all([
        api.get('/dispatch/stats'),
        api.get(`/dispatch/queue${qs}`),
        api.get('/dispatch/responders'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (queueRes.data.success) setIncidents(queueRes.data.incidents || []);
      if (respRes.data.success) setResponders(respRes.data.responders || []);
    } catch (err) {
      console.warn('Dispatch data load warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatchData();
  }, [filterCategory, filterStatus]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !assigningResponderId) return;

    try {
      const res = await api.post(`/dispatch/incidents/${selectedIncident._id}/assign`, {
        responderUserId: assigningResponderId,
      });

      if (res.data.success) {
        setDispatchMessage(`Successfully assigned responder to case ${selectedIncident.incidentCode}.`);
        setSelectedIncident(null);
        setAssigningResponderId('');
        loadDispatchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign responder.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Operational Bar */}
      <div className="card-clean" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--teal-subtle)',
              border: '1px solid var(--teal-primary)',
              color: 'var(--teal-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={22} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Central Emergency Dispatch Control Room
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Real-time multi-agency emergency triage, responder routing, and telemetry audit stream
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadDispatchData}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Queue
        </button>
      </div>

      {/* Dispatch Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>ACTIVE ALERTS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--coral-emergency)', marginTop: '4px' }}>
            {stats?.activeCount ?? 0}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Requiring immediate attention</span>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>AVAILABLE RESPONDERS</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--teal-primary)', marginTop: '4px' }}>
            {stats?.availableResponders ?? 0} / {stats?.totalResponders ?? 0}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fleet units currently on duty</span>
        </div>

        <div className="card-clean">
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL CASES LOGGED</span>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
            {stats?.totalIncidents ?? 0}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Database incident records</span>
        </div>
      </div>

      {dispatchMessage && (
        <div
          style={{
            backgroundColor: 'var(--teal-subtle)',
            border: '1px solid var(--teal-primary)',
            color: 'var(--teal-primary)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{dispatchMessage}</span>
          <button onClick={() => setDispatchMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            &times;
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          <Filter size={15} /> Filter:
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 0.8rem',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
          }}
        >
          <option value="">All Categories</option>
          <option value="MEDICAL">Medical Emergency</option>
          <option value="ACCIDENT">Road Accident</option>
          <option value="FIRE">Fire & Smoke</option>
          <option value="CRIME">Personal Safety</option>
          <option value="POLICE">Police Assistance</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 0.8rem',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="NOTIFYING">NOTIFYING</option>
          <option value="NOTIFIED">NOTIFIED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="EN_ROUTE">EN_ROUTE</option>
          <option value="ARRIVED">ARRIVED</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Incident Queue Table */}
      <div className="card-clean">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem' }}>
          Operational Emergency Queue ({incidents.length})
        </h3>

        {incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No incidents matching current filter criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {incidents.map((inc) => (
              <div
                key={inc._id}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: inc.category === 'MEDICAL' ? 'var(--coral-subtle)' : 'var(--teal-subtle)',
                        color: inc.category === 'MEDICAL' ? 'var(--coral-emergency)' : 'var(--teal-primary)',
                      }}
                    >
                      {inc.category}
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{inc.incidentCode}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Caller: <strong>{inc.userId?.name || 'Citizen'}</strong>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ({new Date(inc.createdAt).toLocaleTimeString()})
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={12} color="var(--teal-primary)" />
                    {inc.initialLocation?.address || `Lat: ${inc.initialLocation?.latitude}, Lng: ${inc.initialLocation?.longitude}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: inc.status === 'RESOLVED' ? 'var(--status-success)' : inc.status === 'CANCELLED' ? 'var(--text-muted)' : 'var(--coral-emergency)',
                      backgroundColor: 'var(--surface-primary)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    {inc.status}
                  </span>

                  {inc.assignedResponder ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--teal-primary)', fontWeight: '700' }}>
                      Assigned: {inc.assignedResponder?.name}
                    </span>
                  ) : !['RESOLVED', 'CANCELLED'].includes(inc.status) ? (
                    <button
                      type="button"
                      onClick={() => setSelectedIncident(inc)}
                      className="btn-teal"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                    >
                      Assign Unit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responder Assignment Modal */}
      {selectedIncident && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 1200,
          }}
        >
          <div
            className="card-clean"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--surface-elevated)',
              border: '2px solid var(--teal-primary)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Assign Field Responder
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Incident: <strong>{selectedIncident.incidentCode}</strong> ({selectedIncident.category})
            </p>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  SELECT AVAILABLE RESPONDER UNIT
                </label>
                <select
                  required
                  value={assigningResponderId}
                  onChange={(e) => setAssigningResponderId(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.75rem',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="">-- Choose on-duty responder --</option>
                  {responders.map((r) => (
                    <option key={r.userId?._id} value={r.userId?._id}>
                      {r.userId?.name} &bull; Badge: {r.badgeNumber} ({r.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!assigningResponderId}
                  className="btn-teal"
                  style={{ fontSize: '0.8rem' }}
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
