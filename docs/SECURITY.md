# Clinical Sanctuary — Cybersecurity & Privacy Architecture
**Document:** `docs/SECURITY.md`  
**Classification:** Security Architecture Specification  
**Platform:** Clinical Sanctuary (ClinicalGuard)  
**Standard:** OWASP Top 10 + HIPAA / GDPR Health Privacy Compliance Guidelines

---

## 1. Authentication & Session Defense

### 1.1 Password Storage & Cryptographic Hashing
- **Algorithm:** `bcryptjs` utilizing 12 rounds of cryptographic salt.
- Passwords are never logged, never cached in memory, and never returned in API payloads (`select: false` on Mongoose `User` model).

### 1.2 Google Identity Services (GIS) Token Verification
- Client supplies Google ID token via `POST /api/auth/google`.
- The backend uses official `google-auth-library` (`OAuth2Client.verifyIdToken`) to cryptographically verify:
  - Token signature against Google's public JSON Web Key Sets (JWKS).
  - Target audience (`aud === GOOGLE_CLIENT_ID`).
  - Issuer (`iss === 'accounts.google.com'` or `'https://accounts.google.com'`).
  - Expiry timestamp (`exp`).
- In academic development without a configured Google Client ID, tokens are safely parsed and audited, and a clear security warning is recorded in the console.

### 1.3 JWT & Cookie Hardening
- Short-lived JWTs (or 7-day academic tokens) generated with HMAC SHA-256 using `JWT_SECRET`.
- Transmitted via secure `HTTP-only` cookies:
  - `httpOnly: true` (prevents XSS extraction via `document.cookie`).
  - `sameSite: 'lax'` (CSRF mitigation).
  - `secure: process.env.NODE_ENV === 'production'` (enforces TLS transmission in production).

---

## 2. Role-Based Access Control (RBAC)

Clinical Sanctuary enforces explicit role authorization at the route layer:
1. **`USER` (Citizen):** Can only access own profile, own contacts, own medical card, own incidents.
2. **`RESPONDER`:** Can view eligible nearby incidents and accepted cases; cannot view private medical profiles unless the citizen explicitly enabled `shareWithResponders`.
3. **`DISPATCHER`:** Can view the active queue and assign units; cannot alter patient medical notes.
4. **`ADMIN`:** Full system governance.

Cross-user horizontal privilege escalation is strictly blocked in all controller lookups (e.g. `EmergencyIncident.findOne({ _id, userId: req.user._id })`).

---

## 3. Audio Evidence & Medical Privacy Protections

### 3.1 Protected Audio Streaming
- Ambient audio recordings captured via `MediaRecorder` API are stored in an unlisted server directory (`uploads/audio/`).
- Arbitrary public download is blocked; playback is piped exclusively through `GET /api/incidents/:id/audio`, which confirms that the requester is the incident owner, assigned responder, or an authorized dispatcher.

### 3.2 Patient Medical Data Sovereignty (GDPR)
- **Granular Consent:** Patients can toggle `shareWithResponders` on/off at any time.
- **Data Portability:** `GET /api/medical/export` outputs structured JSON.
- **Right to be Forgotten:** `DELETE /api/medical/erase` expunges all recorded allergies, conditions, and notes from disk.

---

## 4. Rate Limiting & Abuse Prevention

- **`apiLimiter`:** 300 requests per 15 minutes per IP.
- **`authLimiter`:** 10 login/register attempts per 15 minutes per IP (brute-force defense).
- **`sosLimiter`:** 5 SOS triggers per 5 minutes per IP (DoS defense + 15-second debounce window on the database layer).

---

## 5. Truth in Notification Advertising (Strict Safety Invariant)
The system **never** reports a message as `SENT` or `DELIVERED` unless verified by carrier API webhooks or upstream confirmations. When running without active Twilio keys, all notification logs are immutably recorded as `SIMULATED`.
