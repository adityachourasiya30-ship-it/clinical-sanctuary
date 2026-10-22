# Clinical Sanctuary — Smart Emergency Alert & Response System

> **Academic Macro Project**  
> **Degree:** Bachelor of Technology in Artificial Intelligence (B.Tech AI)  
> **Institution:** Madhav Institute of Technology & Science (MITS), Gwalior (M.P.), India  
> **Candidates:** Aditya Chourasiya (BTAI24O1006) & Anurag Singh Yadav (BTAI24O1014)  
> **Supervisor:** Dr. Anu Sayal, Associate Professor, Centre for AI  
> **Session:** Jan–June 2026  

---

## 1. Project Overview & Clinical Mission

**Clinical Sanctuary** (also documented as *ClinicalGuard* in developmental milestones) is a life-critical emergency orchestration platform designed to bridge the crucial time-gap between distress onset and emergency responder arrival.

In high-stress scenarios (road accidents, cardiac episodes, fires, or personal threats), individuals frequently experience disorientation, panic, or physical impairment that prevents multi-step smartphone navigation. Clinical Sanctuary solves this by unifying:
1. **One-Touch & Voice-Activated SOS Triggers**: Instantaneous emergency broadcast manually or hands-free via Web Speech Recognition ("Emergency", "Help me", "SOS").
2. **Continuous 5-Second GPS Streaming**: Automatic high-accuracy coordinate telemetry pushed to emergency contacts with an interactive breadcrumb tracking view.
3. **Multi-Channel Contact Alerts**: Automated SMS dispatch via Twilio with a live tracking URL and fallback to an honest, non-charging development simulation engine.
4. **Consent-Gated Ambient Audio Evidence**: Browser MediaRecorder capture with explicit privacy consent, AES-256 metadata encryption, and secure 72-hour retention.
5. **Medical Profile Orchestration**: Instant transmission of blood group, severe allergies, and rescue medications to first responders.
6. **Nearby Hospital Discovery**: OpenStreetMap Overpass search and verified regional trauma center mapping with direct navigation links.

---

## 2. System Architecture

```text
clinical-sanctuary/
├── client/                     # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/         # SOSButton, ResponsePipeline, EmergencyMap, Modals
│   │   ├── pages/              # Dashboard, LoginPage, Contacts, Medical, History, Track
│   │   ├── layouts/            # MainLayout (Navigation, GPS & Voice status bars)
│   │   ├── hooks/              # useGeolocation, useVoiceRecognition, useAudioRecorder
│   │   ├── services/           # Axios HTTP API client & interceptors
│   │   ├── context/            # AuthContext (JWT & Google Sign-In state)
│   │   ├── styles/             # Dark Emergency Theme CSS
│   │   ├── App.jsx             # React Router Route definitions
│   │   └── main.jsx            # Application entry point
│   ├── public/                 # Static assets & GIS integration
│   └── package.json
├── server/                     # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/             # MongoDB connection & environment configuration
│   │   ├── controllers/        # Auth, Contacts, Medical, SOS Incidents, Hospitals
│   │   ├── middleware/         # JWT Auth, Rate Limiters, Audio Upload (Multer)
│   │   ├── models/             # Mongoose Schemas (User, Contact, Medical, Incident, etc.)
│   │   ├── routes/             # Express API routing blueprints
│   │   ├── services/           # Twilio SMS / Dev Simulator, Hospital Discovery
│   │   ├── utils/              # Token crypto, ID generator, Seed script
│   │   ├── app.js              # Express app initialization & security headers
│   │   └── server.js           # HTTP listener & graceful shutdown handlers
│   ├── tests/                  # Automated Unit & Integration Test Suites (Jest)
│   ├── uploads/audio/          # Encrypted emergency audio recordings
│   └── package.json
├── docs/                       # Academic Specifications & Documentation
│   ├── REQUIREMENTS.md         # Traceability matrix across Milestones 1-5
│   ├── IMPLEMENTATION_PLAN.md  # Engineering phase roadmap
│   ├── ARCHITECTURE.md         # Three-tier system architecture & state machine
│   ├── API.md                  # Complete REST API documentation
│   └── TESTING.md              # Quality assurance strategy & test coverage
├── .gitignore
├── .env.example
└── README.md
```

