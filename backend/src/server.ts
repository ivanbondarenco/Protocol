// src/server.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors'; // Importar cors
import authRoutes from './auth/auth.routes'; // Importar rutas de autenticación
import { authenticateToken } from './auth/auth.middleware'; // Importar middleware de autenticación

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json()); // Habilitar el parsing de JSON en las solicitudes
app.use(cors()); // Habilitar CORS para todas las rutas

// Rutas de autenticación (no requieren token)
app.use('/api/auth', authRoutes);

// Ruta de prueba (ahora protegida con JWT)
app.get('/api/saludo-protegido', authenticateToken, (req, res) => {
  res.send(`¡Hola, Ivan! El backend de Protocol está en línea y esta ruta está protegida. Usuario ID: ${req.userId}`);
});

export { app, prisma };
