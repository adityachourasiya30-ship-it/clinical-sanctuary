import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Zap,
  X,
  Award,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    scenario: 'Adult Cardiac Arrest',
    question:
      'You encounter an unresponsive adult who is not breathing normally. After calling for emergency backup, what is the correct Hands-Only CPR chest compression rhythm?',
    options: [
      { text: '60 to 80 compressions per minute', isCorrect: false },
      { text: '100 to 120 compressions per minute (e.g. to rhythm of "Stayin Alive")', isCorrect: true },
      { text: '140 to 160 compressions per minute as fast as possible', isCorrect: false },
      { text: 'Give 5 compressions and wait 2 minutes to check pulse', isCorrect: false },
    ],
    explanation: 'AHA/ERC guidelines mandate 100–120 compressions per minute at 2 inches (5 cm) depth for effective myocardial perfusion.',
  },
  {
    id: 2,
    scenario: 'Motorcycle Collision Trauma',
    question:
      'A motorcyclist is found on the road after a high-speed crash. They are breathing but groaning with suspected cervical spine trauma. How should you handle their helmet?',
    options: [
      { text: 'Yank the helmet off immediately to check ear bleeding', isCorrect: false },
      { text: 'Twist the helmet side-to-side to test neck mobility', isCorrect: false },
      { text: 'Leave helmet in place and manually stabilize neck inline unless airway is critically blocked', isCorrect: true },
      { text: 'Seat the rider upright and remove protective gear', isCorrect: false },
    ],
    explanation: 'Removing a helmet without two-person cervical immobilization can cause complete spinal cord transection.',
  },
  {
    id: 3,
    scenario: 'Arterial Hemorrhage',
    question:
      'A pedestrian has sustained a deep lower-leg laceration with bright red blood spurting vigorously. What is your immediate priority action?',
    options: [
      { text: 'Apply continuous, firm direct pressure over wound with clean dressing/cloth', isCorrect: true },
      { text: 'Wash the wound under hot tap water for 10 minutes', isCorrect: false },
      { text: 'Apply mud or herbal paste to clot the bleeding', isCorrect: false },
      { text: 'Loosely cover and wait for ambulance without applying pressure', isCorrect: false },
    ],
    explanation: 'Direct firm pressure directly occludes the bleeding vessel and stops exsanguination within the Golden Hour.',
  },
  {
    id: 4,
    scenario: 'Unconscious Breathing Victim',
    question:
      'A collapsed patient is unresponsive but has a strong carotid pulse and normal rhythmic breathing. Which position protects their airway from aspiration?',
    options: [
      { text: 'Prone (flat on stomach with face pressed down)', isCorrect: false },
      { text: 'Recovery Position (on their side with head tilted back)', isCorrect: true },
      { text: 'Sitting cross-legged with head forward', isCorrect: false },
      { text: 'Flat on back with head raised on two pillows', isCorrect: false },
    ],
    explanation: 'The lateral Recovery Position prevents the tongue from occluding the hypopharynx and allows fluids/vomitus to drain safely.',
  },
  {
    id: 5,
    scenario: 'Complete Airway Obstruction',
    question:
      'A conscious diner is clutching their throat, unable to speak, cough, or breathe (silent choking). What is the appropriate emergency intervention?',
    options: [
      { text: 'Force them to swallow large amounts of water', isCorrect: false },
      { text: 'Perform abdominal thrusts (Heimlich Maneuver) or back blows until dislodged', isCorrect: true },
      { text: 'Slap their lower back while they sit backward', isCorrect: false },
      { text: 'Lay them flat on ground and begin mouth-to-mouth', isCorrect: false },
    ],
    explanation: 'Subdiaphragmatic abdominal thrusts create artificial cough pressure to expel foreign bodies from the trachea.',
  },
];

