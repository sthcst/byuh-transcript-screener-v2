#!/usr/bin/env node

/**
 * Multi-page PDF text extraction helper
 * Handles both text-based and image-based PDFs
 * Intelligently combines pages while preserving structure
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import Tesseract from 'tesseract.js';
import PDFParse from 'pdf-parse';

const execAsync = promisify(exec);

/**
 * Extract text from a single page using pdftotext
 * Returns empty string if page has no text (image-based)
 */
async function extractPageWithPdftotext(pdfPath, pageNum) {
  try {
    const { stdout } = await execAsync(
      `pdftotext -f ${pageNum} -l ${pageNum} "${pdfPath}" -`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    return stdout.trim();
  } catch (error) {
    return ''; // Page has no text, will need OCR
  }
}

/**
 * Extract text from a PDF page image using Tesseract OCR
 * Used as fallback when pdftotext returns empty
 */
async function extractPageWithOCR(pdfPath, pageNum) {
  try {
    // Convert PDF page to image, then OCR
    // This is a simplified version - in production you'd use pdf2image library
    const { stdout } = await execAsync(
      `pdftoppm -jpeg -r 150 -f ${pageNum} -l ${pageNum} "${pdfPath}" /tmp/page`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const imagePath = `/tmp/page-${String(pageNum).padStart(6, '0')}.jpg`;

    if (fs.existsSync(imagePath)) {
      const result = await Tesseract.recognize(imagePath, 'eng');
      fs.unlinkSync(imagePath); // Clean up temp file
      return result.data.text.trim();
    }

    return '';
  } catch (error) {
    console.warn(`OCR failed for page ${pageNum}:`, error.message);
    return '';
  }
}

/**
 * Identify which section a page belongs to
 * (student info, coursework, summary)
 */
function identifyPageSection(pageText, pageNum, totalPages) {
  const lowerText = pageText.toLowerCase();

  // First page usually has student info
  if (pageNum === 1) {
    return 'studentInfo';
  }

  // Last page often has summary/GPA
  if (pageNum === totalPages) {
    return 'summary';
  }

  // Middle pages likely have coursework
  if (
    lowerText.includes('course') ||
    lowerText.includes('grade') ||
    lowerText.includes('subject') ||
    lowerText.includes('units') ||
    lowerText.includes('credits')
  ) {
    return 'coursework';
  }

  // Default to coursework for middle pages
  return 'coursework';
}

/**
 * Main function: Extract all pages from PDF and combine intelligently
 */
async function extractMultiPagePDF(pdfPath) {
  console.log(`📄 Extracting multi-page PDF: ${pdfPath}`);

  try {
    // Get total page count
    const fileBuffer = fs.readFileSync(pdfPath);
    const pdfData = await PDFParse(fileBuffer);
    const totalPages = pdfData.numpages;

    console.log(`   Total pages: ${totalPages}`);

    const pages = {
      studentInfo: [],
      coursework: [],
      summary: [],
      allPages: []
    };

    // Extract each page
    for (let i = 1; i <= totalPages; i++) {
      process.stdout.write(`   Extracting page ${i}/${totalPages}...`);

      // Try pdftotext first (fast, for text-based PDFs)
      let pageText = await extractPageWithPdftotext(pdfPath, i);

      // If empty, use OCR (slower, for image-based PDFs)
      if (!pageText || pageText.length < 50) {
        console.log(' (no text, using OCR)');
        pageText = await extractPageWithOCR(pdfPath, i);
      } else {
        console.log(' ✓');
      }

      if (pageText) {
        const section = identifyPageSection(pageText, i, totalPages);
        pages[section].push({
          pageNum: i,
          text: pageText,
          section: section
        });
        pages.allPages.push(pageText);
      }
    }

    // Combine pages intelligently
    const result = {
      totalPages: totalPages,
      studentInfo: pages.studentInfo.map(p => p.text).join('\n'),
      coursework: pages.coursework.map(p => p.text).join('\n'),
      summary: pages.summary.map(p => p.text).join('\n'),
      fullText: pages.allPages.join('\n'),
      extractionMethod: 'mixed', // pdftotext + OCR
      pageBreakdown: {
        studentInfoPages: pages.studentInfo.length,
        courseworkPages: pages.coursework.length,
        summaryPages: pages.summary.length
      }
    };

    console.log(`✅ Extraction complete`);
    console.log(`   Student Info: ${pages.studentInfo.length} page(s)`);
    console.log(`   Coursework: ${pages.coursework.length} page(s)`);
    console.log(`   Summary: ${pages.summary.length} page(s)`);
    console.log(`   Full text: ${result.fullText.length} characters`);

    return result;

  } catch (error) {
    console.error('❌ Multi-page extraction failed:', error.message);
    throw error;
  }
}

// Export for use in other modules
export { extractMultiPagePDF, extractPageWithPdftotext, extractPageWithOCR, identifyPageSection };

// Allow running directly from CLI for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.log('Usage: node multiPagePdfExtractor.js <path-to-pdf>');
    process.exit(1);
  }

  extractMultiPagePDF(pdfPath)
    .then(result => {
      console.log('\n═══════════════════════════════════════');
      console.log('EXTRACTION RESULT');
      console.log('═══════════════════════════════════════\n');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
