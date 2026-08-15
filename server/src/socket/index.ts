import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketServer;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
        userId: string; role: string;
      };
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`🔌 User ${userId} connected (${socket.id})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // ── Project rooms ──────────────────────────────────────────────────────
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('presence:joined', {
        userId,
        socketId: socket.id,
        timestamp: new Date(),
      });
    });

    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('presence:left', { userId, timestamp: new Date() });
    });

    // ── Typing indicator ───────────────────────────────────────────────────
    socket.on('task:typing', ({ taskId, projectId }: { taskId: string; projectId: string }) => {
      socket.to(`project:${projectId}`).emit('task:typing', { userId, taskId });
    });

    socket.on('task:stop_typing', ({ taskId, projectId }: { taskId: string; projectId: string }) => {
      socket.to(`project:${projectId}`).emit('task:stop_typing', { userId, taskId });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User ${userId} disconnected`);
    });
  });

  return io;
}

// Emit helpers used by controllers
export function emitToProject(projectId: string, event: string, data: unknown): void {
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (io) io.emit(event, data);
}

export function getIO(): SocketServer { return io; }
