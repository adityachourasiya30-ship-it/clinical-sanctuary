# Requirements Specification & Traceability Matrix
## Clinical Sanctuary (ClinicalGuard) Emergency Alert System

### Academic Context
- **Institution:** Madhav Institute of Technology & Science (MITS), Gwalior (M.P.), India (Deemed University)
- **Degree:** Bachelor of Technology in Artificial Intelligence (BTech AI)
- **Authors:** Aditya Chourasiya (BTAI24O1006) & Anurag Singh Yadav (BTAI24O1014)
- **Supervisor:** Dr. Anu Sayal, Associate Professor, Centre for AI
- **Project Name:** Clinical Sanctuary (referenced in early iterations as ClinicalGuard)
- **Primary Goal:** Provide an immediate, reliable, one-touch & voice-activated emergency response web platform that captures real-time GPS coordinates, broadcasts alerts to primary emergency contacts, records consent-gated ambient audio evidence, and presents vital medical data to first responders.

---

### Architectural Harmonization & Inconsistency Resolution

| Concern | Mentioned in Reports | Selected Standard Architecture | Rationale & Justification |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Django / DRF (M1), Node.js / Express (M2-M5, Macro) | **Node.js (v20+) & Express.js** | Unifies the JavaScript/TypeScript ecosystem across client and server. Express provides lightweight, fast I/O for continuous 5-second GPS telemetry and streaming audio uploads. |
| **Primary Database** | MySQL (M1, M3), MongoDB (M2, M4, M5) | **MongoDB with Mongoose** | Incident logs, medical histories, dynamic location coordinate time-series, and notification audit logs have nested, semi-structured schemas that fit document storage significantly better than tabular SQL schemas. Eliminates complex table migrations for student reproduction. |
| **Mapping Engine** | Google Maps API (M1, M2), Leaflet / OpenStreetMap (M2, M3, M4) | **Leaflet with OpenStreetMap** | Leaflet + OSM is open-source, requires zero billing accounts or paid credit cards, prevents quota blockages during evaluation, and offers full interactive marker, radius, and routing capability. |
| **Authentication** | Firebase Auth (M5) vs Custom Login (M3) vs Google OAuth 2.0 (M4) | **Dual Auth: Google Sign-In (GIS) + Email/Password JWT** | Provides Google Sign-In with server-side verification using `google-auth-library` to avoid client-side spoofing, alongside standard secure email/password authentication (salted bcrypt + JWT) for users without Google accounts. Eliminates heavy Firebase SDK bloat. |
| **Emergency Alerts (SMS)** | Twilio (M2, M5) vs In-App Notifications | **Provider Abstraction (Twilio + Dev Simulator)** | Supports production Twilio SMS delivery when credentials exist, but includes a clearly marked Development Notification Provider so the system runs smoothly offline or in lab environments without mock errors or false delivery claims. |
| **Voice Activation** | Web Speech Recognition API (M5) | **Web Speech API with Keyword Engine** | Recognizes continuous and push phrases ("Emergency", "Help me", "SOS") with clear microphone permission prompts, explicit indicator, and fallback. Honest browser limitation handling. |
| **Audio Evidence** | MediaRecorder API (M4, M5) | **MediaRecorder API + Encrypted Local/Cloud Storage** | Consent-gated recording modal before activation, real-time recording indicator, secure multi-part upload, AES-256 at rest encryption metadata, linked to incident. |

---

### Functional Requirements Matrix & Implementation Status