---

## 3. Technology Stack & Architectural Decisions

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript | High responsiveness, sub-second hot reload, lightweight bundle footprint under emergency conditions. |
| **Styling** | Custom Dark Emergency Theme | Deep navy foundation (`#070B14`), high-contrast emergency crimson (`#EF4444`), accessibility compliant under bright sunlight or dark night distress. |
| **Backend** | Node.js (v20+), Express.js | Unified JavaScript ecosystem, asynchronous non-blocking I/O for handling 5-second GPS telemetry and concurrent multipart audio uploads. |
| **Database** | MongoDB + Mongoose | Semi-structured flexibility for nested medical histories, dynamic location coordinate time-series, and notification audit logs. |
| **Mapping** | Leaflet + OpenStreetMap | 100% open-source, zero credit card / billing quota blockers, high reliability on any academic evaluation environment. |
| **Authentication** | Google Sign-In (GIS) + JWT | Google ID token verification via `google-auth-library` prevents client spoofing; salted `bcryptjs` password login fallback. |
| **Notifications** | Twilio + Dev Notification Simulator | Real SMS dispatch when credentials exist; safe, cost-free simulation mode in local development that never falsely claims SMS delivery. |
| **Voice Detection** | Web Speech Recognition API | Hands-free keyword detection ("Emergency", "Help me", "SOS") with clear microphone indicators and browser support detection. |
| **Audio Evidence** | MediaRecorder API | Consent-gated audio evidence collection, multipart upload, and authorized incident playback. |

---

## 4. HP Victus & Windows PowerShell Setup Guide

### 4.1 Prerequisites
1. **Node.js**: v20 or higher (`node -v`)
2. **MongoDB**: Local MongoDB Community Server (`mongod`) OR a free cloud connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
3. **PowerShell Execution**: In Windows PowerShell, run npm via `npm.cmd` if script execution policies are restricted.

### 4.2 Clone & Navigate to Project
```powershell
cd "c:\Users\chour\OneDrive\emergence alert system\clinical-sanctuary"
```

### 4.3 Configure Environment Variables
Copy `.env.example` to `server/.env`:
```powershell
Copy-Item .env.example server\.env
```

