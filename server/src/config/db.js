const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queueflow_pro';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[QueueFlow DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[QueueFlow DB] Primary MongoDB connection failed (${err.message}).`);

    // In non-production, attempt fallback to MongoMemoryServer for standalone zero-config execution
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[QueueFlow DB] Initializing in-memory MongoDB fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memoryUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[QueueFlow DB] Connected to In-Memory MongoDB: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error('[QueueFlow DB] Memory server fallback failed:', memErr.message);
      }
    }

    console.error(`[QueueFlow DB] Fatal connection error: ${err.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[QueueFlow DB] Error during disconnect:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
