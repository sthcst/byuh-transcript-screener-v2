# BYUH Transcript Screener - Repo Structure & Implementation Roadmap

## Repository Structure (Recommended)

```
byuh-transcript-screener/
│
├── src/
│   ├── utils/
│   │   ├── piiFilter.js                    # PII removal logic
│   │   ├── multiPagePdfExtractor.js        # Multi-page PDF handling
│   │   ├── transcriptParser.js             # Parse extracted text into structured data
│   │   └── auditLogger.js                  # Logging for compliance (7-year retention)
│   │
│   ├── services/
│   │   ├── openaiService.js                # ChatGPT API integration
│   │   ├── authService.js                  # JWT authentication
│   │   └── encryptionService.js            # AES-256 encryption
│   │
│   ├── components/
│   │   ├── TranscriptUpload.jsx            # Staff upload interface
│   │   ├── ResultsDisplay.jsx              # Show extracted data (de-identified)
│   │   ├── AIAnalysisPanel.jsx             # Display ChatGPT analysis
│   │   ├── DecisionForm.jsx                # Staff decision logging
│   │   └── GradeEquivalentTable.jsx        # Excel export component
│   │
│   ├── hooks/
│   │   ├── useTranscriptUpload.js
│   │   ├── usePiiFilter.js
│   │   └── useAuditLog.js
│   │
│   ├── config/
│   │   ├── apiConfig.js                    # OpenAI API endpoints
│   │   └── authConfig.js                   # JWT/RBAC configuration
│   │
│   └── App.jsx                              # Main React app
│
├── tests/
│   ├── unit/
│   │   ├── piiFilter.test.js
│   │   ├── multiPagePdfExtractor.test.js
│   │   └── transcriptParser.test.js
│   │
│   ├── integration/
│   │   ├── fullPipeline.test.js
│   │   └── apiIntegration.test.js
│   │
│   └── fixtures/
│       ├── sampleTranscripts/
│       └── testData.js
│
├── .github/
│   └── workflows/
│       ├── build.yml                       # Cross-platform builds
│       ├── test.yml                        # Automated tests on PR
│       └── deploy.yml                      # Production deployment
│
├── docs/
│   ├── ARCHITECTURE.md                     # Full architecture overview
│   ├── SETUP.md                            # Installation & setup guide
│   ├── API_INTEGRATION.md                  # OpenAI API details
│   └── COMPLIANCE.md                       # FERPA/CES compliance notes
│
├── public/
│   └── index.html
│
├── package.json
├── .env.example                            # Template for env variables
├── .gitignore
├── README.md
└── LICENSE
```

---

## Implementation Roadmap: Phase 3-4

### Phase 3: OpenAI API Integration (2-3 weeks)

#### 3.1 API Setup & Testing
- [ ] Confirm OpenAI API agreement covers transcript data
- [ ] Set up API keys in `.env`
- [ ] Create `services/openaiService.js` with:
  - Rate limiting (protect against accidental overages)
  - Error handling & retry logic
  - Cost tracking
- [ ] Write integration tests with sample data
- [ ] Test with 10-20 real transcripts (de-identified)

#### 3.2 Backend Optimization (if needed)
- [ ] Move OCR to backend service (not browser Tesseract)
  - Option A: Node.js server with Tesseract
  - Option B: Cloud Vision API (Google/AWS)
- [ ] Create API endpoint for transcript processing:
  - POST `/api/transcripts/upload` → returns extracted data
  - POST `/api/transcripts/analyze` → sends to ChatGPT

#### 3.3 Audit Logging System
- [ ] Implement IndexedDB for local audit trail storage
- [ ] Create `services/auditLogger.js` to log:
  - Timestamp, staff member, transcript, action, decision
  - AI response (anonymized)
  - User interactions
- [ ] Set up 7-year retention policy
- [ ] Create admin dashboard to view audit logs

#### 3.4 Data Encryption
- [ ] Implement TLS 1.3 (if not already in place)
- [ ] Set up AES-256 encryption for data at rest
- [ ] Encrypt audit logs before storage
- [ ] Create encryption key management system

---

### Phase 4: UI & Production Deployment (3-4 weeks)

#### 4.1 React UI Components
- [ ] **TranscriptUpload.jsx**
  - File picker (PDF only)
  - Progress indicator
  - Error messages
  
- [ ] **ResultsDisplay.jsx**
  - Show extracted de-identified data
  - Confidence scores from OCR
  - Side-by-side comparison (original vs extracted)
  - Edit/correct extracted data if needed
  
- [ ] **AIAnalysisPanel.jsx**
  - Display ChatGPT response:
    - Grading scale interpretation
    - Credential equivalency
    - Recommendations
  - Show confidence/reasoning
  
- [ ] **DecisionForm.jsx**
  - Staff decision options (Approve / Review / Reject)
  - Free-text notes
  - Save to audit log
  
- [ ] **GradeEquivalentTable.jsx**
  - Table of original grades → BYUH equivalents
  - Export to Excel button
  - Print capability

#### 4.2 Authentication & Access Control
- [ ] Set up JWT authentication
- [ ] Create RBAC system:
  - Admin (full access)
  - Admissions Officer (can review & decide)
  - Supervisor (can view logs)
- [ ] Create login page
- [ ] Session management

#### 4.3 Testing & QA
- [ ] Unit tests for all components (>80% coverage)
- [ ] Integration tests (full pipeline)
- [ ] User acceptance testing with Admissions staff
- [ ] Security audit (encryption, auth, data handling)
- [ ] Load testing (100+ transcripts)

#### 4.4 Deployment
- [ ] Package for production deployment
  - Docker container (optional but recommended)
  - Environment configuration
  - Database setup
- [ ] Deploy to institutional server
- [ ] Set up monitoring/logging
- [ ] Create backup strategy
- [ ] Document disaster recovery

#### 4.5 Staff Training
- [ ] Create user manual
- [ ] Record training video
- [ ] Run training sessions with Admissions team
- [ ] Create FAQ document

---

## File Dependencies

```
piiFilter.js (core, no dependencies)
    ↓
multiPagePdfExtractor.js → transcriptParser.js
    ↓
openaiService.js
    ↓
auditLogger.js (IndexedDB)
    ↓
React Components (all depend on above)
    ↓
App.jsx (main entry point)
```

---

## Key Milestones

| Milestone | Timeline | Owner | Go/No-Go |
|-----------|----------|-------|---------|
| API agreement confirmed | Week 1 | David Te'o | |
| Privacy/FERPA review complete | Week 2 | Darryl Kimak | |
| API integration tested | Week 3 | Seth | |
| Audit logging implemented | Week 2-3 | Seth | |
| React UI complete | Week 2-4 | Seth | |
| Full integration testing | Week 4 | Seth | |
| Staff training materials ready | Week 3 | Maurice | |
| Production deployment ready | Week 4 | Seth | |

---

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

---

## Environment Variables Needed (.env)

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
DATABASE_URL=postgres://...
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-aes-256-key
NODE_ENV=production
LOG_RETENTION_YEARS=7
```

---

## Notes

- All PII filtering happens **locally** before any external API call
- Staff sees de-identified data, makes final decision (not AI)
- Complete audit trail maintained per FERPA requirements
- Scalable to other countries' transcript formats (Phase 5)
