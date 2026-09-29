# BYUH Global Transcript Screener - Architecture

**Version**: 1.0  
**Date**: September 2026  
**Status**: Ready for Phase 3 Implementation

## Executive Summary

The BYUH Global Transcript Screener is a secure, FERPA-compliant system for processing international student transcripts with AI-assisted analysis. The system processes transcripts locally on institutional hardware, removes all personally identifiable information (PII), and sends only academic data to external APIs for analysis. All admission decisions remain with institutional staff.

## System Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      STAFF INTERFACE                             │
│                   (React Web Application)                        │
└──────────┬────────────────────────────────────────────────────┬──┘
           │                                                    │
           ▼ PDF Upload                                         ▼ View Results
    ┌──────────────────┐
    │ LOCAL PROCESSING │  ◄─ All data stays on institution hardware
    │  (No external    │
    │   API calls yet) │
    └────────┬─────────┘
             │
             ├─► PDF Extraction
             │   • pdftotext (text-based PDFs)
             │   • Tesseract OCR (scanned images)
             │
             ├─► PII Removal
             │   • Remove: name, ID, DOB, address, email, phone
             │   • Preserve: courses, grades, GPA, school, country
             │
             └─► Academic Data Extraction
                 • Structured data: courses, grades, units
                 • Grading scale information
                 • Credential type & summary data
                 │
                 ▼
    ┌──────────────────────────────┐
    │ STAFF REVIEW (DE-IDENTIFIED) │
    │ - View extracted data        │
    │ - Verify accuracy            │
    │ - Make preliminary decision  │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │  EXTERNAL API (Phase 3)       │
    │  - ChatGPT API               │
    │  - NO PII sent               │
    │  - Academic data only        │
    └────────┬─────────────────────┘
             │
             ├─► AI Analysis
             │   • Grading scale interpretation
             │   • Credential equivalency
             │   • Transfer credit recommendations
             │
             ▼
    ┌──────────────────────────────┐
    │   STAFF DECISION LOGGING      │
    │   - Review AI recommendations│
    │   - Make final decision       │
    │   - Log decision with reason  │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────────────┐
    │  AUDIT TRAIL (7-Year Storage)│
    │  - All access logged         │
    │  - Encrypted storage         │
    │  - Compliance ready          │
    └──────────────────────────────┘
