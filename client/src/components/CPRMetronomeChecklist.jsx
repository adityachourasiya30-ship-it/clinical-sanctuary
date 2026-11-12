import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

const INITIAL_CHECKLIST = [
  { id: 'safety', label: 'Verify Scene Safety & Verbal Response ("Are you okay?")', checked: true },
  { id: 'airway', label: 'Stabilize Cervical Spine & Clear Airway (Keep helmet on if crash)', checked: false },
  { id: 'backup', label: 'Confirm 108 Backup Ambulance & Alert Receiving Trauma Center', checked: false },
  { id: 'bleeding', label: 'Apply Direct Pressure & Gauze to Active Arterial Bleeding', checked: false },
  { id: 'cpr', label: 'Initiate 110 BPM Chest Compressions (2 inches depth, full recoil)', checked: false },
  { id: 'otp', label: 'Verify 4-Digit Pickup PIN with Patient / Bystander', checked: false },
];

export const CPRMetronomeChecklist = ({ incident, onOtpVerified }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [beatCount, setBeatCount] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);

  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  // 110 BPM = 60000ms / 110 ≈ 545.45 ms per beat
  const bpmIntervalMs = Math.round(60000 / 110);

  // Pure Web Audio API Synth Beep (Zero external audio assets required)
  const triggerMetronomeBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Crisp medical rhythm tone (880 Hz)
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.075);
    } catch (_) {}
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 140);
        setBeatCount((prev) => prev + 1);
        triggerMetronomeBeep();
      }, bpmIntervalMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPulseActive(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, soundEnabled, bpmIntervalMs]);

  const toggleChecklist = (id) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const completedCount = checklist.filter((item) => item.checked).length;
  const progressPct = Math.round((completedCount / checklist.length) * 100);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-elevated)',
        border: '2px solid var(--coral-emergency)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginTop: '1.25rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--coral-subtle)',
              border: '2px solid var(--coral-emergency)',
              color: 'var(--coral-emergency)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartPulse size={20} className="animate-emergency-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                On-Scene Golden Hour Response Kit
              </h4>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  color: 'var(--coral-emergency)',
                  backgroundColor: 'var(--coral-subtle)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid var(--coral-emergency)',
                }}
              >
                TIER-2 MEDICAL
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Interactive Triage Checklist & 110 BPM Hands-Only CPR Guide
            </div>
          </div>
        </div>

        {/* Golden Hour Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Protocol Progress:
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--teal-primary)' }}>
            {completedCount}/{checklist.length} ({progressPct}%)
          </span>
        </div>
      </div>

      {/* 110 BPM Hands-Only CPR Metronome Card */}
      <div
        style={{
          backgroundColor: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: pulseActive ? 'var(--coral-emergency)' : 'rgba(239, 68, 68, 0.15)',
              border: `2px solid ${pulseActive ? '#FFFFFF' : 'var(--coral-emergency)'}`,
              color: pulseActive ? '#FFFFFF' : 'var(--coral-emergency)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s ease',
              transform: pulseActive ? 'scale(1.15)' : 'scale(1)',
              boxShadow: pulseActive ? '0 0 20px rgba(239, 68, 68, 0.8)' : 'none',
            }}
          >
            <HeartPulse size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '900', color: '#FFFFFF' }}>
                110 BPM Hands-Only CPR Metronome
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: isPlaying ? 'var(--status-success)' : 'var(--text-muted)',
                  backgroundColor: isPlaying ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {isPlaying ? 'ACTIVE RHYTHM' : 'STANDBY'}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              AHA Standard Rhythm (100–120 compressions/min) &bull; Compressions: <strong>{beatCount}</strong>
            </div>
          </div>
        </div>

        {/* Metronome Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title={soundEnabled ? 'Mute audio beep' : 'Enable audio rhythm'}
          >
            {soundEnabled ? <Volume2 size={15} color="var(--teal-primary)" /> : <VolumeX size={15} />}
            {soundEnabled ? 'Beep On' : 'Muted'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying) triggerMetronomeBeep();
            }}
            className={isPlaying ? 'btn-secondary' : 'btn-coral'}
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.8rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            {isPlaying ? 'Pause Rhythm' : 'Start 110 BPM Metronome'}
          </button>

          {beatCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setBeatCount(0);
                setIsPlaying(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
              title="Reset beat counter"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* On-Scene First-Aid Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {checklist.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleChecklist(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: item.checked ? 'rgba(25, 182, 164, 0.08)' : 'var(--surface-primary)',
              border: `1px solid ${item.checked ? 'var(--teal-primary)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ color: item.checked ? 'var(--teal-primary)' : 'var(--text-muted)' }}>
              {item.checked ? <CheckSquare size={18} /> : <Square size={18} />}
            </div>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: item.checked ? '700' : '500',
                color: item.checked ? '#FFFFFF' : 'var(--text-secondary)',
                textDecoration: item.checked ? 'none' : 'none',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CPRMetronomeChecklist;
