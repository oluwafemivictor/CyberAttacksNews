#!/usr/bin/env node

/**
 * Validation script - verifies project structure is correct
 * Run: node validate.js
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  // Configuration
  'package.json',
  'tsconfig.json',
  'jest.config.js',
  '.eslintrc.json',
  '.gitignore',
  '.env.example',
  
  // Entry points
  'src/index.ts',
  'src/indexV2.ts',
  'src/cli.ts',
  'src/demo.ts',
  
  // Models
  'src/models/incident.ts',
  
  // Services
  'src/services/IncidentService.ts',
  'src/services/IncidentServiceV2.ts',
  'src/services/AlertService.ts',
  'src/services/DeduplicationService.ts',
  
  // Database
  'src/database/IDatabase.ts',
  'src/database/InMemoryDatabase.ts',
  
  // Utilities
  'src/config/ConfigLoader.ts',
  'src/validators/IncidentValidator.ts',
  'src/utils/Logger.ts',
  'src/middleware/ErrorHandler.ts',
  'src/api/swagger.ts',
  
  // Integrations & Examples
  'src/handlers/incidentHandler.ts',
  'src/integrations/RSSFeedParser.ts',
  'src/examples/WorkflowExample.ts',
  
  // Tests
  'tests/unit/IncidentService.test.ts',
  'tests/unit/DeduplicationService.test.ts',
  'tests/integration/workflows.test.ts',
  
  // Docker
  'Dockerfile',
  'docker-compose.yml',
  
  // Documentation
  '.github/copilot-instructions.md',
  'README.md',
  'README_NEW.md',
  'README_START_HERE.md',
  'SETUP.md',
  'ARCHITECTURE.md',
  'MANIFEST.md',
  'QUICKSTART.md',
  'COMPLETE.md',
  'PROJECT_SUMMARY.md',
  
  // Setup
  'setup.sh',
  'setup.bat'
];

const baseDir = process.cwd();
let passed = 0;
let failed = 0;
const missing = [];
const found = [];

console.log('\n📋 CyberAttacksNews Project Validation\n');
console.log('=' .repeat(50) + '\n');

for (const file of REQUIRED_FILES) {
  const filePath = path.join(baseDir, file);
  
  if (fs.existsSync(filePath)) {
    found.push(file);
    passed++;
    console.log(`✓ ${file}`);
  } else {
    missing.push(file);
    failed++;
    console.log(`✗ ${file}`);
  }
}

console.log('\n' + '='.repeat(50) + '\n');

console.log(`Summary:\n`);
console.log(`  ✓ Found: ${passed}/${REQUIRED_FILES.length}`);
console.log(`  ✗ Missing: ${failed}/${REQUIRED_FILES.length}`);
console.log('');

if (failed === 0) {
  console.log('✅ All required files present!\n');
  console.log('Project is ready to use.\n');
  console.log('Next steps:');
  console.log('  1. npm install');
  console.log('  2. npm run test');
  console.log('  3. npm run dev\n');
  process.exit(0);
} else {
  console.log('❌ Missing files detected:\n');
  missing.forEach(file => console.log(`  - ${file}`));
  console.log('');
  process.exit(1);
}
