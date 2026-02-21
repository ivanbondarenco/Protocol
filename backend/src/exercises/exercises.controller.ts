import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createExerciseSchema = z.object({
  name: z.string().min(2).max(80),
  muscleGroup: z.string().min(2).max(40),
});

export const getExercises = async (_req: Request, res: Response) => {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
    });
    res.status(200).json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createExercise = async (req: Request, res: Response) => {
  try {
    const data = createExerciseSchema.parse(req.body);
    const exercise = await prisma.exercise.create({
      data: {
        name: data.name.trim(),
        muscleGroup: data.muscleGroup.trim().toUpperCase(),
      },
    });
    res.status(201).json(exercise);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Error de validacion', errors: error.errors });
    }
    console.error('Error creating exercise:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

