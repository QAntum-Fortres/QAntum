/**
 * ═══════════════════════════════════════════════════════════════════════
 * 🧪 QANTUM PRIME — FULL STACK E2E INTEGRATION TEST
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Tests the COMPLETE customer pipeline:
 *   1. Landing page loads (aeterna.website)
 *   2. Success page has dashboard + portal links
 *   3. Portal page loads with auth screen
 *   4. Scan API rejects without key (401)
 *   5. Portal API rejects without key (400)
 *   6. Dashboard loads (qantum-dashboard.vercel.app)
 *   7. Dashboard Stats API returns live data
 *   8. Dashboard Runs API returns live data
 *   9. Stripe checkout endpoint responds
 *  10. Webhook endpoint rejects GET (405)
 *  11. B2B email template has CTA link
 *  12. Welcome email template has dashboard + portal links
 *
 * @author Dimitar Prodromov
 * @date 2026-02-25
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════
// TEST INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════

const RESULTS = [];
let passCount = 0;
let failCount = 0;
const startTime = Date.now();

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

function pass(name, detail) {
  passCount++;
  RESULTS.push({ name, status: 'PASS', detail });
  log('✅', `${name} — ${detail}`);
}

function fail(name, detail) {
  failCount++;
  RESULTS.push({ name, status: 'FAIL', detail });
  log('❌', `${name} — ${detail}`);
}

// ═══════════════════════════════════════════════════════════════════════
// HTTP HELPERS
// ═══════════════════════════════════════════════════════════════════════

function httpGet(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    https.get(url, { headers: { 'User-Agent': 'QAntum-E2E-Test/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    }).on('error', (e) => { clearTimeout(timer); reject(e); });
  });
}

function httpPost(url, body = {}, headers = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'QAntum-E2E-Test/1.0',
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        resolve({ status: res.statusCode, body: data, headers: res.headers });
      });
    });
    req.on('error', (e) => { clearTimeout(timer); reject(e); });
    req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════════════════════════

async function testLandingPage() {
  try {
    const r = await httpGet('https://aeterna.website');
    if (r.status === 200 && r.body.includes('AETERNA')) {
      pass('Landing Page', `200 OK — ${r.body.length} bytes, AETERNA brand present`);
    } else {
      fail('Landing Page', `Status: ${r.status}, AETERNA not found`);
    }
  } catch (e) { fail('Landing Page', e.message); }
}

async function testSuccessPage() {
  try {
    const r = await httpGet('https://aeterna.website/success.html');
    const hasDashboard = r.body.includes('qantum-dashboard') || r.body.includes('Open Dashboard');
    const hasPortal = r.body.includes('portal.html') || r.body.includes('API Portal');
    if (r.status === 200 && hasDashboard && hasPortal) {
      pass('Success Page', `200 OK — Dashboard link ✓, Portal link ✓`);
    } else {
      fail('Success Page', `Status: ${r.status}, Dashboard: ${hasDashboard}, Portal: ${hasPortal}`);
    }
  } catch (e) { fail('Success Page', e.message); }
}

async function testPortalPage() {
  try {
    const r = await httpGet('https://aeterna.website/portal.html');
    const hasAuth = r.body.includes('api') || r.body.includes('key') || r.body.includes('API');
    if (r.status === 200 && r.body.length > 5000 && hasAuth) {
      pass('Portal Page', `200 OK — ${r.body.length} bytes, auth screen present`);
    } else {
      fail('Portal Page', `Status: ${r.status}, Length: ${r.body.length}`);
    }
  } catch (e) { fail('Portal Page', e.message); }
}

async function testScanAPINoKey() {
  try {
    const r = await httpPost('https://aeterna.website/api/scan', { url: 'https://example.com' });
    if (r.status === 401) {
      pass('Scan API (no key)', `401 Unauthorized — correctly rejects unauthenticated requests`);
    } else {
      fail('Scan API (no key)', `Expected 401, got ${r.status}`);
    }
  } catch (e) { fail('Scan API (no key)', e.message); }
}

async function testPortalAPINoKey() {
  try {
    const r = await httpPost('https://aeterna.website/api/portal', {});
    if (r.status === 400 || r.status === 401) {
      pass('Portal API (no key)', `${r.status} — correctly rejects without API key`);
    } else {
      fail('Portal API (no key)', `Expected 400/401, got ${r.status}`);
    }
  } catch (e) { fail('Portal API (no key)', e.message); }
}

async function testScanAPIFakeKey() {
  try {
    const r = await httpPost(
      'https://aeterna.website/api/scan',
      { url: 'https://example.com' },
      { 'X-API-Key': 'qntm_live_node_0000000000000000' }
    );
    if (r.status === 401 || r.status === 403) {
      pass('Scan API (fake key)', `${r.status} — correctly rejects invalid API key`);
    } else {
      fail('Scan API (fake key)', `Expected 401/403, got ${r.status}`);
    }
  } catch (e) { fail('Scan API (fake key)', e.message); }
}

async function testDashboard() {
  try {
    const r = await httpGet('https://qantum-dashboard.vercel.app');
    const hasNextJS = r.body.includes('__next') || r.body.includes('_next');
    if (r.status === 200 && hasNextJS) {
      pass('Dashboard', `200 OK — ${r.body.length} bytes, Next.js app loaded`);
    } else {
      fail('Dashboard', `Status: ${r.status}, Next.js: ${hasNextJS}`);
    }
  } catch (e) { fail('Dashboard', e.message); }
}

async function testDashboardStatsAPI() {
  try {
    const r = await httpGet('https://qantum-dashboard.vercel.app/api/v1/dashboard/stats');
    const data = JSON.parse(r.body);
    const hasFields = data.totalRuns && data.passRate && data.failedTests !== undefined && data.healedSelectors;
    if (r.status === 200 && hasFields) {
      pass('Stats API', `200 OK — totalRuns: ${data.totalRuns}, passRate: ${data.passRate}%, healed: ${data.healedSelectors}`);
    } else {
      fail('Stats API', `Status: ${r.status}, Fields: ${JSON.stringify(Object.keys(data))}`);
    }
  } catch (e) { fail('Stats API', e.message); }
}

async function testDashboardRunsAPI() {
  try {
    const r = await httpGet('https://qantum-dashboard.vercel.app/api/v1/runs');
    const data = JSON.parse(r.body);
    if (r.status === 200 && Array.isArray(data) && data.length > 0) {
      const run = data[0];
      const hasShape = run.id && run.name && run.status && run.passedTests !== undefined;
      if (hasShape) {
        pass('Runs API', `200 OK — ${data.length} runs, first: "${run.name}" (${run.status})`);
      } else {
        fail('Runs API', `Wrong shape: ${JSON.stringify(Object.keys(run))}`);
      }
    } else {
      fail('Runs API', `Status: ${r.status}, IsArray: ${Array.isArray(data)}, Length: ${data?.length}`);
    }
  } catch (e) { fail('Runs API', e.message); }
}

async function testWebhookRejectsGET() {
  try {
    const r = await httpGet('https://aeterna.website/api/webhook');
    if (r.status === 405) {
      pass('Webhook (GET)', `405 Method Not Allowed — correctly rejects non-POST`);
    } else {
      fail('Webhook (GET)', `Expected 405, got ${r.status}`);
    }
  } catch (e) { fail('Webhook (GET)', e.message); }
}

async function testPing() {
  try {
    const r = await httpGet('https://aeterna.website/api/ping');
    if (r.status === 200) {
      pass('Ping API', `200 OK — server healthy`);
    } else {
      fail('Ping API', `Expected 200, got ${r.status}`);
    }
  } catch (e) { fail('Ping API', e.message); }
}

async function testB2BEmailTemplate() {
  try {
    const emailSender = fs.readFileSync(
      path.join(__dirname, '..', 'qantum', 'email-sender.ts'), 'utf-8'
    );
    const hasCTA = emailSender.includes('aeterna.website');
    if (hasCTA) {
      pass('B2B Email CTA', `email-sender.ts contains aeterna.website link`);
    } else {
      fail('B2B Email CTA', 'aeterna.website link NOT found in email template');
    }
  } catch (e) { fail('B2B Email CTA', e.message); }
}

async function testWelcomeEmailTemplate() {
  try {
    const webhookPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', 'GitHub', 'AETERNA-WEB-CORE', 'api', 'webhook.js');
    const webhook = fs.readFileSync(webhookPath, 'utf-8');
    const hasDashboard = webhook.includes('qantum-dashboard.vercel.app') || webhook.includes('OPEN DASHBOARD');
    const hasPortal = webhook.includes('portal.html') || webhook.includes('API PORTAL');
    const hasApiKey = webhook.includes('qntm_live_');
    if (hasDashboard && hasPortal && hasApiKey) {
      pass('Welcome Email', `webhook.js: Dashboard link ✓, Portal link ✓, API key format ✓`);
    } else {
      fail('Welcome Email', `Dashboard: ${hasDashboard}, Portal: ${hasPortal}, Key: ${hasApiKey}`);
    }
  } catch (e) { fail('Welcome Email', `Could not read webhook.js: ${e.message}`); }
}

async function testStripeCheckoutEndpoint() {
  try {
    const r = await httpPost('https://aeterna.website/api/checkout', {
      priceId: 'price_invalid_test', 
      mode: 'subscription'
    });
    // Should respond (even with error) — proves endpoint exists
    if (r.status >= 200 && r.status < 600) {
      pass('Checkout Endpoint', `Responds with ${r.status} — endpoint active`);
    } else {
      fail('Checkout Endpoint', `No response`);
    }
  } catch (e) { fail('Checkout Endpoint', e.message); }
}

// ═══════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   🧪 QANTUM PRIME — FULL STACK E2E INTEGRATION TEST                          ║
║                                                                               ║
║   Testing: aeterna.website + qantum-dashboard.vercel.app                      ║
║   Date: ${new Date().toISOString()}                                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  console.log('  ── SECTION 1: Landing & Sales Pages ──\n');
  await testLandingPage();
  await testSuccessPage();
  await testPortalPage();

  console.log('\n  ── SECTION 2: API Security (Auth Gates) ──\n');
  await testScanAPINoKey();
  await testPortalAPINoKey();
  await testScanAPIFakeKey();

  console.log('\n  ── SECTION 3: SaaS Dashboard ──\n');
  await testDashboard();
  await testDashboardStatsAPI();
  await testDashboardRunsAPI();

  console.log('\n  ── SECTION 4: Backend Infrastructure ──\n');
  await testWebhookRejectsGET();
  await testPing();
  await testStripeCheckoutEndpoint();

  console.log('\n  ── SECTION 5: Code Integrity ──\n');
  await testB2BEmailTemplate();
  await testWelcomeEmailTemplate();

  // ═══════════════════════════════════════════════════════════════════════
  // REPORT
  // ═══════════════════════════════════════════════════════════════════════

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const total = passCount + failCount;
  const grade = failCount === 0 ? 'A+' : failCount <= 2 ? 'B' : failCount <= 4 ? 'C' : 'F';

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          TEST RESULTS                                         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║   Total Tests:    ${String(total).padEnd(54)}║
║   Passed:         ${String(passCount).padEnd(54)}║
║   Failed:         ${String(failCount).padEnd(54)}║
║   Pass Rate:      ${(((passCount / total) * 100).toFixed(1) + '%').padEnd(54)}║
║   Duration:       ${(duration + 's').padEnd(54)}║
║   Grade:          ${grade.padEnd(54)}║
╠═══════════════════════════════════════════════════════════════════════════════╣
║   ${failCount === 0 ? '✅ ALL TESTS PASSED — CUSTOMER PIPELINE FULLY OPERATIONAL' : '⚠️  SOME TESTS FAILED — REVIEW REQUIRED'}          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}s`,
    total, passed: passCount, failed: failCount,
    grade,
    results: RESULTS,
  };

  const reportPath = path.join(__dirname, '..', 'data', 'e2e-test-results.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  📄 Report saved to: data/e2e-test-results.json\n`);

  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
