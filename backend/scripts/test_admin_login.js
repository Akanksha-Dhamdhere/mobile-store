#!/usr/bin/env node
/**
 * Test Admin Login Flow
 * 
 * This script tests the complete admin login flow:
 * 1. Verify admin credentials exist in database
 * 2. Verify backend server is running
 * 3. Test login endpoint directly
 * 4. Verify session can be retrieved with /api/auth/me
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';
const ADMIN_EMAIL = 'dhamdhereakanksha162@gmail.com';
const ADMIN_PASSWORD = 'akanksha@092007';

function makeRequest(method, path, body = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const setCookieHeader = res.headers['set-cookie'];
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
          headers: res.headers,
          cookie: setCookieHeader ? setCookieHeader[0] : null
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🧪 Admin Login Test Suite\n');
  console.log(`Testing credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`API Base: ${API_BASE}\n`);

  try {
    // Test 1: Check if server is running
    console.log('1️⃣  Checking if backend server is running...');
    const healthRes = await makeRequest('GET', '/api');
    if (healthRes.status === 200 || healthRes.status === 404) {
      console.log('✅ Backend server is running on port 5000\n');
    } else {
      throw new Error('Backend server is not responding correctly');
    }

    // Test 2: Login
    console.log('2️⃣  Attempting admin login...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });

    if (loginRes.status !== 200) {
      console.error('❌ Login failed!');
      console.error(`   Status: ${loginRes.status}`);
      console.error(`   Response: ${JSON.stringify(loginRes.body)}`);
      throw new Error('Login failed');
    }

    if (!loginRes.body.user || loginRes.body.user.role !== 'admin') {
      console.error('❌ Response does not contain admin user');
      console.error(`   Response: ${JSON.stringify(loginRes.body)}`);
      throw new Error('Invalid response');
    }

    console.log('✅ Login successful!');
    console.log(`   User: ${loginRes.body.user.email}`);
    console.log(`   Role: ${loginRes.body.user.role}`);
    console.log(`   ID: ${loginRes.body.user._id}\n`);

    if (!loginRes.cookie) {
      console.warn('⚠️  No Set-Cookie header found in response');
    } else {
      console.log(`✅ Cookie set: ${loginRes.cookie.split(';')[0]}\n`);
    }

    // Test 3: Verify session with /api/auth/me
    console.log('3️⃣  Verifying session with /api/auth/me...');
    if (!loginRes.cookie) {
      console.warn('⚠️  Cannot test session without cookie');
    } else {
      const meRes = await makeRequest('GET', '/api/auth/me', null, loginRes.cookie.split(';')[0]);
      
      if (meRes.status !== 200) {
        console.error('❌ Session verification failed!');
        console.error(`   Status: ${meRes.status}`);
        console.error(`   Response: ${JSON.stringify(meRes.body)}`);
        throw new Error('Session verification failed');
      }

      if (!meRes.body.user || meRes.body.user.role !== 'admin') {
        console.error('❌ Session does not contain admin user');
        throw new Error('Invalid session');
      }

      console.log('✅ Session verification successful!');
      console.log(`   User: ${meRes.body.user.email}`);
      console.log(`   Role: ${meRes.body.user.role}\n`);
    }

    console.log('✅ All tests passed!\n');
    console.log('Instructions to login:');
    console.log('1. Make sure both backend and frontend are running:');
    console.log('   - Backend: cd backend && node server.js');
    console.log('   - Frontend: npm start');
    console.log('2. Go to http://localhost:3000/admin/login');
    console.log(`3. Enter email: ${ADMIN_EMAIL}`);
    console.log(`4. Enter password: ${ADMIN_PASSWORD}`);
    console.log('5. Click Login');
    console.log('\nIf login still fails:');
    console.log('- Check browser console (F12) for CORS errors');
    console.log('- Verify the Network tab shows /api/auth/login returning 200');
    console.log('- Check if token cookie is present in DevTools > Storage > Cookies');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

test();