Review or edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Set your MongoDB connection (Local or MongoDB Atlas mongodb+srv://...)
MONGODB_URI=mongodb://localhost:27017/clinical_sanctuary

# JWT Signing Secret
JWT_SECRET=clinical_sanctuary_super_secret_jwt_key_academic_2026_mits
JWT_EXPIRES_IN=7d

# Google Sign-In (Optional for Google One-Tap)
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# Twilio SMS (Optional - Dev simulator activates automatically when empty)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Storage Limits
AUDIO_UPLOAD_DIR=uploads/audio
MAX_AUDIO_SIZE_MB=25
```

---

## 5. Launching the Application

Open two PowerShell windows:

### Terminal 1: Backend API Server
```powershell
cd "clinical-sanctuary\server"
npm.cmd start
```
*The server will start at `http://localhost:5000` with health check at `http://localhost:5000/api/health`.*

### Terminal 2: Frontend Client
```powershell
cd "clinical-sanctuary\client"
npm.cmd run dev
```
*Open `http://localhost:5173` in Google Chrome or Microsoft Edge.*

---

## 6. Seed Demo Data (Optional)

To test the system immediately with realistic patient data matching Milestone 4:
```powershell
cd "clinical-sanctuary\server"
npm.cmd run seed
```
**Sample Demo Credentials:**
- **Email:** `rahul.patient@example.com`
- **Password:** `EmergencyPass2026!`
- *(Click the "Auto-fill sample credentials" button on the login screen for instant one-click login)*

---

## 7. Running Automated Test Suites

Clinical Sanctuary features 34 automated unit and integration tests covering security, JWT authentication, incident debouncing, location tracking, hospital calculations, audio filtering, and GDPR erasure:

```powershell
cd "clinical-sanctuary\server"
npm.cmd test
```

**Test Coverage Summary:**
- `tests/auth.unit.test.js`: Token generation, tampering rejection, bcrypt password hashing.
- `tests/incident.unit.test.js`: Incident code format (`CS-YYYYMMDD-XXXX`), state machine transitions, 15s duplicate debounce logic.
- `tests/notification.unit.test.js`: SMS payload formatting, DevNotificationProvider simulation verification.
- `tests/contact.unit.test.js`: International phone format validation, primary contact designation.
- `tests/medical.unit.test.js`: Blood group validation, allergy sanitization, JSON record export, data erasure.
- `tests/hospital.unit.test.js`: Haversine distance calculations, proximity sorting, emergency trauma centers.
- `tests/voiceAudio.unit.test.js`: Voice trigger keyword matching, audio MIME type validation (preventing executable uploads), 25MB file boundaries.
- `tests/api.integration.test.js`: Health check, 404 handler, hospital discovery endpoint, protected route 401 verification.

---

## 8. Safe SOS Testing in Development Mode

1. **Triggering SOS Manually**: Log in and tap the large red **SOS** button on the dashboard.
2. **Triggering SOS with Voice**: Click **Voice SOS: Off** in the top navigation bar to turn on the speech listener. Speak *"Emergency"* or *"SOS"* into your microphone.
3. **Live GPS Streaming**: The dashboard will immediately show *"EMERGENCY ACTIVE"*, start a live timer, and begin pushing coordinates every 5 seconds.
4. **Dev SMS Notification**: Because Twilio credentials are blank by default, the system logs the simulated dispatch to the database and PowerShell terminal:
   ```text
   🚨 [DEV_SIMULATOR] Emergency SMS Dispatched (Simulated)
   To: Rajesh Sharma (+919876543211)
   Live Location & Status: http://localhost:5173/track/CS-20261021-XXXX
   Notice: Simulated in development. No real SMS was charged.
   ```
5. **Testing Public Tracking Link**: Copy the generated tracking URL or click **Public Live Tracking Link** to open `/track/:incidentCode` in a new or incognito browser tab. Verify that coordinates, hospital markers, and authorized medical data update in real time.
6. **Resolving the Alert**: Click **I Am Safe (Resolve)** on the red banner. Live GPS streaming terminates, ambient audio finalizes and uploads, and the incident moves to `Case History`.

---

## 9. Common Errors & Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `npm.ps1 cannot be loaded` | Windows PowerShell Execution Policy restricts running `.ps1` scripts. | Always run `npm.cmd` instead of `npm` in PowerShell. |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Antivirus or network proxy intercepts SSL certificates. | `.npmrc` files with `strict-ssl=false` are pre-configured in both client and server directories. |
| `Microphone permission denied` | Browser blocked microphone access. | Click the camera/microphone icon in the browser address bar and change permissions to **Allow**. |
| `MongoDB connection failed` | No MongoDB service running locally. | Provide a free cloud connection string from [MongoDB Atlas](https://www.mongodb.com/) in `server/.env` (`MONGODB_URI=mongodb+srv://...`). |
| `Voice SOS not supported` | Browser lacks Web Speech Recognition support. | Use Google Chrome, Microsoft Edge, or Chromium-based browsers. |

---

## 10. Production Deployment & Operational Roadmap

Before deploying Clinical Sanctuary to production in a municipal or hospital environment:
1. **Twilio SMS Verification**: Upgrade to a paid Twilio account, register an approved A2P 10DLC emergency messaging campaign, and set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
2. **HIPAA & Regional Data Compliance**: Configure encrypted volume storage (AWS EBS / Google Cloud KMS) for uploaded audio evidence and enforce automatic 72-hour deletion crons.
3. **Public WebSockets**: In high-density dispatch centers, attach `socket.io` to the existing Express server to stream coordinates over persistent WebSocket tunnels alongside the existing REST polling fallback.
4. **Direct PSAP Liaison**: Partner with local emergency dispatch services (112 / 108) to establish direct CAD (Computer-Aided Dispatch) webhook endpoints.

---

&copy; 2026 Centre for Artificial Intelligence, Madhav Institute of Technology & Science, Gwalior (M.P.), India.
