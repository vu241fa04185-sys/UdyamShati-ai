// Automated Test for Email Access Verification Flow
const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, text: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING TESTS: EMAIL ACCESS VERIFICATION FLOW');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Test wrong password rejection
  try {
    const res1 = await postJson('http://localhost:5000/api/auth/send-email-access', {
      email: 'kisan@sih.gov.in',
      password: 'wrongpassword'
    });
    assert(res1.statusCode === 401, 'Rejects invalid password with 401');
  } catch (e) {
    assert(false, `Test 1 threw error: ${e.message}`);
  }

  // 2. Test send email access code with valid credentials
  let accessCode = '';
  try {
    const res2 = await postJson('http://localhost:5000/api/auth/send-email-access', {
      email: 'kisan@sih.gov.in',
      password: 'kisan123'
    });
    assert(res2.statusCode === 200, 'Returns 200 OK on valid credentials');
    assert(res2.data.success === true, 'Returns success: true');
    assert(typeof res2.data.accessCode === 'string' && res2.data.accessCode.length === 6, 'Issues 6-digit access code');
    accessCode = res2.data.accessCode;
    console.log(`    Generated Code: ${accessCode}`);
  } catch (e) {
    assert(false, `Test 2 threw error: ${e.message}`);
  }

  // 3. Test verification with wrong access code
  try {
    const res3 = await postJson('http://localhost:5000/api/auth/verify-email-access', {
      email: 'kisan@sih.gov.in',
      code: '000000'
    });
    assert(res3.statusCode === 400, 'Rejects incorrect access code with 400');
    assert(res3.data.error.includes('Invalid access code'), 'Provides clear error message for incorrect code');
  } catch (e) {
    assert(false, `Test 3 threw error: ${e.message}`);
  }

  // 4. Test verification with CORRECT access code
  try {
    const res4 = await postJson('http://localhost:5000/api/auth/verify-email-access', {
      email: 'kisan@sih.gov.in',
      code: accessCode
    });
    assert(res4.statusCode === 200, 'Accepts valid access code with 200 OK');
    assert(res4.data.success === true, 'Returns success: true');
    assert(Boolean(res4.data.token), 'Issues valid JWT authentication token');
    assert(res4.data.session.isAuthenticated === true, 'Returns authenticated session');
    assert(res4.data.session.user.email === 'kisan@sih.gov.in', 'Identifies correct user session');
    assert(res4.data.session.provider === 'email_access', 'Records email_access authentication provider');
  } catch (e) {
    assert(false, `Test 4 threw error: ${e.message}`);
  }

  // 5. Test that used code cannot be reused (one-time use security)
  try {
    const res5 = await postJson('http://localhost:5000/api/auth/verify-email-access', {
      email: 'kisan@sih.gov.in',
      code: accessCode
    });
    assert(res5.statusCode === 400, 'Enforces one-time use (used code rejected on second attempt)');
  } catch (e) {
    assert(false, `Test 5 threw error: ${e.message}`);
  }

  console.log('\n========================================================');
  console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
}

runTests();
