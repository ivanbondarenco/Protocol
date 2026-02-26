import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

let socket: Socket | null = null;

export const getRealtimeSocket = () => {
    if (socket) return socket;
    const token = useAuthStore.getState().token;
    if (!token) return null;

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
    });

    return socket;
};

export const closeRealtimeSocket = () => {
    if (!socket) return;
    socket.disconnect();
    socket = null;
};
