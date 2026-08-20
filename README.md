# ??? Federal Supreme Court of Ethiopia — Electronic Case Management & E-Filing System (EF-CMS)

<div align="center">

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas%20%2F%20Mongoose-emerald.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/system-Judiciary%20Enterprise-blue.svg)]()
[![Integration](https://img.shields.io/badge/LEX--RATING-Webhook%20Dispatcher-orange.svg)]()

**A full-stack, real-time judicial docketing, advocate verification, electronic evidence management, and multi-tier court integration platform.**

</div>

---

## ?? Table of Contents
1. [Overview](#-overview)
2. [Key Capabilities & Modules](#-key-capabilities--modules)
3. [System Architecture & Hybrid Database](#-system-architecture--hybrid-database)
4. [Ministry of Justice (MoJ) Advocate Verification Registry](#-ministry-of-justice-moj-advocate-verification-registry)
5. [Judicial Evaluation & Dual-Sided Rating System](#-judicial-evaluation--dual-sided-rating-system)
6. [5-Minute Post-Judgment Window & Formal Appeal System](#-5-minute-post-judgment-window--formal-appeal-system)
7. [LEX-RATING Webhook Dispatcher Integration](#-lex-rating-webhook-dispatcher-integration)
8. [Project Structure](#-project-structure)
9. [Installation & Setup](#-installation--setup)
10. [Test Accounts & Demo Credentials](#-test-accounts--demo-credentials)
11. [API Endpoint Reference](#-api-endpoint-reference)

---

## ??? Overview

The **Federal Supreme Court Case Management System (EF-CMS)** digitizes court proceedings, filings, hearing scheduling, multi-tier judicial assignments, and advocate oversight across the Ethiopian Federal Judicial system (Federal Supreme Court, Cassation Division, High Court, and First Instance Benches).

It also integrates seamlessly with the **LEX-RATING System** to provide real-time judicial performance data and advocate license synchronization.

---

## ?? Key Capabilities & Modules

### 1. Multi-Role Judicial Portals
* **Litigants (Plaintiff & Defendant)**: File claims, upload evidence, track hearing dates, appoint/dismiss licensed advocates, submit advocate performance reviews, and lodge statutory appeals.
* **Licensed Bar Advocates & Public Defenders**: Manage caseload, accept/decline client representation requests, disclose two-stage evidence, track judicial performance scores, and file pleadings.
* **Judicial Screening Officers & Court Clerks**: Review and screen incoming filings, classify evidence (admissibility, redaction, confidentiality), route cases to regional divisions (Supreme, Lideta, Arada), and schedule courtrooms.
* **Public Prosecutors**: File state criminal indictments with official prosecutor credentials.
* **Presiding Judges**: Conduct hearings, order formal document demands, deliver final decrees with explicit winner/loser determinations, evaluate advocate trial conduct, and set appeal windows.
* **Court Administrators**: Audit system operations, monitor SMS notifications, manage court registries, and inspect database/webhook health.

---

## ??? System Architecture & Hybrid Database

The platform operates on a **MongoDB Atlas Cloud Database** managed through **Mongoose ODM**, coupled with a zero-downtime local JSON fallback layer.

### Mongoose Models (`models/`):
* **`Case.js`**: Core docket document with top-level fields for fast indexing (`caseId`, `caseTitle`, `caseType`, `dateDecided`, `status`, `judgeId`, `judgeName`, `plaintiffClientId`, `plaintiffClientName`, `plaintiffLawyerLicense`, `plaintiffLawyerName`, `judgeRatingPlaintiff`, `clientRatingPlaintiff`, `defendantClientId`, `defendantClientName`, `defendantLawyerLicense`, `defendantLawyerName`, `judgeRatingDefendant`, `clientRatingDefendant`, `verdict`).
* **`Lawyer.js`**: Advocate profiles, MoJ license numbers, specialization, caseload, judicial ratings registry, and client review histories.
* **`Judge.js`**: Judges, branch assignments, and courtroom numbers.
* **`Staff.js`**: Court Administrators, Screening Officers, Filing Clerks, and Prosecutors.
* **`VerifiedLicense.js`**: Ministry of Justice Federal Bar Registry database.
* **`WebhookLog.js`**: Audit trail of all outbound webhook dispatches to external rating platforms.
* **`Notification.js` & `SmsLog.js`**: Dispatch history and real-time hearing alerts.

---

## ?? Ministry of Justice (MoJ) Advocate Verification Registry

The system incorporates a verification database containing **37+ registered advocates, public defenders, and state prosecutors** across Ethiopian jurisdictions:

* **Real-Time Verification**: Instant lookup by License Number (`GET /api/licenses/verify/:licenseNumber`).
* **Registration Anti-Fraud Gate**: Lawyers can only register if their license is active in the MoJ database.
* **Status Enforcement**: `ACTIVE`, `SUSPENDED` (e.g. pending ethics review), `EXPIRED`, or `REVOKED`.
* **Litigant Appointment Verification**: Litigants can search and verify advocate licenses before dispatching representation requests.

#### Sample Registered Advocates:
| License Number | Advocate Full Name | Specialization | Bar Tier | Status |
| :--- | :--- | :--- | :--- | :--- |
| `LAW-1001` | **Kebede Haile Mariam** | Criminal | Federal Supreme Court | `ACTIVE` |
| `LAW-1002` | **Tigist Alemu Bekele** | Corporate | Federal High Court | `ACTIVE` |
| `LAW-1003` | **Dawit Girma Tadesse** | Civil | Federal High Court | `ACTIVE` |
| `LAW-1004` | **Mekdes Tesfaye Wolde** | Family | Federal First Instance | `ACTIVE` |
| `LAW-1005` | **Yohannes Bekele Asrat** | Civil | Federal Supreme Court | `ACTIVE` |
| `LAW-1020` | **Hirut Gebremedhin Tadesse** | Land | Federal Supreme Court | `ACTIVE` |
| `LAW-1029` | **Hailemariam Dessalegn** | Civil Litigation | Federal High Court | `SUSPENDED` |
| `LAW-1030` | **Almaz Tefera Berhanu** | Family | Federal First Instance | `EXPIRED` |
| `LAW-2001` | **Dawit Kebede** | Public Defense | State Appointed Pool | `ACTIVE` |

---

## ? Judicial Evaluation & Dual-Sided Rating System

### A. Judicial Verdict & Winner Determination
When delivering a final decree (`POST /api/cases/:id/verdict`), the court explicitly records:
* `winningParty`: `'plaintiff'` | `'defendant'` | `'settlement'` | `'partial'`
* `winnerName` & `loserName`: Full names of winning and losing parties.
* `winningSide` & `losingSide`: Legal designations (`'plaintiff'` / `'defendant'`).
* `outcomeSummary`: Human-readable summary (e.g. *"Plaintiff Won (Awash Bank) — Defendant Lost (Blue Nile)"*).

### B. Advocate Evaluation:
1. **Judge Rating**: The judge rates trial conduct, pleading quality, and legal accuracy (1.0–5.0) for both plaintiff and defense advocates.
2. **Litigant Client Rating**: Post-judgment, clients can rate their appointed advocate (1–5 stars + written feedback) via `POST /api/cases/:id/rate-lawyer`.

---

## ?? 5-Minute Post-Judgment Window & Formal Appeal System

* **Post-Judgment Grace Period**: To facilitate rapid testing (simulating the real-world 1–2 month statutory appeal window), cases enter a **5-Minute Grace Period** upon verdict delivery (`POST_JUDGMENT_GRACE_MS = 5 * 60 * 1000`).
* **Live Countdown Timer**: Litigants and lawyers see a live 1-second countdown ticker in their portal.
* **During the 5 Minutes**:
  * Clients can rate their appointed advocate.
  * Lawyers/clients can lodge a **Formal Statutory Appeal** (`POST /api/cases/:id/appeal`), which escalates the docket to `'appealed'` and routes it to the Appellate Bench.
* **Post Expiration**: After 5 minutes, filer/defendant temporary access accounts expire automatically (HTTP 403).

---

## ?? LEX-RATING Webhook Dispatcher Integration

The system automatically transmits concluded cases and advocate license updates to the **LEX-RATING System** via HTTP webhooks.

### Business Logic & Filtering Rules (Lawyer vs. Lawyer Only):
1. **Adversarial Debate Only**: Webhooks only dispatch when **both** `plaintiffLawyerLicense` and `defendantLawyerLicense` are present and valid.
2. **Excludes Self-Represented Cases**: Excluded if either side represented themselves.
3. **Excludes Public Prosecutions**: Excluded if state prosecutors (`PROS-*`) or criminal indictments are involved.

### Webhook Endpoints & Payload Contracts:

#### 1. Concluded Court Cases Webhook
* **URL**: `http://<LEX_RATING_HOST>:5000/api/integrations/court/cases`
* **Method**: `POST`
* **Header**: `x-api-key: <SHARED_INTEGRATION_API_KEY>`
* **Payload**:
```json
{
  "caseId": "CASE-1787215964172",
  "caseTitle": "Awash International Bank vs. Blue Nile Holdings (Commercial Bond Default)",
  "caseType": "Corporate",
  "dateDecided": "2026-08-20",
  "judgeId": "JUDGE-002",
  "judgeName": "Hon. Judge Bekele Seyoum",
  "courtLevel": "Federal Supreme Court",
  "plaintiffClientId": "0911998877",
  "plaintiffClientName": "Awash International Bank S.C.",
  "plaintiffLawyerLicense": "LAW-1001",
  "plaintiffLawyerName": "Kebede Haile Mariam",
  "judgeRatingPlaintiff": 4.9,
  "clientRatingPlaintiff": 4.7,
  "defendantClientId": "0922887766",
  "defendantClientName": "Blue Nile Holdings PLC",
  "defendantLawyerLicense": "LAW-1002",
  "defendantLawyerName": "Tigist Alemu Bekele",
  "judgeRatingDefendant": 3.8,
  "clientRatingDefendant": null,
  "verdict": "Plaintiff"
}
```

#### 2. MoJ Verified Advocate License Webhook
* **URL**: `http://<LEX_RATING_HOST>:5000/api/integrations/moj/licenses`
* **Method**: `POST`
* **Header**: `x-api-key: <SHARED_INTEGRATION_API_KEY>`
* **Payload**:
```json
{
  "licenseNumber": "LAW-1001",
  "fullName": "Kebede Haile Mariam",
  "status": "Active",
  "tier": "Federal Supreme Court & Cassation Bench",
  "issuedDate": "2015-04-10",
  "expiryDate": "2030-04-10",
  "specialization": "Criminal",
  "region": "Federal"
}
```

#### 3. Security & Retry Policy:
* Retries up to **3 attempts with exponential backoff** (1s, 2s, 4s) on network timeouts or 5xx responses.
* Delivery logs audited in `models/WebhookLog.js` and `db/webhook_logs.json`.
* Includes Bulk Sync API endpoints (`POST /api/webhooks/sync-cases` and `POST /api/webhooks/sync-licenses`).

---

## ?? Project Structure

```
crt/
+-- .env                       # Environment configuration (MongoDB URI, LEX-RATING webhook settings)
+-- .env.example               # Example template
+-- server.js                  # Main Express application & REST API
+-- db.js                      # Mongoose connection manager & auto-reconnect
+-- package.json               # Dependencies (express, mongoose, dotenv, multer, uuid)
+-- models/                    # Mongoose Schemas
¦   +-- Case.js                # Full case docket schema
¦   +-- Lawyer.js              # Advocate profile & caseload schema
¦   +-- Judge.js               # Judge schema
¦   +-- Staff.js               # Admin, Officer, Clerk, Prosecutor schema
¦   +-- VerifiedLicense.js     # MoJ Federal Bar registry schema
¦   +-- WebhookLog.js          # Outbound webhook delivery logs schema
¦   +-- Notification.js        # Notification alerts schema
¦   +-- SmsLog.js              # SMS dispatch logs schema
+-- services/                  # Business Logic & Integration Services
¦   +-- dbService.js           # Unified async MongoDB / JSON data access layer
¦   +-- webhookDispatcher.js   # LEX-RATING webhook dispatcher & retry engine
+-- scripts/
¦   +-- migrate.js             # One-click data migration tool (JSON -> MongoDB)
+-- public/                    # Frontend Client Application
¦   +-- index.html             # Institutional landing page & auth portal
¦   +-- dashboard.html         # Unified multi-role judicial workspace
¦   +-- file-case.html         # Public electronic filing portal
¦   +-- css/                   # Stylesheets & judicial design system
¦   +-- js/                    # Client-side routing & app logic
+-- db/                        # Persistent JSON records (mirror/fallback)
+-- uploads/                   # Uploaded evidentiary PDF documents
```

---

## ??? Installation & Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [MongoDB](https://www.mongodb.com/) (Local service or free MongoDB Atlas Cloud Cluster)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Open or create `.env`:
```env
PORT=5001

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/efcourt?retryWrites=true&w=majority

# LEX-RATING Webhook Integration
LEX_RATING_HOST=127.0.0.1
LEX_RATING_PORT=5000
LEX_RATING_API_KEY=court_moj_lex_secret_api_key_2026
```

### 4. Seed Database / Run Data Migration
```bash
node scripts/migrate.js
```

### 5. Start the Server
```bash
npm start
# Server will run on: http://localhost:5001
```

---

## ?? Test Accounts & Demo Credentials

| Role | Username / Identifier | Password / PIN | Description |
| :--- | :--- | :--- | :--- |
| **Court Admin** | `admin` | `admin123` | System Administrator Portal |
| **Judge** | `judge.solomon` | `judge123` | Presiding Judge Solomon Desta |
| **Official (Supreme)** | `officer.hassan` | `officer123` | Screening Officer (Supreme Complex) |
| **Official (Lideta)** | `officer.selam` | `officer123` | Screening Officer (Lideta Division) |
| **Official (Arada)** | `officer.yonas` | `officer123` | Screening Officer (Arada Division) |
| **Filing Clerk** | `clerk.ibrahim` | `clerk123` | Court Registrar Clerk |
| **Prosecutor** | `prosecutor.bereket` | `prosecutor123` | Senior Public Prosecutor Bereket Hailu |
| **Advocate (LAW-1001)** | `qalalew` | `1234` | Advocate Kebede Haile Mariam |
| **Advocate (LAW-1002)** | `lawyer.tigist` | `tigistPass123`| Advocate Tigist Alemu Bekele |
| **Plaintiff (Client)** | `0955282973` | `123456` | Active Plaintiff Client Portal |
| **Defendant (Client)** | `0922334455` | `123456` | Active Defendant Client Portal |

---

## ?? API Endpoint Reference

### ?? Authentication & Advocate Registration
* `POST /api/auth/login` — Multi-role authentication (staff, judges, advocates, litigants).
* `POST /api/auth/register-lawyer` — Register advocate verified against MoJ Bar Registry.
* `GET /api/licenses/verify/:licenseNumber` — Live MoJ license verification lookup.
* `GET /api/licenses` — Search & list verified advocate licenses.

### ?? Case Management & Verdicts
* `GET /api/cases` — List cases (filterable by branch, status, advocate, litigant).
* `GET /api/cases/:id` — Retrieve detailed case docket.
* `POST /api/cases/file` — File new court case (supports multipart PDF uploads).
* `POST /api/cases/:id/appoint-lawyer` — Appoint licensed advocate to plaintiff or defense.
* `POST /api/cases/:id/verdict` — Issue judicial decree, winner/loser determination & ratings.
* `POST /api/cases/:id/rate-lawyer` — Litigant post-judgment advocate star rating & review.
* `POST /api/cases/:id/appeal` — Lodge statutory appeal during 5-minute grace window.

### ?? LEX-RATING Webhooks & Sync
* `POST /api/webhooks/sync-cases` — Bulk sync concluded 2-advocate cases to LEX-RATING.
* `POST /api/webhooks/sync-licenses` — Bulk sync verified MoJ licenses to LEX-RATING.
* `GET /api/webhooks/logs` — Inspect outbound webhook delivery logs.
* `GET /api/webhooks/config` — Inspect active webhook target URLs and security status.

### ?? System Health & Database
* `GET /api/system/db-status` — Real-time MongoDB connection status and database engine.
* `GET /api/system/stats` — High-level judicial dashboard statistics.

---

<div align="center">
  <b>Federal Democratic Republic of Ethiopia Judiciary · Ministry of Justice Integration</b><br>
  <i>Empowering Justice Through Transparent & Modern Judicial Technology</i>
</div>
