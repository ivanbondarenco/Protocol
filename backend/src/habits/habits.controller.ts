// src/habits/habits.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getIo } from '../websocket/socket'; // Importar getIo

const prisma = new PrismaClient();

// Esquema de validación para crear un hábito
const createHabitSchema = z.object({
  title: z.string().min(1, 'El título del hábito no puede estar vacío.'),
  category: z.enum(['MINDSET', 'BODY', 'SPIRIT'], { invalid_type_error: 'Categoría de hábito inválida.' }),
});

// Esquema de validación para actualizar un hábito
const updateHabitSchema = z.object({
  title: z.string().min(1, 'El título del hábito no puede estar vacío.').optional(),
  category: z.enum(['MINDSET', 'BODY', 'SPIRIT'], { invalid_type_error: 'Categoría de hábito inválida.' }).optional(),
});

interface AuthRequest extends Request {
  userId?: string;
}

export const createHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { title, category } = createHabitSchema.parse(req.body);

    const habit = await prisma.habit.create({
      data: {
        title,
        category,
        userId,
      },
    });

    res.status(201).json({ message: 'Hábito creado con éxito', habit });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors });
    }
    console.error('Error al crear hábito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { logs: true }, // Incluir logs para mostrar el historial
    });

    res.status(200).json({ habits });
  } catch (error: any) {
    console.error('Error al obtener hábitos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getHabitById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { id } = req.params; // ID del hábito de la URL

    const habit = await prisma.habit.findUnique({
      where: { id, userId }, // Asegurar que el hábito pertenece al usuario
      include: { logs: true },
    });

    if (!habit) {
      return res.status(404).json({ message: 'Hábito no encontrado o no pertenece al usuario.' });
    }

    res.status(200).json({ habit });
  } catch (error: any) {
    console.error('Error al obtener hábito por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { id } = req.params; // ID del hábito de la URL
    const updates = updateHabitSchema.parse(req.body);

    const habit = await prisma.habit.update({
      where: { id, userId }, // Asegurar que el hábito pertenece al usuario
      data: updates,
    });

    res.status(200).json({ message: 'Hábito actualizado con éxito', habit });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors });
    }
    console.error('Error al actualizar hábito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { id } = req.params; // ID del hábito de la URL

    // Asegurar que el hábito pertenece al usuario antes de eliminar
    await prisma.habit.delete({
      where: { id, userId },
    });

    res.status(200).json({ message: 'Hábito eliminado con éxito.' });
  } catch (error: any) {
    console.error('Error al eliminar hábito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const checkInHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const { id: habitId } = req.params; // ID del hábito de la URL
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    // Verificar si ya se hizo check-in hoy
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: { habitId, date: today },
      },
    });

    if (existingLog) {
      return res.status(409).json({ message: 'Ya has hecho check-in para este hábito hoy.' });
    }

    // Crear nuevo log de hábito
    await prisma.habitLog.create({
      data: {
        habitId,
        userId,
        date: today,
        completed: true,
      },
    });

    // Actualizar racha
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (habit) {
      // Lógica de racha: revisar los últimos logs para calcular la racha
      const lastTwoLogs = await prisma.habitLog.findMany({
        where: { habitId, userId },
        orderBy: { date: 'desc' },
        take: 2,
      });

      let newStreak = habit.streak;
      if (lastTwoLogs.length === 1) {
        newStreak = 1; // Primera vez que se registra
      } else if (lastTwoLogs.length === 2) {
        const [latest, previous] = lastTwoLogs;
        const diffTime = Math.abs(latest.date.getTime() - previous.date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = habit.streak + 1; // Racha continua
        } else {
          newStreak = 1; // Racha rota, se reinicia
        }
      }

      const updatedHabit = await prisma.habit.update({
        where: { id: habitId },
        data: { streak: newStreak },
      });

      // Emitir evento WebSocket para actualización de racha
      const io = getIo();
      io.to(`user:${userId}`).emit('habit:updated', { habitId, newStreak: updatedHabit.streak, status: '🔥', message: '¡Tu racha ha sido actualizada!' });

      res.status(200).json({ message: 'Check-in de hábito exitoso', habit: updatedHabit });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validación', errors: error.errors });
    }
    console.error('Error al hacer check-in de hábito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
