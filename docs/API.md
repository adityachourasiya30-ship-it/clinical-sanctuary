# RESTful API Specification
## Clinical Sanctuary Emergency Alert System

Base URL: `/api`

All protected endpoints require an `Authorization: Bearer <token>` header or a valid `jwt` HTTP-only cookie.

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Register a new user with email and password.
- **Request Body:**
  ```json
  {
    "name": "Aditya Chourasiya",
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "664fa...",
      "name": "Aditya Chourasiya",
      "email": "user@example.com",
      "role": "USER"
    }
  }
  ```

### `POST /api/auth/login`
Authenticate with email and password.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`:** Same structure as register.

### `POST /api/auth/google`
Authenticate using Google Identity Services ID Token.
- **Request Body:**
  ```json
  {
    "credential": "<Google ID Token string>"
  }
  ```
- **Response `200 OK`:** Authenticates or creates the user after server-side verification and returns session token.

### `GET /api/auth/me` *(Protected)*
Retrieve current authenticated user profile and verification status.

### `POST /api/auth/logout` *(Protected)*
Invalidates session cookie and clears client authorization state.

---

## 2. Emergency Contacts Endpoints (`/api/contacts`)

### `GET /api/contacts` *(Protected)*
Returns all emergency contacts for the authenticated user.

### `POST /api/contacts` *(Protected)*
Creates a new emergency contact.
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "phone": "+919876543210",
    "relationship": "Mother",
    "isPrimary": true,
    "email": "jane@example.com"
  }
  ```

### `PUT /api/contacts/:id` *(Protected)*
Updates an existing contact owned by the user.

### `DELETE /api/contacts/:id` *(Protected)*
Removes an emergency contact.

---

## 3. Medical Profile Endpoints (`/api/medical`)

### `GET /api/medical` *(Protected)*
Fetches medical profile for current user. Creates default if none exists.

### `PUT /api/medical` *(Protected)*
Updates medical profile fields.
- **Request Body:**
  ```json
  {
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Sulfa drugs"],
    "medicalConditions": ["Asthma"],
    "medications": ["Inhaler"],
    "emergencyNotes": "Keep rescue inhaler nearby",
    "voiceConsentGranted": true,
    "shareWithResponders": true
  }
  ```

### `GET /api/medical/export` *(Protected)*
Exports entire patient profile, emergency contacts, and incident history as a downloadable JSON object.

### `DELETE /api/medical/erase` *(Protected)*
Permanently erases all medical profile records and audio recordings for the user (Right to be Forgotten).

---

## 4. Emergency SOS & Incident Endpoints (`/api/incidents`)

### `POST /api/incidents/sos` *(Protected)*
Triggers emergency alert workflow.
- **Request Body:**
  ```json
  {
    "category": "MEDICAL", // "MEDICAL" | "ACCIDENT" | "FIRE" | "CRIME"
    "triggerType": "MANUAL", // "MANUAL" | "VOICE"
    "latitude": 26.2183,
    "longitude": 78.1828,
    "accuracy": 10.5,
    "address": "Gwalior, Madhya Pradesh"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "incident": {
      "id": "6650...",
      "incidentCode": "CS-20261021-4821",
      "category": "MEDICAL",
      "status": "NOTIFIED",
      "createdAt": "2026-10-21T17:00:00.000Z",
      "trackingUrl": "http://localhost:5173/track/CS-20261021-4821"
    },
    "notificationResults": [
      {
        "contactName": "Jane Doe",
        "phone": "+919876543210",
        "status": "SIMULATED",
        "channel": "SMS"
      }
    ]
  }
  ```

### `POST /api/incidents/:id/location` *(Protected)*
Streams a real-time GPS coordinate update during an active emergency.
- **Request Body:**
  ```json
  {
    "latitude": 26.2188,
    "longitude": 78.1834,
    "accuracy": 6.2,
    "speed": 1.2,
    "heading": 90.0
  }
  ```

### `GET /api/incidents/:id/locations` *(Protected / Tracking)*
Returns coordinate history for an incident to render real-time breadcrumb trail on the map.

### `POST /api/incidents/:id/audio` *(Protected)*
Uploads emergency audio recording captured by MediaRecorder API.
- Multipart form-data containing field `audio` (audio file) and optional `duration`.

### `POST /api/incidents/:id/resolve` *(Protected)*
Marks an emergency incident as RESOLVED. Stops GPS streaming and seals incident log.

### `GET /api/incidents/history` *(Protected)*
Retrieves all historical incidents belonging to the user.

### `GET /api/incidents/track/:incidentCode` *(Public / Tokenized)*
Public tracking endpoint accessed by emergency contacts via SMS link. Returns incident details, live coordinates, and authorized medical summary without exposing private account settings.

---

## 5. Healthcare & Hospital Discovery Endpoints (`/api/hospitals`)

### `GET /api/hospitals/nearby?lat=26.2183&lng=78.1828&radius=5000`
Discovers nearby hospitals, clinics, and emergency centers using OpenStreetMap / Overpass API with computed distance and direct Google Maps / Apple Maps navigation links.
