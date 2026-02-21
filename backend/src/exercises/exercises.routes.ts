import { Router } from 'express';
import { createExercise, getExercises } from './exercises.controller';

const router = Router();

router.get('/', getExercises);
router.post('/', createExercise);

export default router;

