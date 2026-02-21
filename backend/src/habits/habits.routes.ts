// src/habits/habits.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabit,
  getDailyStatus,
  getHabitRisk,
  rescheduleHabit,
} from './habits.controller';

const router = Router();

// Todas las rutas de hábitos requieren autenticación
router.use(authenticateToken);

router.post('/', createHabit);
router.get('/', getHabits);
router.get('/daily-status', getDailyStatus);
router.get('/risk', getHabitRisk);
router.get('/:id', getHabitById);
router.put('/:id', updateHabit);
router.put('/:id/reschedule', rescheduleHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/toggle', toggleHabit);

export default router;
