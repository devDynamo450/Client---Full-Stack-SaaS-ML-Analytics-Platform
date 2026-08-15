import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: (token: string) => {
    // Prevent duplicate connections
    const existing = get().socket;
    if (existing?.connected) return;

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      set({ connected: true });
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      set({ connected: false });
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  joinProject: (projectId: string) => {
    get().socket?.emit('project:join', projectId);
  },

  leaveProject: (projectId: string) => {
    get().socket?.emit('project:leave', projectId);
  },
}));
