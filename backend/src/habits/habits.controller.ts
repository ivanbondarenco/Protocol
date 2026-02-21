import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import {
  buildSmartSuggestions,
  computeDailyCompletion,
  computeRiskLevel,
  computeUserStreak,
  parseRepeatDays,
  startOfDay,
  toDateKey,
} from './habit.engine';
import { eventBus } from '../core/eventBus';

const prisma = new PrismaClient();

const createHabitSchema = z.object({
  title: z.string().min(1, 'El titulo del habito no puede estar vacio.'),
  category: z.string().min(1, 'Categoria invalida.'),
  repeat: z.enum(['DAILY', 'WEEKLY']).optional(),
  repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});

const updateHabitSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  repeat: z.enum(['DAILY', 'WEEKLY']).optional(),
  repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
});

const toggleSchema = z.object({
  date: z.string().optional(),
});

const dateSchema = z.object({ date: z.string().optional() });

const rescheduleSchema = z.object({
  repeat: z.enum(['DAILY', 'WEEKLY']),
  repeatDays: z.array(z.number().int().min(0).max(6)).optional(),
});

interface AuthRequest extends Request {
  userId?: string;
}

const buildHistory = (logs: { habitId: string; date: Date; completed: boolean }[]) => {
  const history: Record<string, { completedHabits: string[] }> = {};
  logs.forEach((log) => {
    const key = toDateKey(log.date);
    if (!history[key]) history[key] = { completedHabits: [] };
    if (log.completed) history[key].completedHabits.push(log.habitId);
  });
  return history;
};

const asRepeatDaysString = (repeat: 'DAILY' | 'WEEKLY', repeatDays?: number[]) => {
  if (repeat !== 'WEEKLY') return null;
  return (repeatDays || []).join(',');
};

const updateWeeklyChallengesProgress = async (userId: string, date: Date) => {
  const dayKey = toDateKey(date);
  const activeChallenges = await prisma.weeklyChallengeParticipant.findMany({
    where: {
      userId,
      challenge: {
        active: true,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    },
    include: { challenge: true },
  });

  for (const participant of activeChallenges) {
    const doneDays = new Set((participant.completedDays || '').split(',').filter(Boolean));
    if (!doneDays.has(dayKey)) {
      doneDays.add(dayKey);
      await prisma.weeklyChallengeParticipant.update({
        where: { id: participant.id },
        data: {
          completedDays: Array.from(doneDays).join(','),
          progress: doneDays.size,
        },
      });
    }
  }
};

export const createHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const data = createHabitSchema.parse(req.body);
    const repeat = data.repeat || 'DAILY';
    const repeatDays = asRepeatDaysString(repeat, data.repeatDays);

    const habit = await prisma.habit.create({
      data: {
        title: data.title,
        category: data.category,
        userId,
        repeat,
        repeatDays,
        difficulty: data.difficulty || 1,
      },
    });

    res.status(201).json({ habit: { ...habit, repeatDays: parseRepeatDays(habit.repeatDays) } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error al crear habito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { title: 'asc' },
    });

    const logs = await prisma.habitLog.findMany({
      where: { userId },
      select: { habitId: true, date: true, completed: true },
      orderBy: { date: 'asc' },
    });

    const today = startOfDay();
    const completion = await computeDailyCompletion(prisma, userId, today);
    const streak = await computeUserStreak(prisma, userId);

    res.status(200).json({
      habits: habits.map((habit) => ({ ...habit, repeatDays: parseRepeatDays(habit.repeatDays) })),
      history: buildHistory(logs),
      today: completion,
      streak,
    });
  } catch (error: any) {
    console.error('Error al obtener habitos:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getHabitById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const { id } = req.params;
    const habit = await prisma.habit.findFirst({ where: { id, userId }, include: { logs: true } });
    if (!habit) return res.status(404).json({ message: 'Habito no encontrado.' });

    res.status(200).json({ habit: { ...habit, repeatDays: parseRepeatDays(habit.repeatDays) } });
  } catch (error: any) {
    console.error('Error al obtener habito por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const { id } = req.params;
    const updates = updateHabitSchema.parse(req.body);
    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: 'Habito no encontrado.' });

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...updates,
        repeatDays: updates.repeat ? asRepeatDaysString(updates.repeat, updates.repeatDays) : undefined,
      },
    });

    res.status(200).json({ habit: { ...habit, repeatDays: parseRepeatDays(habit.repeatDays) } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error al actualizar habito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const { id } = req.params;
    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: 'Habito no encontrado.' });

    await prisma.habit.delete({ where: { id } });
    res.status(200).json({ message: 'Habito eliminado con exito.' });
  } catch (error: any) {
    console.error('Error al eliminar habito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const toggleHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const { id: habitId } = req.params;
    const { date } = toggleSchema.parse(req.body ?? {});
    const day = startOfDay(date);

    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) return res.status(404).json({ message: 'Habito no encontrado.' });

    const existingLog = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId, date: day } },
    });

    let toggled = true;
    if (existingLog) {
      toggled = false;
      await prisma.habitLog.delete({ where: { id: existingLog.id } });
    } else {
      await prisma.habitLog.create({
        data: { habitId, userId, date: day, completed: true },
      });
    }

    const completion = await computeDailyCompletion(prisma, userId, day);
    eventBus.emitEvent('habit:toggled', { userId, habitId, day: toDateKey(day), toggled });

    if (completion.isComplete) {
      await updateWeeklyChallengesProgress(userId, day);
      eventBus.emitEvent('habit:completed_day', { userId, day: toDateKey(day) });
    }

    const risk = computeRiskLevel(completion.completionPct, new Date().getHours());
    const suggestions = buildSmartSuggestions(completion.completionPct, new Date().getHours());
    const streak = await computeUserStreak(prisma, userId);

    return res.status(200).json({ toggled, completion, risk, suggestions, streak });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error al alternar habito:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getDailyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const { date } = dateSchema.parse(req.query);
    const day = startOfDay(date);
    const completion = await computeDailyCompletion(prisma, userId, day);
    const risk = computeRiskLevel(completion.completionPct, new Date().getHours());
    const suggestions = buildSmartSuggestions(completion.completionPct, new Date().getHours());
    res.status(200).json({ date: toDateKey(day), completion, risk, suggestions });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getHabitRisk = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const completion = await computeDailyCompletion(prisma, userId, startOfDay());
    const risk = computeRiskLevel(completion.completionPct, new Date().getHours());
    const suggestions = buildSmartSuggestions(completion.completionPct, new Date().getHours());
    res.status(200).json({ risk, completion, suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const rescheduleHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const { id } = req.params;
    const data = rescheduleSchema.parse(req.body);
    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: 'Habito no encontrado.' });

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        repeat: data.repeat,
        repeatDays: asRepeatDaysString(data.repeat, data.repeatDays),
      },
    });

    res.status(200).json({ habit: { ...updated, repeatDays: parseRepeatDays(updated.repeatDays) } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