```

## Core Components

### 1. Utilities (src/utils/)

#### piiFilter.js
**Purpose**: Remove personally identifiable information from transcripts

**PII Removed**:
- Student name
- Student ID (LRN)
- Date of birth
- Address
- Email & phone
- Citizenship & passport
- Parent/guardian information
- Enrollment dates

**Academic Data Preserved**:
- School name & country
- Courses (code, title, grade)
- GPA & grading scale
- Credits/units
- Credential type
- Academic standing notes

**Testing**: Tested on real DepED SF10-SHS transcripts

#### multiPagePdfExtractor.js
**Purpose**: Extract text from multi-page PDFs with intelligent OCR fallback

**Capabilities**:
- Dual extraction method:
  - `pdftotext`: Fast extraction for text-based PDFs
  - `Tesseract OCR`: Fallback for scanned/image-based PDFs
- Intelligent page categorization:
  - Student info (page 1)
  - Coursework (middle pages)
  - Summary/GPA (last page)
- Returns structured data:
  - Separate studentInfo, coursework, summary sections
  - Full text for reference
  - Page breakdown and extraction method used

**Input**: PDF file path  
**Output**: Structured object with extracted text by section

#### transcriptParser.js (Phase 3)
**Purpose**: Parse extracted text into structured academic data

**Responsibilities**:
- Identify courses from free-text descriptions
- Extract grades and convert to numeric/letter scale
- Calculate or verify GPA
- Identify credential type and institution
- Validate data completeness

#### auditLogger.js (Phase 3)
**Purpose**: Log all system access and decisions for FERPA compliance

**Logging**:
- Timestamp, staff member, transcript processed
- Action taken (upload, review, analyze, decide)
- AI response (anonymized)
- User interactions and decisions
- Storage: 7-year retention in encrypted format

### 2. Services (src/services/)

#### openaiService.js (Phase 3)
**Purpose**: ChatGPT API integration with safety guardrails

**Functions**:
- Rate limiting to prevent accidental overages
- Cost tracking and reporting
- Error handling & retry logic
- Timeout management
- De-identification verification before sending

**API Contract**: Sends only academic data (no PII)

#### authService.js (Phase 4)
**Purpose**: JWT-based authentication and session management

**Responsibilities**:
- User login/logout
- Token generation and validation
- Session management
- Password hashing (bcrypt)

#### encryptionService.js (Phase 4)
**Purpose**: AES-256 encryption for data at rest

**Responsibilities**:
- Encrypt sensitive data before storage
- Decrypt on retrieval
- Key management and rotation
- Encryption key derivation from master key

### 3. React Components (src/components/) - Phase 4

#### TranscriptUpload.jsx
- File picker (PDF only)
- Progress indicator
- Error messaging
- Drag-and-drop support

#### ResultsDisplay.jsx
- Show extracted de-identified data
- OCR confidence scores
- Side-by-side comparison (original vs extracted)
- Edit/correction interface
- Data validation warnings

#### AIAnalysisPanel.jsx
- Display ChatGPT recommendations
- Grading scale interpretation
- Credential equivalency
- Transfer credit suggestions
- Confidence/reasoning display

#### DecisionForm.jsx
- Staff decision options (Approve/Review/Reject)
- Free-text notes field
- Audit log entry creation
- Decision timestamp recording

#### GradeEquivalentTable.jsx
- Table of original grades → BYUH equivalents
- Excel export functionality
- Print capability
- Sort and filter controls

### 4. Hooks (src/hooks/) - Phase 4

- `useTranscriptUpload`: Handle file upload and processing
- `usePiiFilter`: Trigger PII filtering with progress tracking
- `useAuditLog`: Log all actions and decisions

## Security & Compliance

### FERPA Compliance
- **Data Minimization**: Student identifiers removed before external API calls
- **Institutional Control**: All decisions made by staff, not AI
- **Audit Trail**: Complete logging of access and decisions
- **7-Year Retention**: Local encrypted storage meets retention requirements

### Encryption
- **At Rest**: AES-256 encryption for stored data
- **In Transit**: TLS 1.3 for all external API calls
- **Key Management**: Secure key storage and rotation

### Access Control (Phase 4)
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**:
  - Admin: Full access to system
  - Admissions Officer: Can review and make decisions
  - Supervisor: Can view audit logs
- **Session Management**: Auto-logout after inactivity

## Data Flow - Detailed

1. **Transcript Input**
   - Staff uploads scanned PDF from student file
   - File stored temporarily on institutional hardware

2. **Local Extraction**
   - PDF text extracted via pdftotext (no external call)
   - If no text (scanned image), Tesseract OCR used
   - Entire transcript text retained temporarily

3. **PII Removal**
   - piiFilter.js removes student identifiers
   - Academic data extraction validates preservation
   - De-identified data ready for next stage

4. **Staff Review**
   - Admissions officer views de-identified data
   - Can correct/edit extracted information
   - Confirms data accuracy before AI analysis

5. **API Call (Phase 3)**
   - De-identified academic data sent to ChatGPT
   - NO student identifiers in API request
   - No transcript stored on OpenAI servers

6. **AI Analysis**
   - ChatGPT interprets grading scale
   - Assesses credential equivalency
   - Provides transfer credit recommendations

7. **Staff Decision**
   - Officer reviews AI analysis
   - Makes final admissions decision
   - Logs decision with rationale and timestamp

8. **Audit Logging**
   - All actions recorded: access, analysis, decision
   - Encrypted storage with 7-year retention
   - Accessible via admin audit dashboard

## Technology Stack

### Frontend
- React 18
- No external UI frameworks initially (can add Material-UI or Chakra in Phase 4)

### Backend
- Node.js with Express
- PDF processing: pdftotext, Tesseract.js, pdf-parse
- Authentication: jsonwebtoken (JWT)
- Encryption: crypto-js (AES-256)

### Database
- Dexie.js (IndexedDB) for local audit trail
- PostgreSQL (optional) for persistent storage in production

### External APIs
- OpenAI ChatGPT (Phase 3)

### Testing
- Jest for unit tests
- Supertest for API integration tests

## Deployment Options

### Phase 4 Production Deployment

**Option 1: Institutional Server (Recommended)**
- Node.js + React on institutional hardware
- Internal network only
- Full institutional control
- Docker containerization available

**Option 2: Electron Desktop App**
- Single-machine installation
- Offline capable
- No network exposure

**Option 3: Cloud Deployment**
- Managed by Anthropic or similar cloud provider
- Less institutional control
- Requires data residency agreements

## Success Criteria (Before Launch)

- [ ] All PII filtering tests pass (100% accuracy on test data)
- [ ] OCR confidence >90% on Philippine transcripts
- [ ] ChatGPT API integration working reliably
- [ ] Audit logs being recorded for every action
- [ ] Staff can complete workflow in <5 minutes per transcript
- [ ] Zero PII leaks in test runs
- [ ] Admissions staff trained and confident
- [ ] Backup/recovery procedures tested
- [ ] 7-year audit retention confirmed working

## Known Limitations & Future Work

### Current Phase 2
- Manual data entry fallback (for unreadable transcripts)
- Single language support (English)
- No OCR performance optimization yet

### Phase 5 (Future)
- Multi-language support
- Scalable to other countries' transcript formats
- Machine learning for credential equivalency
- Advanced analytics dashboard
- Integration with SIS systems

## References

- FERPA Compliance: See `docs/COMPLIANCE.md`
- API Integration: See `docs/API_INTEGRATION.md`
- Setup Guide: See `docs/SETUP.md`
- Implementation Roadmap: See `docs/REPO_STRUCTURE_AND_ROADMAP.md`
