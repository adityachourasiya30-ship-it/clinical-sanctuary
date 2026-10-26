# RESTful API Specification
## Clinical Sanctuary (ClinicalGuard) — Emergency Alert & Response Platform

Base URL: `http://localhost:5000/api`

Protected endpoints require an `Authorization: Bearer <token>` header or an authenticated HTTP-only session cookie.

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register account (`name`, `email`, `password`, optional `role`, `badgeNumber`, `organization`). |
| `POST` | `/api/auth/login` | Public | Sign in with email and password. |
| `POST` | `/api/auth/google` | Public | Sign in using server-verified Google ID Token (`credential`). |
| `GET` | `/api/auth/me` | Protected | Fetch current user session, role, and responder profile if applicable. |
| `POST` | `/api/auth/logout` | Protected | Invalidate session and clear HTTP-only cookie. |

---

## 2. Emergency Incidents Endpoints (`/api/incidents`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/incidents/sos` | Protected | Trigger SOS alert (15s debounce, creates incident, dispatches notifications). |
| `GET` | `/api/incidents/history` | Protected | Retrieve authenticated user's chronological incident activations. |
| `POST` | `/api/incidents/:id/location` | Protected | Ingest 5-second GPS coordinate breadcrumb during active emergency. |
| `GET` | `/api/incidents/:id/locations` | Protected | Retrieve all telemetry coordinates for an incident. |
| `POST` | `/api/incidents/:id/resolve` | Protected | Conclude active emergency, mark safe, and terminate live telemetry. |
| `POST` | `/api/incidents/:id/cancel` | Protected | Cancel alert as false alarm with mandatory reason logged to audit trail. |
| `GET` | `/api/incidents/:id/events` | Protected | Retrieve immutable chronological event timeline for incident. |
| `POST` | `/api/incidents/:id/audio` | Protected | Upload 30-60s ambient audio evidence file (multipart/form-data, max 25MB). |
| `GET` | `/api/incidents/:id/audio` | Protected | Authenticated streaming of private emergency audio recording. |
| `GET` | `/api/incidents/track/:code` | Public | Real-time tracking view for contacts and assigned responders. |

---

## 3. Responder Operations Endpoints (`/api/responder`)
*Requires `role: RESPONDER` or `ADMIN`.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/responder/profile` | Retrieve responder profile, unit details, vehicle type, and current duty status. |
| `POST` | `/api/responder/availability` | Toggle availability on/off duty and broadcast staging location. |
| `GET` | `/api/responder/incidents` | Discover nearby active emergency incidents eligible for field response. |
| `POST` | `/api/responder/incidents/:id/accept` | Accept incident dispatch and designate unit as active first responder. |
| `POST` | `/api/responder/incidents/:id/status` | Update tactical status (`EN_ROUTE`, `ARRIVED`, `RESOLVED`). |
| `GET` | `/api/responder/incidents/:id/medical` | Access patient emergency medical snapshot if patient consented to share. |

---

## 4. Central Dispatch Endpoints (`/api/dispatch`)
*Requires `role: DISPATCHER` or `ADMIN`.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dispatch/queue` | Paginated operational incident queue with category, status, and urgency filters. |
| `GET` | `/api/dispatch/responders` | Real-time list of all on-duty verified field responders. |
| `POST` | `/api/dispatch/incidents/:id/assign` | Dispatch a specific responder unit to an emergency case. |
| `GET` | `/api/dispatch/stats` | Operational metrics (active alerts, fleet capacity, total volume). |

---

## 5. Emergency Contacts (`/api/contacts`)
*Protected — Authenticated user's private contact book.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/contacts` | List configured emergency contacts. |
| `POST` | `/api/contacts` | Add contact (`name`, `phone`, `relationship`, `isPrimary`, `email`). |
| `PUT` | `/api/contacts/:id` | Update contact information or designate as primary contact. |
| `DELETE` | `/api/contacts/:id` | Remove emergency contact. |

---

## 6. Patient Medical Profile (`/api/medical`)
*Protected — Sensitive healthcare records.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medical` | Fetch user medical profile (blood group, allergies, medications, notes). |
| `PUT` | `/api/medical` | Update medical fields, voice consent token, and responder sharing toggle. |
| `GET` | `/api/medical/export` | Export medical records as portable JSON card. |
| `DELETE` | `/api/medical/erase` | Permanently expunge medical history under GDPR Right to be Forgotten. |

---

## 7. Healthcare Facilities (`/api/hospitals`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hospitals/nearby?lat=...&lng=...&radius=...` | Retrieve nearby verified trauma centers, contact phones, and distance estimates. |
