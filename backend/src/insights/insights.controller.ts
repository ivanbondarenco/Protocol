import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { computeDailyCompletion, computeUserStreak, startOfDay, toDateKey } from '../habits/habit.engine';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  userId?: string;
}

export const getWeeklyInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: 'Usuario no autenticado.' });

    const today = startOfDay();
    const days = [];
    let completeDays = 0;
    let totalPct = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const completion = await computeDailyCompletion(prisma, userId, date);
      if (completion.isComplete) completeDays += 1;
      totalPct += completion.completionPct;
      days.push({ date: toDateKey(date), ...completion });
    }

    const avgCompletion = Math.round(totalPct / 7);
    const streak = await computeUserStreak(prisma, userId, 365);
    const consistencyScore = Math.round((completeDays / 7) * 100);
    const executionScore = avgCompletion;
    const recoveryScore = avgCompletion >= 70 ? 80 : avgCompletion >= 50 ? 65 : 45;
    const focusScore = Math.min(100, Math.round((streak * 6) + (avgCompletion * 0.4)));
    const score = Math.round((consistencyScore * 0.35) + (executionScore * 0.35) + (recoveryScore * 0.15) + (focusScore * 0.15));

    const recommendations: string[] = [];
    if (avgCompletion < 60) recommendations.push('Reduce complejidad: deja 3 habitos criticos por dia esta semana.');
    if (completeDays < 4) recommendations.push('Activa bloques de ejecucion fijos (manana y noche) para sostener consistencia.');
    if (streak < 3) recommendations.push('Objetivo inmediato: 3 dias seguidos completos antes de escalar dificultad.');
    if (recommendations.length === 0) recommendations.push('Semana solida. Sube dificultad de 1 habito clave o agrega 1 reto social.');

    res.status(200).json({
      streak,
      avgCompletion,
      completeDays,
      score,
      components: { consistencyScore, executionScore, recoveryScore, focusScore },
      days,
      recommendations,
    });
  } catch (error) {
    console.error('Weekly insights failed:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