export const ResponderQuizModal = ({ isOpen, onClose, onCertified }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSelect = (qId, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleEvaluate = async () => {
    setError(null);
    let calculatedScore = 0;

    ASSESSMENT_QUESTIONS.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected !== undefined && q.options[selected]?.isCorrect) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setSubmitted(true);

    if (calculatedScore >= 4) {
      setLoading(true);
      try {
        const res = await api.post('/responder/verify-tier2', {
          score: calculatedScore,
          total: ASSESSMENT_QUESTIONS.length,
        });
        if (res.data.success && onCertified) {
          onCertified(res.data.profile);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit certification record.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoBypass = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/responder/verify-tier2', {
        isDemoBypass: true,
      });
      if (res.data.success && onCertified) {
        onCertified(res.data.profile);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bypass certification failed.');
    } finally {
      setLoading(false);
    }
  };

  const allAnswered = Object.keys(selectedAnswers).length === ASSESSMENT_QUESTIONS.length;
  const isPassed = submitted && score >= 4;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="card-clean"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-primary)',
          border: '2px solid var(--teal-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(25, 182, 164, 0.18)',
              border: '2px solid var(--teal-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal-primary)',
            }}
          >
            <Award size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#FFFFFF', margin: 0 }}>
                Tier-2 Medical Assessment Gate
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(25, 182, 164, 0.2)',
                  color: 'var(--teal-primary)',
                  border: '1px solid var(--teal-border)',
                }}
              >
                CPR & FIRST-AID
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Pass with &ge; 80% (4/5 correct) to unlock Critical & ALS emergency dispatch calls
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--coral-subtle)',
              border: '1px solid var(--coral-emergency)',
              color: 'var(--coral-emergency)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Quiz Results Banner */}
        {submitted && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1.5px solid ${isPassed ? 'var(--status-success)' : 'var(--coral-emergency)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isPassed ? (
                <CheckCircle size={26} color="var(--status-success)" />
              ) : (
                <AlertCircle size={26} color="var(--coral-emergency)" />
              )}
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                  {isPassed ? 'Assessment Passed! Verified for Tier-2 Medical.' : 'Assessment Not Passed'}
                </strong>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Your Score: <strong>{score} / {ASSESSMENT_QUESTIONS.length} ({Math.round((score / 5) * 100)}%)</strong> &bull; Passing threshold: 4/5 (80%)
                </div>
              </div>
            </div>

            {isPassed ? (
              <button
                type="button"
                onClick={onClose}
                className="btn-teal"
                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
              >
                Access Tier-2 Dispatches &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSelectedAnswers({});
                }}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
              >
                Retry Assessment
              </button>
            )}
          </div>
        )}

        {/* 5 Scenario Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {ASSESSMENT_QUESTIONS.map((q, qIndex) => {
            const selected = selectedAnswers[q.id];
            return (
              <div
                key={q.id}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(25, 182, 164, 0.15)',
                      color: 'var(--teal-primary)',
                    }}
                  >
                    CASE #{qIndex + 1}: {q.scenario}
                  </span>
                </div>

                <div style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  {q.question}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selected === optIdx;
                    let optBg = 'var(--surface-primary)';
                    let optBorder = 'var(--border-subtle)';

                    if (submitted) {
                      if (opt.isCorrect) {
                        optBg = 'rgba(16, 185, 129, 0.2)';
                        optBorder = 'var(--status-success)';
                      } else if (isSelected && !opt.isCorrect) {
                        optBg = 'rgba(239, 68, 68, 0.2)';
                        optBorder = 'var(--coral-emergency)';
                      }
                    } else if (isSelected) {
                      optBg = 'rgba(25, 182, 164, 0.15)';
                      optBorder = 'var(--teal-primary)';
                    }

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelect(q.id, optIdx)}
                        style={{
                          padding: '0.6rem 0.85rem',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: optBg,
                          border: `1px solid ${optBorder}`,
                          cursor: submitted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          fontSize: '0.8rem',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          fontWeight: isSelected ? '700' : '500',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--teal-primary)' : 'var(--text-muted)'}`,
                            backgroundColor: isSelected ? 'var(--teal-primary)' : 'transparent',
                            flexShrink: 0,
                          }}
                        />
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {submitted && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.55rem', fontStyle: 'italic' }}>
                    💡 Clinical Protocol: {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Quick Demo Bypass for Officer Vikram */}
          <button
            type="button"
            onClick={handleDemoBypass}
            disabled={loading}
            style={{
              backgroundColor: 'var(--teal-subtle)',
              border: '1px dashed var(--teal-primary)',
              color: 'var(--teal-primary)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.45rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Instant certification for live demo & evaluation"
          >
            <Zap size={14} />
            ⚡ Quick Demo Bypass (Certify Vikram)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            >
              Cancel
            </button>

            {!submitted && (
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={!allAnswered || loading}
                className="btn-teal"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.5rem 1.1rem',
                  fontWeight: '800',
                  opacity: allAnswered ? 1 : 0.5,
                  cursor: allAnswered ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Evaluating...' : 'Submit & Certify (5/5)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderQuizModal;
