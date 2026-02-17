// src/websocket/socket.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: SocketIOServer; // Exportar la instancia de io

const initializeSocketServer = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Permitir cualquier origen por ahora, se ajustará en producción
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware de autenticación para WebSockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token; // Obtener el token del handshake

    if (!token) {
      return next(new Error('Token de autenticación requerido para WebSocket.'));
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        console.error('Error de verificación de JWT en WebSocket:', err);
        return next(new Error('Token inválido o expirado para WebSocket.'));
      }
      socket.userId = decoded.userId;
      console.log(`🔌 WebSocket autenticado para usuario: ${socket.userId}`);
      next();
    });
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 Cliente WebSocket conectado y autenticado: ${socket.id} (Usuario ID: ${socket.userId})`);

    // Unir al usuario a una sala específica por su ID
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      console.log(`Usuario ${socket.userId} unido a la sala user:${socket.userId}`);
    }

    socket.on('disconnect', () => {
      console.log(` Cliente WebSocket desconectado: ${socket.id} (Usuario ID: ${socket.userId})`);
      if (socket.userId) {
        socket.leave(`user:${socket.userId}`);
      }
    });

    // Evento de prueba
    socket.on('saludo', (message: string) => {
      console.log(`Mensaje de saludo de ${socket.id} (Usuario ${socket.userId}): ${message}`);
      socket.emit('respuesta-saludo', `¡Servidor recibió tu saludo: ${message}! (Usuario ID: ${socket.userId})`);
      // Ejemplo de emisión a la propia sala del usuario
      if (socket.userId) {
        io.to(`user:${socket.userId}`).emit('notificacion', 'Has recibido una notificación personal!');
      }
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

export default initializeSocketServer;
