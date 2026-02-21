// src/websocket/socket.ts
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server;

const initializeSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket: Socket, next) => {
    const authSocket = socket as AuthenticatedSocket;
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token de autenticación requerido para WebSocket.'));
    }

    jwt.verify(token, JWT_SECRET, (err: unknown, decoded: unknown) => {
      if (err) {
        console.error('Error de verificación de JWT en WebSocket:', err);
        return next(new Error('Token inválido o expirado para WebSocket.'));
      }

      if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
        authSocket.userId = (decoded as JwtPayload).userId;
        console.log(`🔌 WebSocket autenticado para usuario: ${authSocket.userId}`);
        next();
      } else {
        return next(new Error('Token inválido: falta userId.'));
      }
    });
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`🔌 Cliente WebSocket conectado y autenticado: ${authSocket.id} (Usuario ID: ${authSocket.userId})`);

    if (authSocket.userId) {
      authSocket.join(`user:${authSocket.userId}`);
      console.log(`Usuario ${authSocket.userId} unido a la sala user:${authSocket.userId}`);
    }

    authSocket.on('disconnect', () => {
      console.log(` Cliente WebSocket desconectado: ${authSocket.id} (Usuario ID: ${authSocket.userId})`);
      if (authSocket.userId) {
        authSocket.leave(`user:${authSocket.userId}`);
      }
    });

    authSocket.on('saludo', (message: string) => {
      console.log(`Mensaje de saludo de ${authSocket.id} (Usuario ${authSocket.userId}): ${message}`);
      authSocket.emit('respuesta-saludo', `¡Servidor recibió tu saludo: ${message}! (Usuario ID: ${authSocket.userId})`);
    });
  });

  console.log('⚡ Servidor Socket.IO inicializado.');
  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO no inicializado. Llama a initializeSocketServer primero.');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

export default initializeSocketServer;
