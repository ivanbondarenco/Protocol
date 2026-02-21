import { PrismaClient } from '@prisma/client';
import { eventBus } from '../core/eventBus';
import { computeDailyCompletion, computeRiskLevel, startOfDay } from '../habits/habit.engine';

const prisma = new PrismaClient();

let started = false;

const runHourlyRiskScan = async () => {
  const users = await prisma.user.findMany({ select: { id: true } });
  const today = startOfDay();
  const hour = new Date().getHours();

  for (const user of users) {
    const completion = await computeDailyCompletion(prisma, user.id, today);
    const risk = computeRiskLevel(completion.completionPct, hour);
    if (risk === 'HIGH' && completion.total > 0 && completion.done < completion.total) {
      const allies = await prisma.allyship.findMany({
        where: { userId: user.id },
        select: { allyUserId: true },
        take: 3,
      });
      await Promise.all(allies.map((ally) =>
        prisma.socialPing.create({
          data: {
            fromUserId: user.id,
            toUserId: ally.allyUserId,
            message: 'Tu aliado esta en riesgo de romper racha hoy. Mandale un ping.',
          },
        })
      ));
    }
  }
};

const runDailySnapshot = async () => {
  const today = startOfDay();
  await prisma.weeklyChallenge.updateMany({
    where: { active: true, endDate: { lt: today } },
    data: { active: false },
  });
  eventBus.emitEvent('scheduler:daily_snapshot', { at: new Date().toISOString() });
};

export const startScheduler = () => {
  if (started) return;
  started = true;

  setInterval(async () => {
    try {
      await runHourlyRiskScan();
      eventBus.emitEvent('scheduler:hourly_tick', { at: new Date().toISOString() });
    } catch (error) {
      console.error('Hourly scheduler failed:', error);
    }
  }, 60 * 60 * 1000);

  setInterval(async () => {
    try {
      await runDailySnapshot();
    } catch (error) {
      console.error('Daily snapshot failed:', error);
    }
  }, 24 * 60 * 60 * 1000);
};
