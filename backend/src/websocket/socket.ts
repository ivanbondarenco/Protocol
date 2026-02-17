// src/websocket/socket.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

const initializeSocketServer = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Permitir cualquier origen por ahora, se ajustará en producción
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Aquí se manejarían los eventos de autenticación de WebSockets si fuera necesario
    // Por ahora, registramos el ID del usuario si está autenticado a nivel HTTP
    // socket.on('authenticate', (token) => { /* ... */ });

    socket.on('disconnect', () => {
      console.log(` Cliente desconectado: ${socket.id}`);
    });

    // Evento de prueba
    socket.on('saludo', (message: string) => {
      console.log(`Mensaje de saludo de ${socket.id}: ${message}`);
      socket.emit('respuesta-saludo', `¡Servidor recibió tu saludo: ${message}!`);
    });
  });

  console.log('⚡ Servidor Socket.IO inicializado.');
  return io;
};

export default initializeSocketServer;
