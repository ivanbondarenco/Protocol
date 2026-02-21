import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

let socket: Socket | null = null;

export const getRealtimeSocket = () => {
    if (socket) return socket;
    const token = useAuthStore.getState().token;
    if (!token) return null;

    socket = io('http://localhost:4000', {
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
