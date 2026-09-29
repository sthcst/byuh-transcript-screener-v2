/**
 * Personally Identifiable Information (PII) Removal Utility
 *
 * Implements FERPA data minimization requirements by removing student identifiers
 * while preserving academic information needed for evaluation.
 *
 * REMOVED (PII): Student name, ID, address, birth date, email, phone
 * RETAINED (Safe): School name, country, courses, grades, credits, GPA scale
 *
 * Complies with institutional CES review requirements for de-identified transcript processing.
 */

// Regex patterns to identify and remove PII fields
export const PII_PATTERNS = {
  // Student identifiers
  studentName: /^(student\s*)?name$|^alumnus$|^applicant\s*name$/i,
  givenName: /^given\s*name$|^first\s*name$/i,
  surname: /^surname$|^last\s*name$|^family\s*name$/i,

  // Student ID types
  studentId: /^student\s*(?:id|number|no\.?)$|^sid$|^id\s*(?:no\.?|number)$/i,
  registrationNumber: /^registration\s*(?:no\.?|number)|^reg\.?\s*no\.?$/i,
  learnerNumber: /^learner\s*(?:no\.?|number)$/i,

  // Contact information
  email: /^(?:email|e-mail|contact\s*email)$/i,
  phone: /^(?:phone|tel|telephone|mobile|cell|contact\s*(?:phone|number))$/i,
  address: /^(?:address|street|city|state|zip|postal|province|country_address)$/i,

  // Personal identifiers
  dateOfBirth: /^(?:date\s*of\s*birth|birth\s*date|dob|born|age)$/i,
  birthPlace: /^(?:place\s*of\s*birth|birth\s*place)$/i,
  citizenship: /^(?:citizenship|nationality)$/i,
  passport: /^passport(?:\s*number)?$/i,

  // Parent/Guardian info (FERPA concern)
  parentName: /^parent|guardian|father|mother$/i,

  // Enrollment dates that could reveal age
  dateEnrolled: /^(?:date\s*enrolled|enrollment\s*date|enrolled_date)$/i,
  dateGraduated: /^(?:date\s*graduated|graduation\s*date|graduated_date)$/i,
};

/**
 * Determines if a field key matches any PII pattern
 */
function isPIIField(fieldKey) {
  const keyLower = fieldKey.toLowerCase();

  for (const pattern of Object.values(PII_PATTERNS)) {
    if (pattern.test(keyLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Removes PII from any JavaScript object
 * Recursively processes nested objects and arrays
 */
export function filterPII(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    // Process array elements
    return data
      .map(item => filterPII(item))
      .filter(item => item !== null && item !== undefined);
  }

  if (typeof data === 'object') {
    const filtered = {};

    Object.entries(data).forEach(([key, value]) => {
      // Skip PII fields entirely
      if (isPIIField(key)) {
        return;
      }

      // Recursively filter nested objects/arrays
      if (typeof value === 'object' && value !== null) {
        filtered[key] = filterPII(value);
      } else if (typeof value !== 'string' || value.trim() !== '') {
        // Keep non-PII fields
        filtered[key] = value;
      }
    });

    return filtered;
  }

  // Primitive values pass through
  return data;
}

/**
 * Extracts ONLY academic information from OCR'd transcript
 * This is what gets sent to the AI API - highly sanitized
 */
export function extractAcademicInfo(ocrData) {
  if (!ocrData) return null;

  const academic = {
    // Institution information (safe - public)
    schoolName: ocrData.institution || ocrData.school || ocrData.schoolName,
    country: ocrData.country,

    // Credential information (safe - public)
    credentialType: ocrData.credentialType, // Diploma, Bachelor's, Certificate, etc.
    degreeLevel: ocrData.degreeLevel, // Undergraduate, Graduate, Doctoral

    // Academic records (safe - grades and performance, no student ID)
    coursework: (ocrData.courses || []).map(course => ({
      code: course.code || course.courseCode,
      title: course.title || course.courseName,
      grade: course.grade || course.marks,
      gradeValue: course.gradeValue || course.numericGrade,
      credits: course.credits || course.units || course.hours,
      unit: course.unit || course.creditType,
      status: course.status // Completed, In Progress, etc. (not Pass/Fail which could identify)
    })).filter(c => c.code || c.title), // Only include if we have some info

    // Grading scale explanation (safe - public info)
    gradesExplanation: ocrData.gradesExplanation,
    gradingScale: ocrData.gradingScale,

    // Overall performance (safe - aggregate, no name)
    cumulativeGpa: ocrData.cumulativeGpa || ocrData.overallGPA,
    gradesGPA_SCALE: ocrData.GPA_SCALE || '4.0', // The scale (4.0, 5.0, 100, etc.)

    // Attendance period (safe - no birth date, just date range)
    enrollmentPeriod: ocrData.enrollmentPeriod || {
      startDate: ocrData.startDate,
      endDate: ocrData.endDate
    },

    // Program info (safe - public)
    programName: ocrData.programName || ocrData.program,
    major: ocrData.major || ocrData.specialization,

    // Additional academic context (safe - evaluative, not identifying)
    honors: ocrData.honors || ocrData.recognitions,
    notes: ocrData.academicNotes, // Not personal notes, academic standing notes
  };

  // Remove empty fields to keep payload small
  return Object.fromEntries(
    Object.entries(academic).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
}

/**
 * Validates that data is safe to send to external API
 * Returns true if no PII detected
 */
export function validateNoPII(data) {
  const stringified = JSON.stringify(data);

  // List of PII patterns that should never appear
  const dangerousPatterns = [
    /\b[a-z][a-z]+\s+[A-Z][a-z]+\b/, // Name pattern: "John Smith"
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // Another name pattern
    /^\d{3}-\d{2}-\d{4}$/, // SSN pattern
    /^[0-9]{8,10}$/, // ID number pattern
    /\b(?:1[89]\d{2}|20\d{2})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/, // Birth date pattern YYYY-MM-DD
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(stringified)) {
      console.warn('Potential PII detected in data:', pattern);
      return false;
    }
  }

  return true;
}

/**
 * Creates audit-safe summary for logging
 * References data without exposing PII
 */
export function createAuditSummary(ocrData) {
  return {
    school: ocrData.schoolName || ocrData.school || 'Unknown',
    country: ocrData.country || 'Unknown',
    courseCount: (ocrData.courses || []).length,
    credentialType: ocrData.credentialType || 'Unknown',
    timestamp: new Date().toISOString(),
    // NEVER include: student name, ID, email, address, DOB
  };
}
