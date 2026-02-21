import { PrismaClient, Habit } from '@prisma/client';

export const toDateKey = (date: Date) => date.toISOString().split('T')[0];

export const startOfDay = (value?: string) => {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const parseRepeatDays = (repeatDays: string | null | undefined): number[] => {
  if (!repeatDays) return [];
  return repeatDays
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
};

export const isHabitScheduledForDate = (habit: Habit, date: Date) => {
  if (habit.repeat !== 'WEEKLY') return true;
  const weekday = date.getDay();
  return parseRepeatDays(habit.repeatDays).includes(weekday);
};

export const computeDailyCompletion = async (prisma: PrismaClient, userId: string, date: Date) => {
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    orderBy: { title: 'asc' },
  });
  const scheduled = habits.filter((habit) => isHabitScheduledForDate(habit, date));

  const logs = await prisma.habitLog.findMany({
    where: { userId, date, completed: true },
    select: { habitId: true },
  });
  const completedSet = new Set(logs.map((log) => log.habitId));
  const done = scheduled.filter((habit) => completedSet.has(habit.id)).length;
  const total = scheduled.length;

  return {
    done,
    total,
    isComplete: total > 0 && done === total,
    completionPct: total > 0 ? Math.round((done / total) * 100) : 0,
    scheduledHabitIds: scheduled.map((h) => h.id),
  };
};

export const computeUserStreak = async (prisma: PrismaClient, userId: string, maxDays = 365) => {
  let streak = 0;
  const today = startOfDay();

  for (let offset = 0; offset < maxDays; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const completion = await computeDailyCompletion(prisma, userId, date);
    if (!completion.isComplete) break;
    streak += 1;
  }

  return streak;
};

export const computeRiskLevel = (completionPct: number, hour: number) => {
  if (completionPct >= 80) return 'LOW';
  if (hour < 14) return completionPct >= 35 ? 'MEDIUM' : 'HIGH';
  if (hour < 20) return completionPct >= 50 ? 'MEDIUM' : 'HIGH';
  return completionPct >= 70 ? 'MEDIUM' : 'HIGH';
};

export const buildSmartSuggestions = (completionPct: number, hour: number) => {
  if (completionPct === 100) {
    return ['Hoy ya cerraste todo. Mantén inercia con un hábito de 2 minutos opcional.'];
  }

  const suggestions: string[] = [];
  if (hour >= 20) {
    suggestions.push('Prioriza solo 1 habito critico ahora y reprograma uno secundario.');
  } else {
    suggestions.push('Haz primero el habito de menor friccion para recuperar momentum.');
  }
  suggestions.push('Activa bloque de 15 minutos sin distracciones para completar pendientes.');
  suggestions.push('Si sigues atascado, reduce el habito a version minima hoy.');
  return suggestions;
};
