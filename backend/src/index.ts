// src/index.ts
import { app } from './server';
import http from 'http';
import initializeSocketServer from './websocket/socket';

const PORT = process.env.PORT || 3000;

// Crear un servidor HTTP a partir de la aplicación Express
const httpServer = http.createServer(app);

// Inicializar el servidor Socket.IO con el servidor HTTP
initializeSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor de Protocol en ejecución en http://localhost:${PORT}`);
  console.log(`🌐 Servidor WebSocket escuchando en el puerto ${PORT}`);
});
