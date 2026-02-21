// src/index.ts
import { app } from './server';
import http from 'http';
import initializeSocketServer from './websocket/socket';
import { startScheduler } from './jobs/scheduler';
import { eventBus } from './core/eventBus';

const PORT = process.env.PORT || 3000;

// Crear un servidor HTTP a partir de la aplicación Express
const httpServer = http.createServer(app);

// Inicializar el servidor Socket.IO con el servidor HTTP
initializeSocketServer(httpServer);
startScheduler();

eventBus.onEvent('habit:toggled', (payload) => {
  console.log('[event] habit:toggled', payload);
});
eventBus.onEvent('habit:completed_day', (payload) => {
  console.log('[event] habit:completed_day', payload);
});
eventBus.onEvent('social:ping_sent', (payload) => {
  console.log('[event] social:ping_sent', payload);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor de Protocol en ejecución en http://localhost:${PORT}`);
  console.log(`🌐 Servidor WebSocket escuchando en el puerto ${PORT}`);
});
