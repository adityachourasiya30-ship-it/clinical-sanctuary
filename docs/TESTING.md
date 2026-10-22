# Testing Strategy & Quality Assurance Plan
## Clinical Sanctuary Emergency Alert System

---

## 1. Scope and Philosophy

In life-critical emergency applications, silent failures, false success reports, and data leakage must be eliminated.
Testing covers:
1. **Authentication & Session Security**: Validation of credentials, protection against unauthorized access, safe handling of missing tokens.
2. **Contact & Medical Profile Integrity**: Field validation (blood groups, phone numbers), ownership isolation across users, right-to-be-forgotten deletion.
3. **Emergency SOS State Transitions**: Proper progression from `CREATED` &rarr; `ACTIVE` &rarr; `NOTIFYING` &rarr; `NOTIFIED` &rarr; `RESOLVED`.
4. **Duplicate Prevention**: Debounce and active-incident guards preventing accidental duplicate alerts.
5. **Notification Abstraction Integrity**: Honest status verification—reporting `SIMULATED` in dev mode, `SENT` only when provider actually returns a success payload, and `FAILED` on provider error.
6. **Telemetry & GPS Telemetry Logging**: Verification of 5-second location writes into the time-series collection.
7. **Audio Evidence Handling**: File format checking, size restrictions, and privacy consent gating.

---

## 2. Test Architecture

- **Backend Test Runner**: Node.js Jest / Supertest.
- **In-Memory Database**: `mongodb-memory-server` ensuring isolated, zero-dependency, lightning-fast test execution on any machine (including fresh laptops without MongoDB installed).
- **Mocks & Spies**: Twilio client mocked during unit/integration tests to ensure no real phone numbers are charged or texted during test runs.

---

## 3. Automated Test Suite Breakdown

| Suite | File | Key Test Cases |
| :--- | :--- | :--- |
| **Auth Test Suite** | `tests/auth.test.js` | • Register new user with hashed password<br>• Login with valid & invalid credentials<br>• Reject duplicate email registration<br>• Verify `/api/auth/me` returns sanitized user |
| **Contact Test Suite** | `tests/contacts.test.js` | • Add, edit, list, and delete emergency contact<br>• Ensure user A cannot read or delete user B's contacts<br>• Prevent invalid phone number format |
| **Medical Profile Suite** | `tests/medical.test.js` | • Fetch & update medical profile<br>• Validate blood groups<br>• Test JSON record export<br>• Test permanent record erasure |
| **SOS & Incident Suite** | `tests/incident.test.js` | • Trigger SOS and verify initial location<br>• Ensure active incident blocks duplicate immediate triggers<br>• Verify live location ingestion into `LocationUpdate`<br>• Resolve incident and verify tracking is marked completed |
| **Notification Suite** | `tests/notification.test.js` | • Verify DevNotificationProvider logs `SIMULATED`<br>• Verify provider error handling logs `FAILED` gracefully |

---

## 4. Manual QA & Device Verification Checklist

- [ ] **Voice Recognition**: Test speech recognition in Chrome/Edge speaking "Emergency", "Help me", and "SOS". Verify visual feedback banner.
- [ ] **Audio Recorder Consent**: Verify modal appears on first emergency trigger, captures audio, and shows recording waveform or indicator.
- [ ] **Map Rendering**: Verify Leaflet map tiles render, user marker appears at accurate coordinates, and hospital pins appear.
- [ ] **Public Tracking Link**: Open `/track/:incidentCode` in an incognito window and verify real-time coordinates and emergency details render without requiring login.
