// src/server.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json()); // Habilitar el parsing de JSON en las solicitudes

// Ruta de prueba
app.get('/api/saludo', (req, res) => {
  res.send('¡Hola, Ivan! El backend de Protocol está en línea.');
});

export { app, prisma };