| Req ID | Category | Source Milestone | Detailed Description | Implementation Status | Verification Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Authentication | M3, M4, Macro | Secure email and password registration and login with bcrypt hashing. | 🟢 Completed & Verified | Tested in `auth.unit.test.js` & `api.integration.test.js` |
| **REQ-AUTH-02** | Authentication | M4, M5 | Google Sign-In via Google Identity Services with server-side ID token verification using `google-auth-library`. | 🟢 Completed & Verified | Implemented in `authController.js` and `LoginPage.jsx` |
| **REQ-AUTH-03** | Authentication | M3, M4 | Secure session management using HTTP-only JWT cookies and Authorization header support. | 🟢 Completed & Verified | Tested in `auth.unit.test.js` |
| **REQ-AUTH-04** | Authentication | M3, M4 | Protected routes in frontend and authentication middleware in backend. | 🟢 Completed & Verified | Tested in `api.integration.test.js` (401 on unauthenticated access) |
| **REQ-AUTH-05** | Authentication | M3, M4 | Secure user logout and token invalidation. | 🟢 Completed & Verified | Implemented in `authController.js` and `AuthContext.jsx` |
| **REQ-DASH-01** | Dashboard | M2, M3, Macro | Central Emergency Dashboard with prominent Red SOS button and status overview. | 🟢 Completed & Verified | Implemented in `DashboardPage.jsx` & `SOSButton.jsx` |
| **REQ-DASH-02** | Dashboard | M2, M3, Macro | Incident classification selection: Medical, Accident, Fire, Crime / Safety. | 🟢 Completed & Verified | Implemented in `IncidentCategorySelector.jsx` |
| **REQ-DASH-03** | Dashboard | M2, M3, Macro | Emergency Response Pipeline visualizer: SOS Activated &rarr; Location Shared &rarr; Contacts Notified &rarr; Responder Assigned / Ambulance. | 🟢 Completed & Verified | Implemented in `ResponsePipeline.jsx` |
| **REQ-DASH-04** | Dashboard | M2, M4, M5 | Real-time system status indicators: GPS status, Microphone status, Voice Listener status. | 🟢 Completed & Verified | Implemented in `MainLayout.jsx` and `DashboardPage.jsx` |
| **REQ-SOS-01** | SOS Engine | M2, M5, Macro | One-click instant SOS activation triggering incident creation and alert pipeline. | 🟢 Completed & Verified | Tested in `incident.unit.test.js` & `api.integration.test.js` |
| **REQ-SOS-02** | SOS Engine | M2, M5 | Explicit incident lifecycle state machine: `CREATED` &rarr; `ACTIVE` &rarr; `NOTIFYING` &rarr; `NOTIFIED` &rarr; `RESOLVED` (or `PARTIALLY_FAILED`). | 🟢 Completed & Verified | Tested in `incident.unit.test.js` |
| **REQ-SOS-03** | SOS Engine | M2, M5 | De-duplication and debounce protection to prevent multiple incident creation on rapid clicks. | 🟢 Completed & Verified | Tested in `incident.unit.test.js` (15-second debounce window) |
| **REQ-SOS-04** | SOS Engine | M2, M5 | Incident resolution workflow: authorized user marks alert resolved, ending tracking and audio. | 🟢 Completed & Verified | Implemented in `incidentController.js` & `ActiveEmergencyBanner.jsx` |
| **REQ-GPS-01** | Location | M2, M4, M5 | Initial device location capture via browser `navigator.geolocation.getCurrentPosition()`. | 🟢 Completed & Verified | Implemented in `useGeolocation.js` |
| **REQ-GPS-02** | Location | M5, Macro | Continuous live GPS streaming: updates coordinates to backend every 5 seconds during active alert. | 🟢 Completed & Verified | Implemented in `DashboardPage.jsx` & `incidentController.js` |
| **REQ-GPS-03** | Location | M4, M5 | Location history time-series storage in dedicated collection (`LocationUpdate`) with incident references. | 🟢 Completed & Verified | Schema in `LocationUpdate.js`, verified in `EmergencyMap.jsx` |
| **REQ-GPS-04** | Location | M2, M4, M5 | Public / Tokenized shareable incident tracking page (`/track/:incidentId`) with live map marker updates. | 🟢 Completed & Verified | Implemented in `TrackIncidentPage.jsx` |
| **REQ-GPS-05** | Location | M2, M4 | Leaflet and OpenStreetMap rendering with user marker, accuracy radius, and hospital discovery. | 🟢 Completed & Verified | Implemented in `EmergencyMap.jsx` (Vite build passed) |
| **REQ-GPS-06** | Location | M1, M2, Macro | Nearby hospital & healthcare facility discovery with distance estimation and navigation links. | 🟢 Completed & Verified | Tested in `hospital.unit.test.js` (Haversine & Overpass fallback) |
| **REQ-CONT-01** | Contacts | M2, M3, Macro | Add, edit, list, and delete emergency contacts (name, phone number, relationship, primary flag). | 🟢 Completed & Verified | Tested in `contact.unit.test.js` and implemented in `ContactsPage.jsx` |
| **REQ-CONT-02** | Contacts | M2, M4, M5 | SMS broadcast to primary emergency contacts upon SOS activation via Twilio or Dev Simulator. | 🟢 Completed & Verified | Tested in `notification.unit.test.js` |
| **REQ-CONT-03** | Contacts | M2, M4, M5 | Notification log auditing with provider response status (sent, simulated, failed). Honest reporting. | 🟢 Completed & Verified | Tested in `notification.unit.test.js` (honest SIMULATED invariant) |
| **REQ-MED-01** | Medical Profile| M2, M4, Macro | User medical profile management: blood group, known allergies, chronic conditions, medications, emergency notes. | 🟢 Completed & Verified | Tested in `medical.unit.test.js` & `MedicalProfilePage.jsx` |
| **REQ-MED-02** | Medical Profile| M4, Macro | Privacy controls: Voice consent preview, JSON export of medical records, permanent data erase. | 🟢 Completed & Verified | Tested in `medical.unit.test.js` & `MedicalProfilePage.jsx` |
| **REQ-MED-03** | Medical Profile| M4, M5 | Option to include vital medical summary in emergency responder alert payload. | 🟢 Completed & Verified | Implemented in `incidentController.js` & `TrackIncidentPage.jsx` |
| **REQ-VOIC-01** | Voice SOS | M5, Macro | Hands-free emergency trigger via Web Speech Recognition API matching phrases ("Emergency", "Help me", "SOS"). | 🟢 Completed & Verified | Tested in `voiceAudio.unit.test.js` & `useVoiceRecognition.js` |
| **REQ-VOIC-02** | Voice SOS | M5 | Visible active listener indicator, microphone toggle, permission handling, and fallback for unsupported browsers. | 🟢 Completed & Verified | Implemented in `MainLayout.jsx` & `DashboardPage.jsx` |
| **REQ-AUD-01** | Audio Evidence| M4, M5 | Emergency audio recording using browser MediaRecorder API upon alert trigger. | 🟢 Completed & Verified | Implemented in `useAudioRecorder.js` |
| **REQ-AUD-02** | Audio Evidence| M4 | Explicit user consent modal and setting toggle before automated audio recording occurs. | 🟢 Completed & Verified | Implemented in `VoiceConsentModal.jsx` |
| **REQ-AUD-03** | Audio Evidence| M4, M5 | Multi-part audio evidence upload to secure backend endpoint, AES-256 encryption metadata, and playback for authorized user. | 🟢 Completed & Verified | Tested in `voiceAudio.unit.test.js` (MIME & size filtering) |
| **REQ-HIST-01** | Case History | M2, M3, M4 | Case history dashboard listing all past emergency incidents with category, timestamps, location snapshot, and audio metadata. | 🟢 Completed & Verified | Implemented in `IncidentHistoryPage.jsx` |
| **REQ-SEC-01** | Security & QA | M4, M5, Macro | Server-side input validation, rate limiting, helmet security headers, sanitized error responses, OWASP compliance. | 🟢 Completed & Verified | Tested in `api.integration.test.js` |
| **REQ-TEST-01** | Testing | M5, Macro | Automated unit & integration tests covering authentication, contacts, medical profile, SOS state transitions, GPS telemetry, and notifications. | 🟢 Completed & Verified | 34 automated tests passing with 100% pass rate |
