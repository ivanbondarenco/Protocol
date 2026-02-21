import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { getWeeklyInsights } from './insights.controller';

const router = Router();
router.use(authenticateToken);
router.get('/weekly', getWeeklyInsights);

export default router;
