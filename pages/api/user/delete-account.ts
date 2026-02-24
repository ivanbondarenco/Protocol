
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const session = await getSession({ req });
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const userId = session.user.id;

  try {
    await prisma.habitLog.deleteMany({ where: { userId: userId } });
    await prisma.habit.deleteMany({ where: { userId: userId } });

    const workoutsToDelete = await prisma.workout.findMany({ where: { userId: userId }, select: { id: true } });
    for (const workout of workoutsToDelete) {
        await prisma.workoutSet.deleteMany({ where: { workoutId: workout.id } });
    }
    await prisma.workout.deleteMany({ where: { userId: userId } });
    await prisma.nutritionLog.deleteMany({ where: { userId: userId } });

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({ message: 'Cuenta eliminada exitosamente' });

  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    await prisma.$disconnect();
  }
}
