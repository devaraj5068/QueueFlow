require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/db');
const Manager = require('./models/Manager');
const Queue = require('./models/Queue');
const Token = require('./models/Token');
const { formatTokenCode } = require('./utils/generateToken');

async function seedData() {
  console.log('[QueueFlow Seed] Connecting to database...');
  await connectDB();

  try {
    console.log('[QueueFlow Seed] Clearing existing demo data...');
    // Delete existing demo user if exists
    const demoEmail = 'manager@queueflow.com';
    const existing = await Manager.findOne({ email: demoEmail });
    if (existing) {
      await Token.deleteMany({ manager: existing._id });
      await Queue.deleteMany({ manager: existing._id });
      await Manager.deleteOne({ _id: existing._id });
    }

    console.log('[QueueFlow Seed] Creating demo manager...');
    const manager = await Manager.create({
      name: 'Sarah Jenkins',
      email: demoEmail,
      password: 'Password123!',
    });

    console.log('[QueueFlow Seed] Creating realistic service queues...');
    // Queue 1: Billing Counter
    const billingQueue = await Queue.create({
      manager: manager._id,
      name: 'Billing Counter',
      prefix: 'T',
      nextNumber: 15,
    });

    // Queue 2: Customer Support
    const supportQueue = await Queue.create({
      manager: manager._id,
      name: 'Customer Support',
      prefix: 'C',
      nextNumber: 12,
    });

    // Queue 3: General Enquiry
    const enquiryQueue = await Queue.create({
      manager: manager._id,
      name: 'General Enquiry',
      prefix: 'G',
      nextNumber: 8,
    });

    // Queue 4: Document Verification
    const docQueue = await Queue.create({
      manager: manager._id,
      name: 'Document Verification',
      prefix: 'D',
      nextNumber: 6,
    });

    console.log('[QueueFlow Seed] Creating historical and active tokens...');
    const now = Date.now();

    // Completed & Cancelled historical tokens for Billing Counter (for analytics)
    const historicalTokens = [
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Alexander Hayes',
        number: 1,
        code: formatTokenCode('T', 1),
        status: 'completed',
        position: 0,
        joinedAt: new Date(now - 4 * 60 * 60 * 1000), // 4 hours ago
        servedAt: new Date(now - 3.8 * 60 * 60 * 1000), // wait: ~12 mins
        completedAt: new Date(now - 3.5 * 60 * 60 * 1000),
      },
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Emily Watson',
        number: 2,
        code: formatTokenCode('T', 2),
        status: 'completed',
        position: 0,
        joinedAt: new Date(now - 3.5 * 60 * 60 * 1000),
        servedAt: new Date(now - 3.3 * 60 * 60 * 1000), // wait: ~12 mins
        completedAt: new Date(now - 3.0 * 60 * 60 * 1000),
      },
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Marcus Vance',
        number: 3,
        code: formatTokenCode('T', 3),
        status: 'cancelled',
        position: 0,
        joinedAt: new Date(now - 3.1 * 60 * 60 * 1000),
        cancelledAt: new Date(now - 2.9 * 60 * 60 * 1000),
      },
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Sophia Martinez',
        number: 4,
        code: formatTokenCode('T', 4),
        status: 'completed',
        position: 0,
        joinedAt: new Date(now - 2.5 * 60 * 60 * 1000),
        servedAt: new Date(now - 2.35 * 60 * 60 * 1000), // wait: ~9 mins
        completedAt: new Date(now - 2.1 * 60 * 60 * 1000),
      },
      {
        queue: supportQueue._id,
        manager: manager._id,
        personName: 'David Kim',
        number: 1,
        code: formatTokenCode('C', 1),
        status: 'completed',
        position: 0,
        joinedAt: new Date(now - 5 * 60 * 60 * 1000),
        servedAt: new Date(now - 4.8 * 60 * 60 * 1000),
        completedAt: new Date(now - 4.2 * 60 * 60 * 1000),
      },
      {
        queue: supportQueue._id,
        manager: manager._id,
        personName: 'Chloe Bennett',
        number: 2,
        code: formatTokenCode('C', 2),
        status: 'cancelled',
        position: 0,
        joinedAt: new Date(now - 4.5 * 60 * 60 * 1000),
        cancelledAt: new Date(now - 4.3 * 60 * 60 * 1000),
      },
      {
        queue: enquiryQueue._id,
        manager: manager._id,
        personName: 'Robert Langdon',
        number: 1,
        code: formatTokenCode('G', 1),
        status: 'completed',
        position: 0,
        joinedAt: new Date(now - 2 * 60 * 60 * 1000),
        servedAt: new Date(now - 1.9 * 60 * 60 * 1000),
        completedAt: new Date(now - 1.5 * 60 * 60 * 1000),
      },
    ];

    await Token.insertMany(historicalTokens);

    // Active Serving Token for Billing Counter
    const activeServingToken = await Token.create({
      queue: billingQueue._id,
      manager: manager._id,
      personName: 'Rahul Sharma',
      number: 5,
      code: formatTokenCode('T', 5),
      status: 'serving',
      position: 0,
      joinedAt: new Date(now - 18 * 60 * 1000), // joined 18 mins ago
      servedAt: new Date(now - 4 * 60 * 1000), // serving for 4 mins
    });

    billingQueue.currentServing = activeServingToken._id;
    await billingQueue.save();

    // Active Waiting Tokens for Billing Counter
    const waitingBillingTokens = [
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Priya Patel',
        number: 6,
        code: formatTokenCode('T', 6),
        status: 'waiting',
        position: 1,
        joinedAt: new Date(now - 12 * 60 * 1000),
      },
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Kiran Desai',
        number: 7,
        code: formatTokenCode('T', 7),
        status: 'waiting',
        position: 2,
        joinedAt: new Date(now - 9 * 60 * 1000),
      },
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Ananya Roy',
        number: 8,
        code: formatTokenCode('T', 8),
        status: 'waiting',
        position: 3,
        joinedAt: new Date(now - 5 * 60 * 1000),
      },
      {
        queue: billingQueue._id,
        manager: manager._id,
        personName: 'Devendra Joshi',
        number: 9,
        code: formatTokenCode('T', 9),
        status: 'waiting',
        position: 4,
        joinedAt: new Date(now - 2 * 60 * 1000),
      },
    ];

    await Token.insertMany(waitingBillingTokens);

    // Active Waiting Tokens for Customer Support
    const waitingSupportTokens = [
      {
        queue: supportQueue._id,
        manager: manager._id,
        personName: 'Grace Hopper',
        number: 3,
        code: formatTokenCode('C', 3),
        status: 'waiting',
        position: 1,
        joinedAt: new Date(now - 8 * 60 * 1000),
      },
      {
        queue: supportQueue._id,
        manager: manager._id,
        personName: 'Alan Turing',
        number: 4,
        code: formatTokenCode('C', 4),
        status: 'waiting',
        position: 2,
        joinedAt: new Date(now - 3 * 60 * 1000),
      },
    ];

    await Token.insertMany(waitingSupportTokens);

    console.log(`
=====================================================
🌱 Seed Data Successfully Created!
=====================================================
Manager Credentials:
📧 Email:    ${demoEmail}
🔑 Password: Password123!

Queues Created:
1. Billing Counter (Prefix: T, 1 Serving, 4 Waiting)
2. Customer Support (Prefix: C, 2 Waiting)
3. General Enquiry (Prefix: G)
4. Document Verification (Prefix: D)
=====================================================
    `);
  } catch (err) {
    console.error('[QueueFlow Seed] Error seeding data:', err);
  } finally {
    await disconnectDB();
  }
}

seedData();
