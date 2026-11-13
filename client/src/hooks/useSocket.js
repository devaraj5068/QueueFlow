import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

/**
 * Custom hook to subscribe to real-time queue updates with polling fallback
 * @param {string} queueId
 * @param {string} managerId
 * @param {Function} onUpdate - callback when queue state updates
 */
export const useSocket = (queueId, managerId, onUpdate) => {
  const socketRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep latest callback reference
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    // Initialize Socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (queueId) {
        socket.emit('join:queue', queueId);
      }
      if (managerId) {
        socket.emit('join:manager', managerId);
      }
    });

    socket.on('queue:update', (payload) => {
      if (onUpdateRef.current) {
        onUpdateRef.current(payload);
      }
    });

    // Fallback polling interval every 6 seconds to ensure data freshness
    const pollingInterval = setInterval(() => {
      if (onUpdateRef.current && queueId) {
        onUpdateRef.current({ type: 'polling_sync' });
      }
    }, 6000);

    return () => {
      clearInterval(pollingInterval);
      if (queueId) {
        socket.emit('leave:queue', queueId);
      }
      socket.disconnect();
    };
  }, [queueId, managerId]);

  return socketRef.current;
};
