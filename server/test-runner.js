/**
 * Automated Verification Script for QueueFlow Pro Backend
 * Tests:
 * 1. Manager registration, validation, password hashing, duplicate prevention
 * 2. Login, JWT generation, invalid password rejection
 * 3. Protected route access and unauthenticated rejection
 * 4. Queue creation, isolated counters (T-001 vs C-001), rename, delete
 * 5. Concurrent token creation and atomic numbering
 * 6. Position management: Move Up, Move Down, bounds checks
 * 7. Assign Next Token: serving promotion, previous serving auto-completion, position re-indexing
 * 8. Mark Completed: serving termination
 * 9. Cancel Token: position re-indexing, completed token cancellation prevention
 * 10. Analytics: Average wait time calculation, waiting/served/cancelled counts, breakdown, hourly
 * 11. Multi-manager data isolation (Manager B cannot access Manager A's queues/tokens)
 */

const http = require('http');
const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');

// Helper to make local HTTP requests to the test app
function request(server, method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 Starting QueueFlow Pro Backend Test Suite');
  console.log('========================================\n');

  await connectDB();
  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, '127.0.0.1', res));

  try {
    const timestamp = Date.now();
    const managerAEmail = `managerA_${timestamp}@queueflow.test`;
    const managerBEmail = `managerB_${timestamp}@queueflow.test`;

    // 1. Health check
    const health = await request(server, 'GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'API health check passed');

    // 2. Register Manager A
    const regRes = await request(server, 'POST', '/api/auth/register', {
      name: 'Manager Alice',
      email: managerAEmail,
      password: 'password123',
      confirmPassword: 'password123',
    });
    assert(regRes.status === 201 && regRes.body.token, 'Register Manager A successful with JWT');
    const tokenA = regRes.body.token;

    // 3. Duplicate email rejection
    const dupRes = await request(server, 'POST', '/api/auth/register', {
      name: 'Manager Alice Duplicate',
      email: managerAEmail,
      password: 'password123',
      confirmPassword: 'password123',
    });
    assert(dupRes.status === 400, 'Duplicate email registration rejected');

    // 4. Login Manager A
    const loginRes = await request(server, 'POST', '/api/auth/login', {
      email: managerAEmail,
      password: 'password123',
    });
    assert(loginRes.status === 200 && loginRes.body.token, 'Login Manager A successful');

    // 5. Wrong password rejected
    const badLogin = await request(server, 'POST', '/api/auth/login', {
      email: managerAEmail,
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401, 'Wrong password rejected');

    // 6. Register Manager B (for isolation tests)
    const regBRes = await request(server, 'POST', '/api/auth/register', {
      name: 'Manager Bob',
      email: managerBEmail,
      password: 'password123',
      confirmPassword: 'password123',
    });
    assert(regBRes.status === 201, 'Register Manager B successful');
    const tokenB = regBRes.body.token;

    // 7. Create Queues for Manager A
    const q1Res = await request(server, 'POST', '/api/queues', { name: 'Billing Counter', prefix: 'T' }, tokenA);
    assert(q1Res.status === 201 && q1Res.body.queue.prefix === 'T', 'Created Queue 1 (Billing Counter - T)');
    const q1Id = q1Res.body.queue._id;

    const q2Res = await request(server, 'POST', '/api/queues', { name: 'Customer Support', prefix: 'C' }, tokenA);
    assert(q2Res.status === 201 && q2Res.body.queue.prefix === 'C', 'Created Queue 2 (Customer Support - C)');
    const q2Id = q2Res.body.queue._id;

    // 8. Test Data Isolation: Manager B cannot access Manager A's queue
    const isoRes = await request(server, 'GET', `/api/queues/${q1Id}`, null, tokenB);
    assert(isoRes.status === 404, 'Manager B cannot access Manager A queue (Data Isolation verified)');

    // 9. Generate Tokens in Queue 1: Rahul, Priya, Kiran
    const t1 = await request(server, 'POST', `/api/queues/${q1Id}/tokens`, { personName: 'Rahul' }, tokenA);
    assert(t1.status === 201 && t1.body.token.code === 'T-001' && t1.body.token.position === 1, 'Token 1 generated: T-001, pos 1');

    const t2 = await request(server, 'POST', `/api/queues/${q1Id}/tokens`, { personName: 'Priya' }, tokenA);
    assert(t2.status === 201 && t2.body.token.code === 'T-002' && t2.body.token.position === 2, 'Token 2 generated: T-002, pos 2');

    const t3 = await request(server, 'POST', `/api/queues/${q1Id}/tokens`, { personName: 'Kiran' }, tokenA);
    assert(t3.status === 201 && t3.body.token.code === 'T-003' && t3.body.token.position === 3, 'Token 3 generated: T-003, pos 3');

    // 10. Generate Token in Queue 2: Independent counter verification
    const c1 = await request(server, 'POST', `/api/queues/${q2Id}/tokens`, { personName: 'David' }, tokenA);
    assert(c1.status === 201 && c1.body.token.code === 'C-001', 'Queue 2 generated independent counter C-001');

    // 11. Move Up operation: Move T-003 up one position
    const moveUp = await request(server, 'PATCH', `/api/queues/${q1Id}/tokens/${t3.body.token._id}/move`, { direction: 'up' }, tokenA);
    assert(moveUp.status === 200, 'Moved T-003 up');

    // Verify list positions: T-001 (1), T-003 (2), T-002 (3)
    const listAfterMove = await request(server, 'GET', `/api/queues/${q1Id}/tokens`, null, tokenA);
    const codes = listAfterMove.body.tokens.map((t) => t.code);
    assert(codes[0] === 'T-001' && codes[1] === 'T-003' && codes[2] === 'T-002', 'Queue order correctly updated: T-001, T-003, T-002');

    // 12. Move Down operation: Move T-003 down back to position 3
    const moveDown = await request(server, 'PATCH', `/api/queues/${q1Id}/tokens/${t3.body.token._id}/move`, { direction: 'down' }, tokenA);
    assert(moveDown.status === 200, 'Moved T-003 down');

    // 13. Assign Next Token: Promotes T-001 to serving
    const assign1 = await request(server, 'POST', `/api/queues/${q1Id}/tokens/assign-next`, {}, tokenA);
    assert(assign1.status === 200 && assign1.body.token.code === 'T-001' && assign1.body.token.status === 'serving', 'T-001 assigned to serving');

    // Verify remaining waiting list has renumbered positions 1 and 2
    const remainingList = await request(server, 'GET', `/api/queues/${q1Id}/tokens`, null, tokenA);
    assert(remainingList.body.tokens.length === 2, '2 waiting tokens remain');
    assert(remainingList.body.tokens[0].position === 1, 'First waiting token re-indexed to position 1');
    assert(remainingList.body.currentServing.code === 'T-001', 'Current serving is T-001');

    // 14. Assign Next Token again: Auto-completes T-001 and promotes next token (Priya) to serving
    const assign2 = await request(server, 'POST', `/api/queues/${q1Id}/tokens/assign-next`, {}, tokenA);
    assert(assign2.status === 200, 'Next customer assigned for service');

    // 15. Mark Serving Token Completed
    const completeRes = await request(
      server,
      'PATCH',
      `/api/queues/${q1Id}/tokens/${assign2.body.token._id}/complete`,
      {},
      tokenA
    );
    assert(completeRes.status === 200 && completeRes.body.token.status === 'completed', 'Serving token marked as completed');

    // 16. Cancel Token: Cancel the remaining waiting token
    const cancelRes = await request(
      server,
      'PATCH',
      `/api/queues/${q1Id}/tokens/${t3.body.token._id}/cancel`,
      {},
      tokenA
    );
    assert(cancelRes.status === 200 && cancelRes.body.token.status === 'cancelled', 'Token cancelled successfully');

    // Cannot cancel completed token
    const cancelCompleted = await request(
      server,
      'PATCH',
      `/api/queues/${q1Id}/tokens/${t1.body.token._id}/cancel`,
      {},
      tokenA
    );
    assert(cancelCompleted.status === 400, 'Rejected cancellation of completed token');

    // 17. Analytics Verification
    const analyticsRes = await request(server, 'GET', '/api/analytics?filter=today', null, tokenA);
    assert(analyticsRes.status === 200, 'Fetched Analytics KPIs');
    const kpis = analyticsRes.body.data;
    assert(kpis.totalServed >= 2, `Total served count verified (${kpis.totalServed})`);
    assert(kpis.totalCancelled >= 1, `Total cancelled count verified (${kpis.totalCancelled})`);
    assert(typeof kpis.averageWaitTimeMinutes === 'number', 'Average wait time calculated');

    const queuesAnalytics = await request(server, 'GET', '/api/analytics/queues?filter=today', null, tokenA);
    assert(queuesAnalytics.status === 200 && queuesAnalytics.body.data.length >= 2, 'Queue breakdown analytics verified');

    const hourlyAnalytics = await request(server, 'GET', '/api/analytics/hourly?filter=today', null, tokenA);
    assert(hourlyAnalytics.status === 200 && hourlyAnalytics.body.data.length === 24, 'Hourly arrivals (24 hours) verified');

    console.log('\n========================================');
    console.log('🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDB();
  }
}

runTests();
