#!/usr/bin/env node

/**
 * API Endpoint Validation Script
 * 
 * This script validates that all API endpoints in the codebase
 * use the correct /v1 prefix and match the backend implementation.
 * 
 * Usage: node scripts/validate-api-endpoints.js
 */

const fs = require('fs');
const path = require('path');

// Expected endpoint patterns
const VALID_PATTERNS = [
  /\/v1\/jobs/,
  /\/v1\/me/,
  /\/v1\/cache/,
  /\/v1\/ws/,
  /\/healthz/,
  /\/metrics/,
  /\/monitoring\//,
];

// Invalid patterns (endpoints that should have been updated)
const INVALID_PATTERNS = [
  { pattern: /["'`]\/jobs(?!\/demo)["'`]/, message: 'Found /jobs without /v1 prefix' },
  { pattern: /["'`]\/me(?!\/v1)["'`]/, message: 'Found /me without /v1 prefix' },
];

const errors = [];
const warnings = [];

/**
 * Search for API endpoints in a file
 */
function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for invalid patterns
    INVALID_PATTERNS.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        errors.push({
          file: filePath,
          line: index + 1,
          message,
          code: line.trim(),
        });
      }
    });

    // Look for fetch calls
    if (line.includes('fetch(') && !line.includes('//')) {
      // Extract URL
      const urlMatch = line.match(/fetch\([`'"](.*?)[`'"]/);
      if (urlMatch) {
        const url = urlMatch[1];
        
        // Check if it's an API call
        if (url.startsWith('/') && !url.startsWith('/_next')) {
          // Validate against known patterns
          const isValid = VALID_PATTERNS.some(pattern => pattern.test(url));
          
          if (!isValid) {
            warnings.push({
              file: filePath,
              line: index + 1,
              message: `Potential unversioned endpoint: ${url}`,
              code: line.trim(),
            });
          }
        }
      }
    }
  });
}

/**
 * Recursively search directory
 */
function searchDirectory(dir, extensions = ['.ts', '.tsx', '.js']) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules and .next
    if (file === 'node_modules' || file === '.next' || file === '.git') {
      return;
    }

    if (stat.isDirectory()) {
      searchDirectory(filePath, extensions);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      searchFile(filePath);
    }
  });
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Validating API endpoints...\n');

  const frontendDir = path.join(__dirname, '..', 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ Frontend directory not found');
    process.exit(1);
  }

  searchDirectory(frontendDir);

  // Report errors
  if (errors.length > 0) {
    console.log('❌ ERRORS FOUND:\n');
    errors.forEach(({ file, line, message, code }) => {
      console.log(`  ${file}:${line}`);
      console.log(`  ${message}`);
      console.log(`  ${code}\n`);
    });
  }

  // Report warnings
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(({ file, line, message, code }) => {
      console.log(`  ${file}:${line}`);
      console.log(`  ${message}`);
      console.log(`  ${code}\n`);
    });
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length === 0) {
    console.log('\n✅ All API endpoints are correctly versioned!');
    process.exit(0);
  } else {
    console.log('\n❌ Please fix the errors above');
    process.exit(1);
  }
}

main();
