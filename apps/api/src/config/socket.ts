import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import cookie from 'cookie';

let io: Server | null = null;

export const initSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware — verify JWT before allowing connection
  io.use((socket: Socket, next) => {
    try {
      const cookiesHeader = socket.handshake.headers.cookie || '';
      const parsedCookies = cookie.parse(cookiesHeader);
      const token =
        parsedCookies['access_token'] || socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.sub;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`Socket connected: ${userId}`);

    // Join a private, user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};

// Global helper for emitting events from services/controllers
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};
