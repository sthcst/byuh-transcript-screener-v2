# BYUH Global Transcript Screener

A secure, FERPA-compliant system for processing international student transcripts with AI-assisted analysis. The system processes transcripts locally, removes all personally identifiable information (PII), and sends only academic data to external APIs for analysis.

## Key Features

- **Local Data Processing**: All PDF extraction and PII filtering happens locally on institutional hardware
- **FERPA Compliant**: Data minimization approach—only academic data leaves the institution
- **AI-Assisted Analysis**: ChatGPT API integration for transcript interpretation and grading scale normalization
- **Staff Decision Authority**: AI provides recommendations only; admissions staff make all final decisions
- **Complete Audit Trail**: 7-year retention policy for compliance
- **Secure**: AES-256 encryption at rest, TLS 1.3 in transit

## Current Status

**Phase 2 Complete**: Infrastructure built and tested
- ✅ PII filtering (tested on real DepED transcripts)
- ✅ Multi-page PDF extraction with OCR fallback
- ✅ Audit logging framework

**Phase 3-4 Roadmap**: Ready for implementation upon institutional approval

## Architecture Overview

```
Staff Upload PDF
       ↓
Local PDF Extraction (pdftotext + Tesseract OCR)
       ↓
PII Removal (strip name, ID, DOB, etc.)
       ↓
Academic Data Extraction (preserve courses, grades, GPA)
       ↓
ChatGPT API Analysis (de-identified data only)
       ↓
Staff Decision & Logging
       ↓
7-Year Audit Trail Storage
```

## Repository Structure

```
src/
├── utils/
│   ├── piiFilter.js              # PII removal logic
│   ├── multiPagePdfExtractor.js   # PDF extraction with OCR
│   ├── transcriptParser.js        # Parse extracted text (Phase 3)
│   └── auditLogger.js             # Audit logging (Phase 3)
├── services/
│   ├── openaiService.js           # ChatGPT API (Phase 3)
│   ├── authService.js             # JWT auth (Phase 4)
│   └── encryptionService.js       # AES-256 encryption (Phase 4)
├── components/
│   ├── TranscriptUpload.jsx       # Staff upload UI (Phase 4)
│   ├── ResultsDisplay.jsx         # Display extracted data (Phase 4)
│   ├── AIAnalysisPanel.jsx        # ChatGPT analysis (Phase 4)
│   ├── DecisionForm.jsx           # Decision logging (Phase 4)
│   └── GradeEquivalentTable.jsx   # Excel export (Phase 4)
├── hooks/
│   ├── useTranscriptUpload.js     # Upload handling (Phase 4)
│   ├── usePiiFilter.js            # PII filtering (Phase 4)
│   └── useAuditLog.js             # Audit logging (Phase 4)
├── config/
│   ├── apiConfig.js               # API endpoints (Phase 3)
│   └── authConfig.js              # JWT/RBAC (Phase 4)
└── App.jsx                        # Main React app

tests/
├── unit/                          # Unit tests
├── integration/                   # Full pipeline tests
└── fixtures/                      # Test data

docs/
├── REPO_STRUCTURE_AND_ROADMAP.md  # Phases 3-4 roadmap
├── ARCHITECTURE.md                # System design
├── SETUP.md                       # Installation guide
├── API_INTEGRATION.md             # ChatGPT integration
└── COMPLIANCE.md                  # FERPA compliance details
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API access (for Phase 3+)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd byuh-transcript-screener-v2
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Test core utilities:
```bash
# Test PII filtering
node -e "import('./src/utils/piiFilter.js').then(m => console.log(m))"

# Test PDF extraction
node src/utils/multiPagePdfExtractor.js /path/to/transcript.pdf
```

## Implementation Timeline

### Phase 3: OpenAI API Integration (2-3 weeks)
- API setup and testing
- Backend optimization (move OCR to server)
- Audit logging implementation
- Data encryption setup

### Phase 4: UI & Production Deployment (3-4 weeks)
- React UI components
- Authentication & RBAC
- Complete testing suite
- Production deployment
- Staff training

See `docs/REPO_STRUCTURE_AND_ROADMAP.md` for detailed Phase 3-4 roadmap.

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- piiFilter.test.js

# Watch mode
npm test -- --watch
```

## Compliance Notes

- **FERPA**: Data minimization—student identifiers removed before external API calls
- **Audit Trail**: All access logged with timestamp, staff member, action, and decision
- **Data Retention**: 7-year retention policy for institutional records
- **Encryption**: AES-256 at rest, TLS 1.3 in transit

See `docs/COMPLIANCE.md` for detailed compliance strategy.

## Next Steps

1. ✅ Architecture approved by Ryan Carter's team
2. ⏳ API agreement review (David Te'o)
3. ⏳ Privacy/FERPA analysis (Darryl Kimak)
4. ⏳ Phase 3 implementation upon approval
5. ⏳ Phase 4 implementation and staff training

## Support

For questions or issues:
- See `docs/` for detailed documentation
- Check `REPO_STRUCTURE_AND_ROADMAP.md` for implementation guidance
- Contact: Seth Acosta, Admissions Technology

## License

[Add appropriate license - MIT recommended for internal use]
