/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  🔬 API DATA-DRIVEN TESTS with JSON Schema Validation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  This module demonstrates Contract Testing using JSON Schema validation.
 *  JSON Schema acts as a "contract" between Frontend and Backend teams.
 *  If the API response structure changes, tests will fail immediately.
 *
 *  Benefits:
 *  - Automated contract validation
 *  - Complete type and structure checking
 *  - Clear error messages for debugging
 *  - Reusable schemas across tests
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

require('dotenv').config({ debug: false });
const { expect } = require('chai');
const axios = require('axios');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
//  📂 LOAD TEST DATA & SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const testDataPath = path.join(__dirname, 'data', 'testData.json');
const schemasPath = path.join(__dirname, 'data', 'schemas.json');

const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
const schemas = JSON.parse(fs.readFileSync(schemasPath, 'utf8'));

// Initialize AJV with formats support (for email validation)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile schemas
const validatePost = ajv.compile(schemas.postSchema);
const validateUser = ajv.compile(schemas.userSchema);

console.log(`\n📂 [Setup]: Loaded ${testData.apiTests.length} API test cases`);
console.log(`📋 [Setup]: Loaded schemas: postSchema, userSchema\n`);

// ═══════════════════════════════════════════════════════════════════════════
//  ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
};

// ═══════════════════════════════════════════════════════════════════════════
//  🧪 API DDT TEST SUITE with Schema Validation
// ═══════════════════════════════════════════════════════════════════════════

describe('🔬 API Contract Testing Suite (Schema Validation)', function () {
  this.timeout(30000);

  // ═══════════════════════════════════════════════════════════════════════
  //  📡 DYNAMIC API TESTS FROM JSON
  // ═══════════════════════════════════════════════════════════════════════

  describe('📡 REST API Integration Layer - DDT', function () {
    testData.apiTests.forEach((testCase) => {
      it(`🔗 [TC-${testCase.id}] ${testCase.method} ${testCase.endpoint} → Status ${testCase.expectedStatus}`, async function () {
        console.log(`\n    ══════════════════════════════════════════`);
        console.log(`    📝 [API Test #${testCase.id}]`);
        console.log(
          `    🔗 [Request]: ${testCase.method} ${CONFIG.apiBaseUrl}${testCase.endpoint}`
        );
        console.log(`    ══════════════════════════════════════════`);

        try {
          const response = await axios({
            method: testCase.method.toLowerCase(),
            url: `${CONFIG.apiBaseUrl}${testCase.endpoint}`,
            timeout: CONFIG.timeout,
            validateStatus: () => true,
          });

          // 1. STATUS CODE ASSERTION
          console.log(`    📊 [Response]: Status ${response.status}`);
          expect(response.status).to.equal(testCase.expectedStatus);
          console.log(`    ✅ [Assertion]: Status code verified!`);

          // 2. SCHEMA VALIDATION (only for successful responses)
          if (testCase.expectedStatus === 200 && testCase.expectedFields.length > 0) {
            const data = response.data;

            let isValid = false;
            let validator = null;

            if (testCase.endpoint.includes('/posts')) {
              validator = validatePost;
              isValid = validatePost(data);
            } else if (testCase.endpoint.includes('/users')) {
              validator = validateUser;
              isValid = validateUser(data);
            }

            if (validator) {
              if (isValid) {
                console.log(`    ✅ [Schema]: Contract validation PASSED!`);
              } else {
                console.log(`    ❌ [Schema]: Contract validation FAILED:`);
                validator.errors.forEach((err) => {
                  console.log(`       - ${err.instancePath || 'root'}: ${err.message}`);
                });
              }
              expect(isValid, `Schema validation failed: ${JSON.stringify(validator.errors)}`).to.be
                .true;
            }

            // 3. FIELD PRESENCE CHECK
            console.log(
              `    📋 [Fields]: Checking required fields: ${testCase.expectedFields.join(', ')}`
            );
            testCase.expectedFields.forEach((field) => {
              expect(data).to.have.property(field);
            });
            console.log(`    ✅ [Fields]: All required fields present!`);
          }
        } catch (error) {
          if (testCase.expectedStatus === 404 && error.response?.status === 404) {
            console.log(`    ✅ [Assertion]: Expected 404 received!`);
          } else {
            throw error;
          }
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  🔒 SCHEMA VALIDATION EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════

  describe('🔒 Schema Validation - Edge Cases', function () {
    it('🔒 Should reject POST object without required fields', function () {
      const invalidPost = {
        title: 'Test',
        // Missing: id, body, userId
      };

      const isValid = validatePost(invalidPost);
      expect(isValid).to.be.false;
      console.log(`    ✅ [Negative Test]: Invalid object correctly rejected!`);
      console.log(
        `    📋 [Details]: Missing fields: ${validatePost.errors.map((e) => e.params.missingProperty).join(', ')}`
      );
    });

    it('🔒 Should reject POST object with wrong types', function () {
      const invalidPost = {
        id: 'not-a-number', // Should be integer
        title: 123, // Should be string
        body: null, // Should be string
        userId: 'abc', // Should be integer
      };

      const isValid = validatePost(invalidPost);
      expect(isValid).to.be.false;
      console.log(`    ✅ [Negative Test]: Type mismatches correctly detected!`);
    });

    it('🔒 Should accept valid POST object', function () {
      const validPost = {
        id: 1,
        title: 'Test Post',
        body: 'This is a test body',
        userId: 1,
      };

      const isValid = validatePost(validPost);
      expect(isValid).to.be.true;
      console.log(`    ✅ [Positive Test]: Valid object passed schema validation!`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  📈 SUMMARY
  // ═══════════════════════════════════════════════════════════════════════

  describe('Test Execution Summary', function () {
    it('📊 All API contract tests completed', function () {
      console.log('\n    ════════════════════════════════════════════════════');
      console.log(`    🎉 API CONTRACT TESTING COMPLETE!`);
      console.log(`    📊 API Test Cases: ${testData.apiTests.length}`);
      console.log(`    🔒 Schema Validations: postSchema, userSchema`);
      console.log(`    📁 Data Source: testData.json + schemas.json`);
      console.log('    ════════════════════════════════════════════════════\n');
      expect(true).to.be.true;
    });
  });
});
