# Implementation Plan: Clinical Sanctuary Emergency Alert System

This document outlines the ordered, phase-by-phase engineering plan to build, test, and deliver the Clinical Sanctuary Emergency Alert System.

---

## Phase 1: Requirements, System Architecture & Documentation (Completed)
- [x] Analyze the 40-page milestone reports and macro-project specification.
- [x] Create `docs/REQUIREMENTS.md` with traceability matrix and inconsistency resolutions.
- [x] Create `docs/IMPLEMENTATION_PLAN.md` (this file).
- [x] Create `docs/ARCHITECTURE.md` defining system components, data schemas, and state machine.
- [x] Create `docs/API.md` documenting REST endpoints and payloads.
- [x] Create `docs/TESTING.md` outlining the QA plan, test suites, and mock strategies.

---

## Phase 2: Project Foundation & Directory Scaffolding (Completed)
- [x] Initialize `clinical-sanctuary` folder structure with clean `client/` and `server/` trees.
- [x] Setup Server:
  - Initialize Node.js package (`express`, `mongoose`, `cors`, `helmet`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `express-rate-limit`, `multer`, `google-auth-library`, `twilio`, `supertest`, `jest`).
  - Configure environment configs and entry points (`src/app.js` and `src/server.js`).
- [x] Setup Client:
  - Initialize React + Vite application (`react`, `react-dom`, `react-router-dom`, `lucide-react`, `leaflet`, `react-leaflet`, `axios`).
  - Configure styling system with dark emergency response theme (`#070B14`, `#0F172A`, `#EF4444`, `#10B981`).
- [x] Configure root `.env.example`, `.gitignore`, `.npmrc` (`strict-ssl=false`), and verify both client and server builds.

---

## Phase 3: Core Application & User Management (Completed)
- [x] Implement Backend Database Schemas:
  - `User`: Email, password hash, googleId, name, avatar, role, lastLoginAt.
  - `EmergencyContact`: User reference, name, phone, relationship, isPrimary, email.
  - `MedicalProfile`: User reference, bloodGroup, allergies, conditions, medications, emergencyNotes, voiceConsentGranted, shareWithResponders.
- [x] Implement Authentication Layer:
  - Email/Password Register & Login with bcrypt and JWT generation.
  - Google One-Tap / Google Sign-In backend verification endpoint using `google-auth-library`.
  - Authentication middleware (`authMiddleware.js`) with HTTP-only cookie and Bearer token parsing.
  - Profile endpoint (`GET /api/auth/me`).
- [x] Implement Emergency Contact APIs:
  - CRUD operations (`GET`, `POST`, `PUT`, `DELETE /api/contacts`).
  - Uniqueness and primary designation validation.
- [x] Implement Medical Profile APIs:
  - Get, update, JSON export, and data wipe endpoints (`/api/medical`).
- [x] Implement Frontend Pages & Components:
  - Navigation bar and layout with authentication context (`AuthContext`).
  - Modern Login / Register page with Google Sign-In, email forms, and demo autofill.
  - Contact management page with modal dialogs and form validation.
  - Medical profile editor with biometrics and quick-tag selector for allergies and conditions.

---

## Phase 4: Emergency Response Engine & Mapping (Completed)
- [x] Implement Incident Database Schema & State Machine:
  - `EmergencyIncident`: Code/ID (`CS-YYYYMMDD-XXXX`), user reference, category (`MEDICAL`, `ACCIDENT`, `FIRE`, `CRIME`), status (`CREATED`, `ACTIVE`, `NOTIFYING`, `NOTIFIED`, `RESOLVED`, `PARTIALLY_FAILED`), initialLocation, resolvedAt, audioEvidenceRef.
  - `LocationUpdate`: Incident reference, latitude, longitude, accuracy, timestamp, speed, heading.
  - `NotificationLog`: Incident reference, contact reference, channel (`SMS`), provider (`TWILIO` / `DEV_SIMULATOR`), status (`SENT`, `SIMULATED`, `FAILED`).
- [x] Implement SOS Controller & Services:
  - `POST /api/incidents/sos` — Creates incident, initiates emergency broadcast, records coordinates.
  - `POST /api/incidents/:id/location` — Records live location telemetry (5-second intervals).
  - `GET /api/incidents/:id/locations` — Fetches trajectory history for incident.
  - `POST /api/incidents/:id/resolve` — Closes incident, stops tracking.
  - `GET /api/incidents/history` — Fetches user's emergency case history.
  - `GET /api/incidents/track/:incidentCode` — Public/authorized tracking endpoint for shared SMS links.
- [x] Implement Notification Abstraction Service:
  - `notificationService.js`: Checks for Twilio credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).
  - Dispatches real SMS when configured, or records clearly marked `SIMULATED` dispatches in development mode.
- [x] Implement Hospital Discovery Service:
  - OpenStreetMap Overpass search service with distance computation and fallback verified emergency centers.
- [x] Implement Frontend Emergency Dashboard:
  - Prominent Red SOS button with active pulse animation.
  - Category picker (Medical, Accident, Fire, Crime).
  - Active Response Pipeline stepper (`SOS ACTIVATED` &rarr; `LOCATION BROADCAST` &rarr; `CONTACTS NOTIFIED` &rarr; `AMBULANCE DISPATCHED`).
  - Interactive Leaflet map with user position marker, tracking stream, and nearby hospitals.
  - Shareable Incident Tracking view (`/track/:incidentCode`) for contacts receiving SMS links.

---

## Phase 5: Voice Recognition & Audio Evidence Recording (Completed)
- [x] Implement Voice SOS Activation Hook (`useVoiceRecognition`):
  - Wraps browser `SpeechRecognition` API.
  - Configurable trigger phrases ("emergency", "help me", "sos", "save me").
  - Visual status pill in navigation bar ("Listening for 'Emergency' / 'SOS'").
  - Permission grant handling & browser incompatibility notices.
- [x] Implement Audio Evidence Recording System:
  - `useAudioRecorder` hook wrapping `MediaRecorder` API.
  - Privacy consent modal before automated recording.
  - Multer upload endpoint (`POST /api/incidents/:id/audio`) with file type & size limits.
  - Audio player in Incident Details view for authorized users.
- [x] Multi-Action Orchestration:
  - Single SOS trigger activates: Audio record start + GPS stream + SMS broadcast with graceful degradation if microphone is denied or GPS accuracy is low.

---

## Phase 6: Automated Testing, Security Hardening & Verification (Completed)
- [x] Server automated tests (Jest + Supertest):
  - 34 passing tests across 8 test suites with 100% pass rate.
  - Auth registration, login, token validation, tamper rejection.
  - Contact CRUD validation and user data isolation.
  - Medical profile persistence, JSON export, and data wipe.
  - SOS creation, duplicate prevention, location stream updates, resolution.
  - Notification provider mock tests (Twilio vs Dev simulator).
- [x] Security Hardening:
  - Helmet headers, rate limiting (auth & SOS endpoints), CORS configuration, sanitized inputs.
  - Cross-user data authorization tests (User A cannot view or resolve User B's incident).
- [x] Frontend Build & Lint Verification:
  - Run Vite production build (`npm run build`) — 1697 modules transformed with zero bundling errors.

---

## Phase 7: Documentation & Final Handover (Completed)
- [x] Write complete `README.md` with HP Victus Windows PowerShell run commands.
- [x] Finalize `ARCHITECTURE.md`, `API.md`, `TESTING.md`, and `REQUIREMENTS.md`.
- [x] Seed script (`npm run seed`) with realistic sample patient data (`rahul.patient@example.com`).
