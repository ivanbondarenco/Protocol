import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
}

const onboardingSchema = z.object({
  objectives: z.array(z.string()).default([]),
  age: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  activity: z.number().optional(),
  username: z.string().optional(),
});

const buildAdaptivePlan = (objectives: string[]) => {
  const normalized = objectives.map((o) => o.toLowerCase());
  const habits: Array<{ title: string; category: string; repeat: 'DAILY' | 'WEEKLY'; repeatDays?: number[]; difficulty: number }> = [];

  habits.push({ title: 'Review del dia (5m)', category: 'MENTAL', repeat: 'DAILY', difficulty: 1 });
  habits.push({ title: 'Planificacion del dia siguiente', category: 'MENTAL', repeat: 'DAILY', difficulty: 1 });

  if (normalized.includes('fisico')) {
    habits.push({ title: 'Movimiento 30 minutos', category: 'PHYSICAL', repeat: 'DAILY', difficulty: 2 });
    habits.push({ title: 'Movilidad y estiramiento', category: 'PHYSICAL', repeat: 'WEEKLY', repeatDays: [1, 3, 5], difficulty: 2 });
  }
  if (normalized.includes('espiritual')) {
    habits.push({ title: 'Meditacion 10 minutos', category: 'SPIRITUAL', repeat: 'DAILY', difficulty: 1 });
  }
  if (normalized.includes('mental')) {
    habits.push({ title: 'Deep Work bloque 45m', category: 'MENTAL', repeat: 'DAILY', difficulty: 3 });
  }
  if (normalized.includes('financiero')) {
    habits.push({ title: 'Tracking gastos rapido', category: 'FINANCIAL', repeat: 'WEEKLY', repeatDays: [1, 2, 3, 4, 5], difficulty: 1 });
  }
  if (normalized.includes('social')) {
    habits.push({ title: 'Mensaje a un aliado', category: 'SOCIAL', repeat: 'WEEKLY', repeatDays: [1, 3, 5], difficulty: 1 });
  }

  return habits.slice(0, 8);
};

export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });
    const data = onboardingSchema.parse(req.body);

    if (data.username) {
      const username = data.username.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: 'Username ya en uso.' });
      }
      await prisma.user.update({ where: { id: userId }, data: { username } });
    }

    const plan = buildAdaptivePlan(data.objectives);
    const existingHabits = await prisma.habit.count({ where: { userId } });
    if (existingHabits === 0) {
      await prisma.habit.createMany({
        data: plan.map((habit) => ({
          userId,
          title: habit.title,
          category: habit.category,
          repeat: habit.repeat,
          repeatDays: habit.repeat === 'WEEKLY' ? (habit.repeatDays || []).join(',') : null,
          difficulty: habit.difficulty,
        })),
      });
    }

    await prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } });
    res.status(200).json({ ok: true, plan });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    console.error('Onboarding completion failed:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
