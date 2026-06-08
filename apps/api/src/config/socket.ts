import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MessageEvents, WorkManagementEvents, WorkManagementRooms } from '@teamhub/shared';

let io: Server | null = null;

export const initSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;

    if (!userId) {
      console.warn('Socket connected without userId, disconnecting');
      socket.disconnect();
      return;
    }

    console.log(`Socket connected: ${userId}`);

    // ── Personal room — for targeted notifications & mentions ──
    socket.join(`user:${userId}`);

    // ── Channel room management ────────────────────────────────
    socket.on(MessageEvents.JOIN_CHANNEL, (channelId: string) => {
      if (channelId) socket.join(`channel:${channelId}`);
    });

    socket.on(MessageEvents.LEAVE_CHANNEL, (channelId: string) => {
      if (channelId) socket.leave(`channel:${channelId}`);
    });

    // ── Board room management ──────────────────────────────────
    socket.on(WorkManagementEvents.JOIN_BOARD, (boardId: string) => {
      if (boardId) socket.join(WorkManagementRooms.board(boardId));
    });

    socket.on(WorkManagementEvents.LEAVE_BOARD, (boardId: string) => {
      if (boardId) socket.leave(WorkManagementRooms.board(boardId));
    });

    // ── Typing indicator ───────────────────────────────────────
    // Client emits: { channelId, isTyping, displayName }
    // Server fans out to all other members in the channel room
    socket.on(
      MessageEvents.USER_TYPING,
      (payload: { channelId: string; isTyping: boolean; displayName: string }) => {
        socket.to(`channel:${payload.channelId}`).emit(MessageEvents.USER_TYPING, {
          channelId: payload.channelId,
          userId,
          displayName: payload.displayName,
          isTyping: payload.isTyping,
        });
      },
    );

    // ── Disconnect ─────────────────────────────────────────────
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
