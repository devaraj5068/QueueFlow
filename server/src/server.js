require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Attach socket.io instance to express app
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[QueueFlow Socket] Client connected: ${socket.id}`);

  // Join a specific queue's live room
  socket.on('join:queue', (queueId) => {
    if (queueId) {
      socket.join(`queue:${queueId}`);
      console.log(`[QueueFlow Socket] Socket ${socket.id} joined queue room: queue:${queueId}`);
    }
  });

  // Leave a queue room
  socket.on('leave:queue', (queueId) => {
    if (queueId) {
      socket.leave(`queue:${queueId}`);
      console.log(`[QueueFlow Socket] Socket ${socket.id} left queue room: queue:${queueId}`);
    }
  });

  // Join manager-specific room for cross-queue analytics and status updates
  socket.on('join:manager', (managerId) => {
    if (managerId) {
      socket.join(`manager:${managerId}`);
      console.log(`[QueueFlow Socket] Socket ${socket.id} joined manager room: manager:${managerId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[QueueFlow Socket] Client disconnected: ${socket.id}`);
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`
=====================================================
🚀 QueueFlow Pro Server running on port ${PORT}
📡 Real-Time Socket.IO: ACTIVE
🛡️  Environment: ${process.env.NODE_ENV || 'development'}
🌐 Health Check: http://localhost:${PORT}/api/health
=====================================================
      `);
    });
  } catch (error) {
    console.error('[QueueFlow Pro] Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[QueueFlow Pro] ${signal} received. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('[QueueFlow Pro] HTTP and WebSocket server closed.');
    await disconnectDB();
    console.log('[QueueFlow Pro] Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
