# Clinical Sanctuary (ClinicalGuard) — Next-Generation Emergency Alert & Response Platform

> **Academic Macro Project**  
> **Degree:** Bachelor of Technology in Artificial Intelligence (B.Tech AI)  
> **Institution:** Madhav Institute of Technology & Science (MITS), Gwalior (M.P.), India  
> **Candidates:** Aditya Chourasiya (BTAI24O1006) & Anurag Singh Yadav (BTAI24O1014)  
> **Supervisor:** Dr. Anu Sayal, Associate Professor, Centre for AI  
> **Platform Tagline:** *Precision in every Response*  
> **Visual Identity:** Midnight Teal + Coral — Premium Emergency Healthcare UI

---

## 1. Project Overview & Clinical Mission

**Clinical Sanctuary** (also documented as *ClinicalGuard* in academic milestone reports) is a next-generation life-critical emergency orchestration platform designed to bridge the vital time gap between distress onset and emergency responder arrival.

In acute emergencies (cardiac arrest, traffic collisions, structure fires, or personal threats), individuals often experience severe panic, disorientation, or physical trauma that prevents multi-step smartphone navigation. Clinical Sanctuary solves this through:

1. **One-Touch & Hands-Free SOS Activation:** Instant emergency broadcast triggered manually or via hands-free browser speech recognition ("Emergency", "Help me", "SOS").
2. **Uber-Inspired Assistance Lifecycle:** Transparent state progression from `CREATED` → `ACTIVE` → `NOTIFIED` → `ASSIGNED` → `EN_ROUTE` → `ARRIVED` → `RESOLVED` (with false-alarm cancellation support).
3. **Continuous 5-Second GPS Telemetry:** Automatic high-accuracy coordinate streaming to authorized responders and trusted contacts with an interactive Leaflet radar breadcrumb stream.
4. **Multi-Channel Contact Alerts:** Automated SMS dispatch via Twilio carrier integration with automatic fallback to an honest, non-charging development simulation provider.
5. **Three Operational User Journeys:**
   - **Citizen:** Rapid SOS, emergency contacts, medical profile, consent-gated ambient audio notes, public tracking link.
   - **Field Responder:** Availability/duty toggle, incident discovery queue, accept/decline dispatches, tactical status updates, patient medical summary.
   - **Central Dispatcher:** Multi-agency incident triage, category/urgency filters, fleet allocation, and complete audit event history.
6. **Official Emergency Helplines Direct Dial:** Prominent, instant-dial links to National Emergency (**112**), Ambulance (**108**), and Police (**100**).
7. **Nearby Healthcare Directory:** Interactive OpenStreetMap/Overpass mapping of district trauma centers with real computed distances and navigation links.
8. **Patient Data Sovereignty (GDPR):** Complete medical profile control, portable JSON export, and permanent data erasure.

---

## 2. Visual System: Midnight Teal + Coral

The application features a modern, accessible emergency healthcare visual theme:

- **Main Background:** `#101B2D`
- **Primary Surface:** `#18263A`
- **Elevated Surface:** `#213149`
- **Primary Teal:** `#19B6A4` (readiness, positive action, telemetry navigation)
- **Emergency Coral:** `#FF5A52` (critical SOS alerts, distress status, dangerous states)
- **Main Text:** `#F5F7FB`
- **Secondary Text:** `#AAB8CA`
- **Subtle Borders:** `#24354B`
- **Typography:** Plus Jakarta Sans & JetBrains Mono

---

## 3. Quick Start (Windows Laptop)

### Automated Launch via `start-project.bat`
Double-click **`start-project.bat`** in the project root directory. It will:
1. Verify Node.js and dependencies.
2. Check that the local MongoDB Windows Service is active.
3. Check port occupancy for 5000 and 5173.
4. Launch the Backend and Frontend servers in separate dedicated terminals.

### Manual Launch (PowerShell)

**Terminal 1 — Backend API Server:**
```powershell
cd server
npm.cmd start
```
*Backend URL:* **http://localhost:5000**  
*Health Endpoint:* **http://localhost:5000/api/health**

**Terminal 2 — Frontend Web Application:**
```powershell
cd client
npm.cmd run dev
```
*Frontend URL:* **http://localhost:5173**

---

## 4. Pre-Seeded Academic Demo Personas

The local MongoDB database (`emergency_alert_system`) contains three verified personas:

| Persona | Role | Email | Password | Primary Interface |
|---|---|---|---|---|
| **Rahul Sharma** | Citizen / Patient | `rahul.patient@example.com` | `EmergencyPass2026!` | Citizen Dashboard (`/dashboard`) |
| **Officer Vikram Singh** | Field Responder (EMT) | `vikram.responder@example.com` | `EmergencyPass2026!` | Responder Duty Desk (`/responder`) |
| **Anita Verma** | Central Dispatcher | `anita.dispatcher@example.com` | `EmergencyPass2026!` | Dispatch Control Room (`/dispatch`) |

*(You can also use the one-click persona fill buttons on the login page!)*

To re-seed fresh demo data at any time:
```powershell
cd server
npm.cmd run seed
```

---

## 5. Automated Testing & Verification

The backend includes a comprehensive Jest test suite covering authentication, incident state transitions, responder assignments, hospital discovery, audio validation, and API integration.

To execute the test suite:
```powershell
cd server
npm.cmd test
```

**Test Suites:** 9 passed, 9 total  
**Tests:** 37 passed, 37 total  
**Production Build:** `npm.cmd run build` inside `client` produces clean, minified bundles with zero errors.

---

## 6. Project Documentation Index

- `docs/IMPLEMENTATION_AUDIT.md`: Baseline status, gap analysis, and phased engineering audit.
- `docs/ARCHITECTURE.md`: High-level system architecture, state machine, and data models.
- `docs/API.md`: Complete RESTful API endpoints reference.
- `docs/SECURITY.md`: Authentication hardening, RBAC, audio protection, and GDPR data sovereignty.
- `docs/DEPLOYMENT.md`: Step-by-step production deployment guide for MongoDB Atlas, Render, and Vercel.
- `docs/REQUIREMENTS.md`: Milestone 1–5 functional traceability matrix.
- `docs/TESTING.md`: QA strategy and automated test results.

---

## 7. Operational & Legal Disclaimer

Clinical Sanctuary is designed as an assistive, supplementary emergency communication tool. It does not replace official national emergency response services. In life-threatening emergencies, citizens must always dial national helpline **112** (or local emergency numbers 100/108/911) directly.
