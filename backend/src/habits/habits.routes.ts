// src/habits/habits.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  checkInHabit,
} from './habits.controller';

const router = Router();

// Todas las rutas de hábitos requieren autenticación
router.use(authenticateToken);

router.post('/', createHabit);
router.get('/', getHabits);
router.get('/:id', getHabitById);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/check-in', checkInHabit);

export default router;
