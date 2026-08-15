import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '../store/socketStore';
import toast from 'react-hot-toast';

/** Hook: Connect socket on mount, disconnect on unmount */
export function useSocket(token: string | null) {
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (token) connect(token);
    return () => { /* keep connected across page navigations */ };
  }, [token]);

  useEffect(() => {
    return () => disconnect();
  }, []);
}

/** Hook: Listen to real-time task events in a project room */
export function useProjectSocket(projectId: string | undefined) {
  const { socket, joinProject, leaveProject } = useSocketStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !projectId) return;

    joinProject(projectId);

    const handleTaskCreated = (task: unknown) => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('New task added by a team member', { icon: '📋' });
      console.log('task:created', task);
    };

    const handleTaskUpdated = (task: unknown) => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      console.log('task:updated', task);
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      console.log('task:deleted', taskId);
    };

    const handleTaskMoved = () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    };

    const handleTaskCommented = () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    };

    const handlePresenceJoined = ({ userId }: { userId: string }) => {
      toast(`User joined the project`, { icon: '👋', duration: 2000 });
      console.log('presence:joined', userId);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:commented', handleTaskCommented);
    socket.on('presence:joined', handlePresenceJoined);

    return () => {
      leaveProject(projectId);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:commented', handleTaskCommented);
      socket.off('presence:joined', handlePresenceJoined);
    };
  }, [socket, projectId]);
}

/** Hook: Listen to personal notifications via WebSocket */
export function useNotificationSocket() {
  const { socket } = useSocketStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: { title: string; message: string; type: string }) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      const icons: Record<string, string> = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
      toast(data.message, { icon: icons[data.type] || 'ℹ️' });
    };

    socket.on('notification:new', handleNewNotification);
    return () => { socket.off('notification:new', handleNewNotification); };
  }, [socket]);
}
